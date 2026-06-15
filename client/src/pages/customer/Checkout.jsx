import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Flex, Grid, HStack, VStack, Text, Heading, Button,
  Input, Select, Textarea, Spinner, Alert, AlertIcon,
  FormControl, FormLabel, Divider,
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import { ordersService } from '../../services/ordersService';
import PaymentGateway from '../../components/PaymentGateway';
import {
  PastelPageHeader, PastelCard, PastelPrice, PastelDividerDeco, PastelPageTransition,
} from '../../components/UI';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const checkIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="16 8 11 13 8 10"/>
  </svg>
);

const crossIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const arrowLeft = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [step, setStep] = useState('form');
  const [orderIds, setOrderIds] = useState([]);
  const [pagoResult, setPagoResult] = useState(null);

  const [form, setForm] = useState({
    customerName: '', email: '', phone: '',
    address: '', city: '',
    paymentMethod: 'mercadopago',
    notes: '',
    cardNumber: '4242 4242 4242 4242',
    cardExpiry: '12/28',
    cardCvv: '123',
    cardholderName: '',
  });

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  useEffect(() => {
    let cart;
    try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch { cart = []; }
    if (cart.length === 0) { navigate('/cart'); return; }
    setItems(cart);
  }, [navigate]);

  const total = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const deliveryFee = total > 0 ? 5 : 0;
  const grandTotal = total + deliveryFee;
  const hasMultipleShops = [...new Set(items.map(i => i.shopId).filter(Boolean))].length > 1;

  const handleCreateOrders = async () => {
    if (!form.customerName || !form.address || !form.city) {
      setError('Completa los campos obligatorios');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const shopIds = [...new Set(items.map((i) => i.shopId).filter(Boolean))];
      if (shopIds.length === 0) { setError('Error con el carrito'); setLoading(false); return; }

      const ids = [];
      for (const shopId of shopIds) {
        const shopItems = items.filter((i) => i.shopId === shopId);
        const shopTotal = shopItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
        const orderData = {
          customer: { user_id: user?.uid || '' },
          shop: { shop_id: shopId },
          items: shopItems.map((item) => ({
            product_id: item.id, quantity: item.quantity,
            price_at_purchase: item.price, name: item.name,
          })),
          totals: { subtotal: shopTotal, delivery_fee: 5 },
          payment: { method: form.paymentMethod },
        };
        const res = await ordersService.create(orderData);
        ids.push(res?.id || res?.orderId || '');
      }
      setOrderIds(ids);
      localStorage.setItem('cart', '[]');

      if (form.paymentMethod === 'cash') {
        setStep('processing');
        await sleep(500);
        setPagoResult({ success: true, method: 'cash', message: 'Pagarás en efectivo al recibir el pedido' });
        setStep('done');
      } else {
        setStep('payment_gateway');
      }
    } catch (e) {
      console.error(e);
      setError('Error al crear la orden. Intenta de nuevo.');
    } finally { setLoading(false); }
  };

  const handlePaymentSuccess = (result) => {
    setPagoResult(result);
    setStep('done');
  };

  const handlePaymentError = (msg) => {
    setError(msg);
    setStep('form');
  };

  if (step === 'done') {
    const ok = pagoResult?.success;
    return (
      <PastelPageTransition>
        <Box maxW="500px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 12, md: 16 }} textAlign="center">
          <Flex
            w="72px" h="72px" mx="auto" mb={4}
            borderRadius="50%"
            bg={ok ? 'accent.100' : 'rose.100'}
            color={ok ? 'accent.600' : 'rose.600'}
            align="center" justify="center"
          >
            {ok ? checkIcon : crossIcon}
          </Flex>
          <Heading as="h2" fontFamily="heading" fontSize="2xl" fontWeight={700} color={ok ? 'brand.700' : 'rose.500'} mb={2}>
            {ok ? 'Pedido confirmado' : 'Pago rechazado'}
          </Heading>
          <Text fontFamily="body" fontSize="sm" color="warmGray.500" mb={1} lineHeight={1.6}>
            {pagoResult?.message || (ok
              ? 'Tu orden está en proceso. Te notificaremos cuando esté lista.'
              : 'Hubo un problema con el pago. Intenta con otro método.')}
          </Text>
          {pagoResult?.transactionRef && (
            <Text fontFamily="body" fontSize="xs" color="warmGray.400" mt={2}>
              Ref: {pagoResult.transactionRef}
            </Text>
          )}
          <PastelDividerDeco variant="dots" spacing="24px" />
          <Button variant="primary" mt={2} px={8} py={6} fontSize="sm" onClick={() => navigate('/my-orders')}>
            Ver mis órdenes
          </Button>
        </Box>
      </PastelPageTransition>
    );
  }

  if (step === 'processing') {
    return (
      <PastelPageTransition>
        <Box maxW="500px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 16, md: 20 }} textAlign="center">
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="warmGray.200"
            color="accent.500"
            size="xl"
            mb={5}
          />
          <Heading as="h3" fontFamily="heading" fontSize="lg" color="brand.700" mb={2}>
            Procesando pago
          </Heading>
          <Text fontFamily="body" fontSize="xs" color="warmGray.500">Estamos verificando tu pago...</Text>
          <Box w="200px" h="4px" bg="warmGray.200" borderRadius="full" mx="auto" mt={5} overflow="hidden">
            <Box w="50%" h="full" bgGradient="linear(90deg, #22C55E, #2D1810)" borderRadius="full" />
          </Box>
        </Box>
      </PastelPageTransition>
    );
  }

  if (step === 'payment_gateway') {
    return (
      <PastelPageTransition>
        <Box maxW="480px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 8, md: 10 }}>
          <Button
            variant="ghost"
            color="accent.600"
            fontSize="xs"
            p={0}
            mb={5}
            onClick={() => { setStep('form'); setOrderIds([]); localStorage.setItem('cart', JSON.stringify(items)); }}
            leftIcon={arrowLeft}
          >
            Volver
          </Button>
          <Heading as="h2" fontFamily="heading" fontSize="2xl" fontWeight={700} color="brand.700" mb={1}>
            Pago
          </Heading>
          <Text fontFamily="body" fontSize="xs" color="warmGray.500" mb={6}>Completa el pago para confirmar tu pedido</Text>

          <PastelCard variant="elevated">
            <Flex justify="space-between" fontSize="sm" fontWeight={600} fontFamily="heading" color="brand.700">
              <Text>Total a pagar</Text>
              <PastelPrice value={grandTotal} size="sm" />
            </Flex>
          </PastelCard>

          {hasMultipleShops && (
            <Text fontSize="xs" color="warmGray.500" fontFamily="body" mt={3}>
              El pago se procesa para la primera orden. Las demás quedan registradas con pago pendiente.
            </Text>
          )}

          <PaymentGateway
            orderIds={orderIds}
            total={grandTotal}
            email={user?.email || form.email}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onBack={() => { setStep('form'); setOrderIds([]); localStorage.setItem('cart', JSON.stringify(items)); }}
          />
        </Box>
      </PastelPageTransition>
    );
  }

  return (
    <PastelPageTransition>
      <Box maxW="1000px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
        <PastelPageHeader title="Checkout" description="Revisa tu pedido y completa los datos" />

        {error && (
          <Alert status="error" variant="left-accent" borderRadius="lg" mb={4} fontSize="sm" fontFamily="body">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {success && (
          <Alert status="success" variant="left-accent" borderRadius="lg" mb={4} fontSize="sm" fontFamily="body">
            <AlertIcon />
            {success}
          </Alert>
        )}

        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
          <Box>
            <PastelCard title="Datos de entrega" variant="elevated">
              <VStack spacing={3} align="stretch">
                <FormControl>
                  <FormLabel fontSize="xs" color="warmGray.500" mb={1}>Nombre completo *</FormLabel>
                  <Input size="sm" fontSize="xs" value={form.customerName} onChange={(e) => update('customerName', e.target.value)} placeholder="Tu nombre" />
                </FormControl>
                <Grid templateColumns="1fr 1fr" gap={3}>
                  <FormControl>
                    <FormLabel fontSize="xs" color="warmGray.500" mb={1}>Email</FormLabel>
                    <Input size="sm" fontSize="xs" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="correo@ejemplo.com" />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" color="warmGray.500" mb={1}>Teléfono</FormLabel>
                    <Input size="sm" fontSize="xs" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="999 999 999" />
                  </FormControl>
                </Grid>
                <FormControl>
                  <FormLabel fontSize="xs" color="warmGray.500" mb={1}>Dirección *</FormLabel>
                  <Input size="sm" fontSize="xs" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Av. Ejemplo 123" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" color="warmGray.500" mb={1}>Ciudad *</FormLabel>
                  <Input size="sm" fontSize="xs" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Lima" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" color="warmGray.500" mb={1}>Método de pago</FormLabel>
                  <Select size="sm" fontSize="xs" value={form.paymentMethod} onChange={(e) => update('paymentMethod', e.target.value)}>
                    <option value="mercadopago">MercadoPago</option>
                    <option value="card">Tarjeta de crédito/débito</option>
                    <option value="cash">Efectivo</option>
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" color="warmGray.500" mb={1}>Notas</FormLabel>
                  <Textarea size="sm" fontSize="xs" minH="60px" resize="vertical" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Instrucciones especiales..." />
                </FormControl>
              </VStack>
            </PastelCard>
          </Box>

          <Box>
            <PastelCard title="Resumen del pedido" variant="elevated">
              <VStack spacing={2.5} align="stretch">
                {items.map((item) => (
                  <Flex key={item.id} justify="space-between" fontSize="xs" fontFamily="body">
                    <Text color="warmGray.800">
                      <Box as="strong">{item.quantity}x</Box> {item.name}
                    </Text>
                    <PastelPrice value={(item.price || 0) * item.quantity} size="xs" />
                  </Flex>
                ))}
              </VStack>
              <Divider my={3} borderColor="warmGray.200" />
              <Flex justify="space-between" fontSize="xs" fontFamily="body" mb={1}>
                <Text color="warmGray.500">Subtotal</Text>
                <PastelPrice value={total} size="xs" color="warmGray.500" />
              </Flex>
              <Flex justify="space-between" fontSize="xs" fontFamily="body" mb={1}>
                <Text color="warmGray.500">Delivery</Text>
                <PastelPrice value={deliveryFee} size="xs" color="warmGray.500" />
              </Flex>
              <Flex justify="space-between" fontSize="lg" fontWeight={700} fontFamily="heading" color="brand.700" mt={2} pt={3} borderTop="1px" borderColor="warmGray.200">
                <Text>Total</Text>
                <PastelPrice value={grandTotal} size="md" color="brand.700" />
              </Flex>
            </PastelCard>

            {form.paymentMethod === 'cash' && (
              <Alert status="warning" variant="left-accent" borderRadius="lg" mb={4} fontSize="xs" fontFamily="body">
                <AlertIcon />
                Pagarás en efectivo al recibir tu pedido. No es necesario procesar un pago ahora.
              </Alert>
            )}

            {form.paymentMethod === 'mercadopago' && (
              <Alert status="success" variant="left-accent" borderRadius="lg" mb={4} fontSize="xs" fontFamily="body">
                <AlertIcon />
                Paga con MercadoPago — tarjetas, transferencia o efectivo. Redirigiremos al portal de pago.
              </Alert>
            )}

            {form.paymentMethod === 'card' && (
              <Alert status="success" variant="left-accent" borderRadius="lg" mb={4} fontSize="xs" fontFamily="body">
                <AlertIcon />
                Demo: Después de crear la orden, podrás pagar con tarjeta.
              </Alert>
            )}

            <Button
              variant="primary"
              w="full"
              py={6}
              fontSize="sm"
              onClick={handleCreateOrders}
              isLoading={loading}
              loadingText="Creando orden..."
            >
              Confirmar pedido — S/ {grandTotal.toFixed(2)}
            </Button>
          </Box>
        </Grid>
      </Box>
    </PastelPageTransition>
  );
}
