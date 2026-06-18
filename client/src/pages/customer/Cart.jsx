import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Flex, HStack, VStack, Text, Button, IconButton, Image, Tooltip,
} from '@chakra-ui/react';
import {
  PastelPageHeader, PastelCard, PastelEmptyState, PastelSkeletonCard, PastelPrice, PastelPageTransition,
} from '../../components/UI';

const trashIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const cartIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cart;
    try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch { cart = []; }
    setItems(cart);
    setLoaded(true);
  }, []);

  const updateQuantity = (id, delta) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    );
    setItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const removeItem = (id) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.setItem('cart', '[]');
  };

  const total = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  if (!loaded) return (
    <Box maxW="800px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <Box h="28px" w="120px" bg="warmGray.200" borderRadius="md" mb={3} />
      <Box h="3px" w="60px" bg="warmGray.200" borderRadius="full" mb={6} />
      {[1, 2, 3].map(i => (
        <PastelSkeletonCard key={i} h="70px" />
      ))}
    </Box>
  );

  return (
    <PastelPageTransition>
      <Box maxW="800px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
        <PastelPageHeader
          title="Carrito"
          description={`${items.length} ${items.length === 1 ? 'producto' : 'productos'}`}
          actions={items.length > 0 && (
            <Button variant="outline" size="sm" color="rose.500" borderColor="warmGray.300" onClick={clearCart} leftIcon={trashIcon}>
              Vaciar carrito
            </Button>
          )}
        />

        {items.length === 0 ? (
          <PastelEmptyState
            title="Tu carrito está vacío"
            description="Explora las pastelerías y agrega productos"
            actionLabel="Ver pastelerías"
            actionPath="/"
          />
        ) : (
          <>
            <VStack spacing={3} mb={6}>
              {items.map((item) => (
                <PastelCard key={item.id} variant="elevated" p={4}>
                  <HStack spacing={4}>
                    {item.image_url && (
                      <Image src={item.image_url} alt={item.name} w="56px" h="56px" borderRadius="lg" objectFit="cover" />
                    )}
                    <Box flex={1} minW={0}>
                      <Text fontSize="sm" fontWeight={600} color="warmGray.800">{item.name}</Text>
                      <PastelPrice value={item.price || 0} size="xs" />
                    </Box>
                    <HStack spacing={2}>
                      <Tooltip label="Disminuir cantidad">
                        <Button
                          aria-label="Disminuir cantidad"
                          size="sm"
                          variant="outline"
                          borderColor="warmGray.300"
                          borderRadius="full"
                          w="30px" h="30px" minW="30px" p={0}
                          fontSize="md" fontWeight={600}
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          −
                        </Button>
                      </Tooltip>
                      <Text fontSize="sm" fontWeight={600} minW="24px" textAlign="center">{item.quantity}</Text>
                      <Tooltip label="Aumentar cantidad">
                        <Button
                          aria-label="Aumentar cantidad"
                          size="sm"
                          variant="outline"
                          borderColor="warmGray.300"
                          borderRadius="full"
                          w="30px" h="30px" minW="30px" p={0}
                          fontSize="md" fontWeight={600}
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          +
                        </Button>
                      </Tooltip>
                    </HStack>
                    <PastelPrice value={(item.price || 0) * item.quantity} size="sm" minW="80px" textAlign="right" />
                    <Tooltip label="Eliminar producto">
                      <IconButton
                        aria-label="Eliminar producto"
                        icon={trashIcon}
                        size="sm"
                        variant="ghost"
                        color="warmGray.400"
                        _hover={{ color: 'rose.500' }}
                        onClick={() => removeItem(item.id)}
                      />
                    </Tooltip>
                  </HStack>
                </PastelCard>
              ))}
            </VStack>

            <PastelCard variant="elevated" p={6}>
              <Flex justify="space-between" align="center" flexDir={{ base: 'column', md: 'row' }} gap={4}>
                <Box>
                  <Text fontSize="xs" color="warmGray.500">Total</Text>
                  <PastelPrice value={total} size="lg" color="brand.700" />
                </Box>
                <Button
                  variant="primary"
                  fontSize="sm"
                  px={8}
                  py={6}
                  onClick={() => navigate('/checkout')}
                  leftIcon={cartIcon}
                >
                  Ir a pagar
                </Button>
              </Flex>
            </PastelCard>
          </>
        )}
      </Box>
    </PastelPageTransition>
  );
}
