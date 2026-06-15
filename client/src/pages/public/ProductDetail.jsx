import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsService } from '../../services/productsService';
import { shopsService } from '../../services/shopsService';
import {
  PastelPageHeader, PastelCard, PastelEmptyState, PastelErrorState,
  PastelSkeletonPage, PastelPrice, PastelQuantitySelector,
  PastelImageWithZoom, PastelPageTransition,
} from '../../components/UI';
import {
  Box, Flex, Grid, Heading, Text, Button, SimpleGrid,
} from '@chakra-ui/react';

export default function ProductDetail() {
  const { shop: shopSlug, id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [related, setRelated] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [added, setAdded] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const prod = await productsService.getById(id);
        if (!prod || Object.keys(prod).length === 0) {
          setError('Producto no encontrado');
          setLoading(false);
          return;
        }
        setProduct(prod);
        const [shopData, relatedData] = await Promise.all([
          shopsService.getById(prod.shop_id),
          (async () => { try { return await productsService.getByShop(prod.shop_id); } catch { return { data: [] }; } })(),
        ]);
        setShop(shopData);
        const others = (relatedData?.data || []).filter(p => p.id !== prod.id && p.is_available !== false);
        setRelated(others.slice(0, 4));
        try {
          const v = await productsService.getVariants(id);
          setVariants(v?.data || []);
        } catch (e) { console.warn('Failed to load variants:', e); }
      } catch (e) {
        setError(e.message || 'Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  function addToCart() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item.id === product.id && item.variant === selectedVariant);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        shopId: product.shop_id,
        shopName: shop?.name || '',
        name: product.name,
        price: product.price + (selectedVariant ? selectedVariant.extra_price : 0),
        image_url: product.image_url,
        variant: selectedVariant,
        quantity,
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    setAdded(true);
    setToast(`${product.name} agregado al carrito`);
    setTimeout(() => setAdded(false), 1200);
    setTimeout(() => setToast(''), 2500);
  }

  function handleRelatedClick(prodId) {
    navigate(`/producto/${shopSlug}/${prodId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const price = product?.price ?? 0;
  const variantExtra = selectedVariant ? selectedVariant.extra_price : 0;
  const unitPrice = price + variantExtra;
  const totalPrice = unitPrice * quantity;

  if (loading) {
    return (
      <Box minH="100vh" bg="warmGray.50">
        <Box maxW="1000px" mx="auto" px={{ base: 4, md: 6 }} py={8}>
          <PastelSkeletonPage cards={2} />
        </Box>
      </Box>
    );
  }

  if (error && !product) {
    return (
      <Box minH="100vh" bg="warmGray.50">
        <Box maxW="500px" mx="auto" py={20} px={5}>
          <PastelErrorState
            title="Producto no encontrado"
            message={error}
            onBack={() => navigate(-1)}
          />
        </Box>
      </Box>
    );
  }

  return (
    <PastelPageTransition>
      <Box minH="100vh" bg="warmGray.50">
        <Box maxW="1000px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
          <PastelPageHeader
            breadcrumbs={[
              { label: 'Inicio', href: '/' },
              { label: shop?.name || 'Tienda', href: `/shops/${product.shop_id}` },
              { label: product.name },
            ]}
          />

          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={8} alignItems="start">
            <Box>
              <PastelImageWithZoom
                src={product.image_url}
                alt={product.name}
                h={{ base: '280px', md: '400px' }}
                borderRadius="16px"
                fallback="brand"
              />
              <Text fontFamily="body" fontSize="11px" color="warmGray.400" textAlign="center" mt={2}>
                {product.image_url ? 'Click para ampliar' : 'Sin imagen disponible'}
              </Text>
            </Box>

            <Box>
              {shop && (
                <Flex
                  display="inline-flex"
                  align="center"
                  gap={1.5}
                  bg="accent.50"
                  color="accent.600"
                  px={3}
                  py={1}
                  borderRadius="99px"
                  fontSize="11px"
                  fontWeight={600}
                  fontFamily="body"
                  mb={2.5}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  {shop.name}
                </Flex>
              )}

              <Heading as="h1" fontFamily="heading" fontSize="26px" fontWeight={700} color="brand.900" mb={2} lineHeight={1.2}>
                {product.name}
              </Heading>

              <Flex align="baseline" gap={2.5} mb={4}>
                <PastelPrice value={unitPrice} size="lg" />
                {selectedVariant && selectedVariant.extra_price > 0 && (
                  <Text fontSize="13px" color="warmGray.500" fontWeight={400}>
                    (+S/ {selectedVariant.extra_price.toFixed(2)})
                  </Text>
                )}
                {quantity > 1 && (
                  <Text fontSize="13px" color="warmGray.400" fontWeight={400}>
                    (S/ {totalPrice.toFixed(2)} total)
                  </Text>
                )}
              </Flex>

              {product.stock !== undefined && product.stock !== null && (
                <Flex
                  display="inline-flex"
                  align="center"
                  gap={1.5}
                  fontFamily="body"
                  fontSize="13px"
                  px={3}
                  py={1.5}
                  borderRadius="99px"
                  mb={5}
                  bg={product.stock === 0 ? '#fee2e2' : product.stock <= 5 ? '#fef3c7' : '#e1f5ee'}
                  color={product.stock === 0 ? '#dc2626' : product.stock <= 5 ? '#d97706' : '#059669'}
                  fontWeight={500}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {product.stock === 0
                    ? 'Agotado'
                    : product.stock <= 5
                      ? `Solo quedan ${product.stock} unidades`
                      : `${product.stock} en stock`
                  }
                </Flex>
              )}

              {product.description && (
                <Text
                  fontFamily="body"
                  fontSize="14px"
                  color="warmGray.500"
                  lineHeight={1.8}
                  mb={6}
                  pt={4}
                  borderTop="1px solid"
                  borderTopColor="warmGray.100"
                >
                  {product.description}
                </Text>
              )}

              {variants.length > 0 && (
                <Box mb={5}>
                  <Heading as="h4" fontFamily="heading" fontSize="13px" fontWeight={600} color="brand.900" mb={2} textTransform="uppercase" letterSpacing="0.03em">
                    Variantes
                  </Heading>
                  <Flex flexWrap="wrap" gap={2}>
                    {variants.map((v, i) => (
                      <Button
                        key={i}
                        size="sm"
                        borderRadius="99px"
                        fontSize="13px"
                        fontFamily="body"
                        variant="outline"
                        border="1.5px solid"
                        borderColor={selectedVariant?.type === v.type && selectedVariant?.value === v.value ? 'accent.500' : 'warmGray.200'}
                        bg={selectedVariant?.type === v.type && selectedVariant?.value === v.value ? '#e1f5ee' : 'white'}
                        color={selectedVariant?.type === v.type && selectedVariant?.value === v.value ? 'accent.500' : 'brand.900'}
                        fontWeight={selectedVariant?.type === v.type && selectedVariant?.value === v.value ? 600 : 400}
                        _hover={{ bg: selectedVariant?.type === v.type && selectedVariant?.value === v.value ? '#e1f5ee' : 'warmGray.50' }}
                        onClick={() => setSelectedVariant(selectedVariant?.type === v.type && selectedVariant?.value === v.value ? null : v)}
                      >
                        {v.value} {v.extra_price > 0 ? `(+S/ ${v.extra_price.toFixed(2)})` : ''}
                      </Button>
                    ))}
                  </Flex>
                </Box>
              )}

              <Box mb={5}>
                <Heading as="h4" fontFamily="heading" fontSize="13px" fontWeight={600} color="brand.900" mb={2} textTransform="uppercase" letterSpacing="0.03em">
                  Cantidad
                </Heading>
                <PastelQuantitySelector value={quantity} onChange={setQuantity} max={product.stock || 999} />
              </Box>

              <Button
                variant="primary"
                w="100%"
                py={4}
                fontSize="15px"
                onClick={addToCart}
                isDisabled={product.stock === 0}
                opacity={product.stock === 0 ? 0.5 : 1}
                bg={added ? 'green.500' : undefined}
                colorScheme={added ? 'green' : undefined}
                transform={added ? 'scale(0.98)' : 'scale(1)'}
                transition="all 0.2s"
                leftIcon={
                  product.stock === 0 ? undefined : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                  )
                }
              >
                {product.stock === 0 ? (
                  'Agotado'
                ) : (
                  <>
                    {added ? '✓ Agregado' : 'Agregar al Carrito'}
                    <Box as="span" fontSize="13px" opacity={0.8} ml={2}>— S/ {totalPrice.toFixed(2)}</Box>
                  </>
                )}
              </Button>
            </Box>
          </Grid>

          {/* Related Products */}
          {related.length > 0 && (
            <Box mt={12}>
              <Heading as="h2" fontFamily="heading" fontSize="20px" fontWeight={700} color="brand.900" mb={4}>
                Productos Relacionados
              </Heading>
              <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={3.5}>
                {related.map((p) => (
                  <PastelCard
                    key={p.id}
                    variant="elevated"
                    p={0}
                    cursor="pointer"
                    onClick={() => handleRelatedClick(p.id)}
                    _hover={{ transform: 'translateY(-3px)', boxShadow: '0 6px 16px rgba(0,0,0,0.1)' }}
                    transition="transform 0.2s ease, box-shadow 0.2s ease"
                    mb={0}
                  >
                    {p.image_url ? (
                      <Box
                        as="img"
                        src={p.image_url}
                        alt={p.name}
                        w="100%" h="120px"
                        objectFit="cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <Flex w="100%" h="120px" bg="warmGray.100" align="center" justify="center" color="warmGray.300">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                      </Flex>
                    )}
                    <Box px={3} py={2.5}>
                      <Text fontFamily="heading" fontSize="13px" fontWeight={600} color="brand.900" mb={1} noOfLines={1}>
                        {p.name}
                      </Text>
                      <Flex justify="space-between" align="center">
                        <PastelPrice value={p.price || 0} size="xs" />
                        {p.stock !== undefined && p.stock <= 5 && p.stock > 0 && (
                          <Text fontSize="10px" color="#f59e0b">{p.stock} uds</Text>
                        )}
                        {p.stock === 0 && (
                          <Text fontSize="10px" color="#dc2626">Agotado</Text>
                        )}
                      </Flex>
                    </Box>
                  </PastelCard>
                ))}
              </SimpleGrid>
            </Box>
          )}
        </Box>

        {/* Toast */}
        {toast && (
          <Box
            position="fixed"
            bottom="24px"
            left="50%"
            transform="translateX(-50%)"
            bg="brand.900"
            color="white"
            px={6}
            py={3}
            borderRadius="99px"
            fontFamily="body"
            fontSize="14px"
            boxShadow="0 4px 12px rgba(0,0,0,0.15)"
            zIndex={1000}
          >
            {toast}
          </Box>
        )}
      </Box>
    </PastelPageTransition>
  );
}
