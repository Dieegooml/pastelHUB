import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box, Flex, Text, Button, VStack, Alert, AlertIcon,
} from '@chakra-ui/react';
import { paymentsService } from '../services/paymentsService';

const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || '';

const PAYMENT_METHODS = [
  { id: 'mercadopago', label: 'MercadoPago', icon: '🟡', desc: 'Tarjeta, transferencia o efectivo' },
  { id: 'card', label: 'Tarjeta', icon: '💳', desc: 'Débito o crédito' },
  { id: 'yape', label: 'Yape', icon: '📱', desc: 'Paga desde Yape' },
  { id: 'plin', label: 'Plin', icon: '📱', desc: 'Paga desde Plin' },
  { id: 'cash', label: 'Efectivo', icon: '💵', desc: 'Paga al recibir' },
];

function loadMercadoPagoScript() {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) { resolve(window.MercadoPago); return; }
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => resolve(window.MercadoPago);
    script.onerror = () => reject(new Error('Error cargando SDK de MercadoPago'));
    document.body.appendChild(script);
  });
}

function PaymentGateway({ orderIds, total, onSuccess, onBack, email }) {
  const [method, setMethod] = useState('mercadopago');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mpReady, setMpReady] = useState(false);
  const [preferenceId, setPreferenceId] = useState('');

  const hasMpConfig = !!MP_PUBLIC_KEY;

  useEffect(() => {
    if (hasMpConfig) {
      loadMercadoPagoScript()
        .then(() => setMpReady(true))
        .catch(() => setMpReady(false));
    }
  }, [hasMpConfig]);

  useEffect(() => {
    if (mpReady && preferenceId && method === 'mercadopago') {
      try {
        const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'es-PE' });
        mp.checkout({
          preference: { id: preferenceId },
          render: { container: '#mp-checkout-container', label: 'Pagar con MercadoPago' },
        });
      } catch (e) {
        console.error('Error rendering MercadoPago checkout', e);
      }
    }
  }, [mpReady, preferenceId, method]);

  const handleCreatePreference = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await paymentsService.createPreference({
        orderId: orderIds[0],
        backUrls: {
          success: `${window.location.origin}/my-orders`,
          failure: `${window.location.origin}/checkout`,
          pending: `${window.location.origin}/my-orders`,
        },
      });
      setPreferenceId(result.preferenceId);
      if (result.initPoint && !result.initPoint.startsWith('#')) {
        window.open(result.initPoint, '_blank');
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError('Error al conectar con MercadoPago');
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await paymentsService.processGateway({
        orderId: orderIds[0],
        paymentMethod: method,
        amount: total,
        cardDetails: method === 'card' ? { last4: '4242', cardholderName: email || 'Cliente' } : undefined,
      });
      if (result.success) {
        onSuccess(result);
      } else {
        setError(result.errorMessage || 'Pago rechazado');
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setError('Error al procesar el pago');
      setLoading(false);
    }
  };

  const handleMercadoPago = async () => {
    if (preferenceId) return;
    await handleCreatePreference();
  };

  if (method === 'cash') {
    return (
      <Box>
        <Alert status="info" bg="accent.50" borderRadius="lg" mb={4} borderLeft="4px solid" borderLeftColor="accent.400">
          <AlertIcon />
          <Text fontSize="sm">💵 Pagarás en efectivo al recibir tu pedido. No necesitas hacer nada ahora.</Text>
        </Alert>
        <Flex gap={3} mt={4}>
          {onBack && (
            <Button variant="outline" size="lg" flex={1} onClick={onBack}>
              Volver
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            flex={1}
            onClick={() => onSuccess({ success: true, method: 'cash', message: 'Pagarás en efectivo al recibir' })}
          >
            Confirmar pedido
          </Button>
        </Flex>
      </Box>
    );
  }

  if (method === 'mercadopago') {
    const showMpButton = hasMpConfig && (mpReady || preferenceId);
    return (
      <Box>
        <Alert status="success" bg="accent.50" borderRadius="lg" mb={4} borderLeft="4px solid" borderLeftColor="accent.400">
          <AlertIcon />
          <Text fontSize="sm">🟡 Paga con MercadoPago — tarjetas, transferencia o efectivo en agentes autorizados.</Text>
        </Alert>
        {error && <Alert status="error" borderRadius="lg" mb={4}>{error}</Alert>}
        {!showMpButton ? (
          <Box>
            {!hasMpConfig && (
              <Alert status="warning" borderRadius="lg" mb={4}>
                <AlertIcon />
                <Text fontSize="sm">⚡ Modo simulado: MercadoPago no está configurado. Se usará el gateway de prueba.</Text>
              </Alert>
            )}
            <Box id="mp-checkout-container" minH="48px" mb={3} />
            <Button
              variant="primary"
              w="full"
              size="lg"
              onClick={handleMercadoPago}
              isLoading={loading}
              loadingText="Conectando con MercadoPago..."
            >
              {hasMpConfig ? 'Pagar con MercadoPago' : 'Simular pago MercadoPago'}
            </Button>
          </Box>
        ) : (
          <Box>
            <Box id="mp-checkout-container" minH="48px" mb={3} />
            {!hasMpConfig && (
              <Button
                variant="primary"
                w="full"
                size="lg"
                onClick={handleProcessPayment}
                isLoading={loading}
                loadingText="Procesando..."
              >
                {`Pagar S/ ${total.toFixed(2)}`}
              </Button>
            )}
          </Box>
        )}
        {onBack && (
          <Button variant="link" color="accent.600" mt={2} fontSize="sm" onClick={onBack}>
            ← Otro método de pago
          </Button>
        )}
      </Box>
    );
  }

  if (method === 'yape' || method === 'plin') {
    const isYape = method === 'yape';
    return (
      <Box>
        <Box bg="white" borderRadius="xl" p={6} boxShadow="sm" border="1px solid" borderColor="brand.100" textAlign="center" mb={4}>
          <Flex
            w="160px" h="160px"
            bg={isYape ? 'pink.400' : 'blue.500'}
            borderRadius="xl"
            mx="auto"
            mb={4}
            align="center"
            justify="center"
          >
            <Box w="120px" h="120px" bg="white" borderRadius="lg" display="flex" alignItems="center" justifyContent="center" flexDirection="column">
              <Text fontSize="4xl" mb={1}>{isYape ? '🔵' : '🟣'}</Text>
              <Text fontSize="xs" fontWeight={700} fontFamily="heading" color="brand.800">{isYape ? 'YAPE' : 'PLIN'}</Text>
              <Text fontSize="2xs" color="warmGray.500" fontFamily="mono" mt={0.5}>PastelHub</Text>
              <Text fontSize="2xs" color="warmGray.400" fontFamily="mono">S/ {total.toFixed(2)}</Text>
            </Box>
          </Flex>
          <Text fontSize="sm" color="warmGray.600" mb={1}>1. Abre {isYape ? 'Yape' : 'Plin'}</Text>
          <Text fontSize="sm" color="warmGray.600" mb={1}>2. Escanea el código QR</Text>
          <Text fontSize="sm" color="warmGray.600">3. Confirma el pago</Text>
        </Box>
        <Alert status="warning" borderRadius="lg" mb={4}>
          <AlertIcon />
          <Text fontSize="sm">⚡ Demo: Haz clic en "Confirmar pago" para simular.</Text>
        </Alert>
        {error && <Alert status="error" borderRadius="lg" mb={4}>{error}</Alert>}
        <Flex gap={3}>
          {onBack && (
            <Button variant="outline" size="lg" flex={1} onClick={onBack}>
              Volver
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            flex={1}
            onClick={handleProcessPayment}
            isLoading={loading}
            loadingText="Verificando..."
          >
            Confirmar pago
          </Button>
        </Flex>
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert status="error" borderRadius="lg" mb={4}>{error}</Alert>}
      <VStack spacing={3} mb={4}>
        {PAYMENT_METHODS.map((pm) => {
          const isActive = method === pm.id;
          return (
            <Flex
              key={pm.id}
              onClick={() => setMethod(pm.id)}
              p={4}
              borderRadius="lg"
              cursor="pointer"
              bg={isActive ? 'accent.50' : 'white'}
              border="2px solid"
              borderColor={isActive ? 'accent.400' : 'brand.100'}
              transition="all 0.2s"
              _hover={{ borderColor: isActive ? 'accent.400' : 'brand.300' }}
              align="center"
              gap={3}
              w="full"
            >
              <Text fontSize="2xl" w="36px" textAlign="center">{pm.icon}</Text>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight={600} color="brand.800" fontFamily="heading">{pm.label}</Text>
                <Text fontSize="xs" color="warmGray.500">{pm.desc}</Text>
              </Box>
              {isActive && <Text color="accent.500" fontSize="xl">✓</Text>}
            </Flex>
          );
        })}
      </VStack>
    </Box>
  );
}

PaymentGateway.propTypes = {
  orderIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  total: PropTypes.number.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
  onBack: PropTypes.func,
  email: PropTypes.string,
};

export default PaymentGateway;
