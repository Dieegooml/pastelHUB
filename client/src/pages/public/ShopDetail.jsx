import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shopsService } from '../../services/shopsService';
import { productsService } from '../../services/productsService';
import { slugify } from '../../utils/slug';
import { reviewsService } from '../../services/reviewsService';
import {
  PastelPageHeader, PastelCard, PastelStatusBadge,
  PastelEmptyState, PastelErrorState, PastelSection,
  PastelFilterBar, PastelSkeletonPage, PastelRating,
  PastelInfoRow, PastelTag, PastelPrice, PastelPageTransition,
} from '../../components/UI';
import {
  Box, Flex, Grid, Heading, Text, Button, Image, SimpleGrid, VStack,
} from '@chakra-ui/react';

export default function ShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toast, setToast] = useState('');
  const [addedIds, setAddedIds] = useState({});
  const timeoutsRef = useRef([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [shopData, productsData, reviewsData] = await Promise.all([
          shopsService.getById(id),
          productsService.getByShop(id),
          reviewsService.getByShop(id).catch(() => []),
        ]);
        setShop(shopData);
        setProducts(productsData?.data || []);
        setReviews(reviewsData?.data || []);
      } catch (e) { console.error(e); setLoadError('Error al cargar la pastelería'); } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category_id).filter(Boolean))];
  }, [products]);

  const filterOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'Todas' }];
    categories.forEach(cat => opts.push({ value: cat, label: cat }));
    return opts;
  }, [categories]);

  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return products.filter((p) => p.is_available !== false);
    return products.filter((p) => p.category_id === categoryFilter && p.is_available !== false);
  }, [products, categoryFilter]);

  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  const addToCart = (product) => {
    let cart;
    try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch { cart = []; }
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: product.id, shopId: id, shopName: shop?.shopName || shop?.name, name: product.name, price: product.price, image_url: product.image_url, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    setAddedIds((p) => ({ ...p, [product.id]: true }));
    setToast(`${product.name} agregado al carrito`);
    timeoutsRef.current.push(setTimeout(() => setToast(''), 2500));
    timeoutsRef.current.push(setTimeout(() => setAddedIds((p) => ({ ...p, [product.id]: false })), 1200));
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="warmGray.50">
        <Box maxW="1100px" mx="auto" px={{ base: 4, md: 8 }} py={10}>
          <PastelSkeletonPage cards={2} />
        </Box>
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box minH="100vh" bg="warmGray.50">
        <Box maxW="900px" mx="auto" px={{ base: 4, md: 8 }} py={10}>
          <PastelErrorState
            title="Error al cargar"
            message={loadError}
            onBack={() => navigate('/')}
          />
        </Box>
      </Box>
    );
  }

  if (!shop) {
    return (
      <Box minH="100vh" bg="warmGray.50">
        <Box maxW="900px" mx="auto" px={{ base: 4, md: 8 }} py={10}>
          <PastelEmptyState
            title="Pastelería no encontrada"
            description="La pastelería que buscas no existe o ha sido eliminada"
            actionLabel="Volver al inicio"
            onAction={() => navigate('/')}
          />
        </Box>
      </Box>
    );
  }

  return (
    <PastelPageTransition>
      <Box minH="100vh" bg="warmGray.50">
        <Box maxW="1100px" mx="auto" px={{ base: 4, md: 8 }} py={10} pb={8}>
          <PastelPageHeader
            breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: shop.shopName || shop.name }]}
          />

          {/* Banner */}
          <Box
            bg={shop.bannerUrl || shop.banner_url
              ? `url(${shop.bannerUrl || shop.banner_url}) center/cover no-repeat`
              : 'linear-gradient(135deg, #2D1810, #6B4226)'}
            h="220px"
            borderRadius="12px"
            position="relative"
            mb={14}
          >
            {(shop.logoUrl || shop.logo_url) && (
              <Image
                src={shop.logoUrl || shop.logo_url}
                alt={shop.shopName || shop.name}
                position="absolute"
                bottom="-55px"
                left="32px"
                w="110px"
                h="110px"
                borderRadius="50%"
                border="4px solid white"
                objectFit="cover"
                bg="white"
              />
            )}
          </Box>

          {/* Shop name + status */}
          <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={3} mb={6}>
            <Box>
              <Heading as="h1" fontFamily="heading" fontSize="28px" fontWeight={700} color="brand.900" m={0}>
                {shop.shopName || shop.name}
              </Heading>
              <PastelInfoRow icon="location" color="warm">
                {shop.city}{shop.address ? ` — ${shop.address}` : ''}
              </PastelInfoRow>
            </Box>
            <PastelStatusBadge status={shop.approvalStatus || shop.status || 'active'} />
          </Flex>

          <Grid templateColumns={{ base: '1fr', md: '1fr 320px' }} gap={7} alignItems="start">
            <Box>
              <Flex align="center" justify="space-between" flexWrap="wrap" gap={3} mb={4}>
                <Heading as="h2" fontFamily="heading" fontSize="22px" fontWeight={700} color="brand.900" m={0}>
                  Productos
                </Heading>
                <Text fontSize="13px" color="warmGray.400" fontFamily="body">
                  {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
                </Text>
              </Flex>

              {categories.length > 1 && (
                <Box mb={5}>
                  <PastelFilterBar
                    options={filterOptions}
                    active={categoryFilter}
                    onChange={setCategoryFilter}
                  />
                </Box>
              )}

              {filtered.length === 0 ? (
                <PastelEmptyState
                  title={categoryFilter !== 'all' ? 'No hay productos en esta categoría' : 'Esta pastelería aún no tiene productos disponibles'}
                />
              ) : (
                <SimpleGrid columns={{ base: 2, sm: 3, md: 2, lg: 3 }} gap={4}>
                  {filtered.map((p) => (
                    <PastelCard
                      key={p.id}
                      variant="elevated"
                      p={0}
                      display="flex"
                      flexDir="column"
                      mb={0}
                      transition="transform 0.2s ease, box-shadow 0.2s ease"
                      _hover={{ transform: 'translateY(-3px)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                    >
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.name} w="100%" h="140px" objectFit="cover" onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        <Flex w="100%" h="140px" bg="warmGray.100" align="center" justify="center" color="warmGray.300">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                        </Flex>
                      )}
                      <Box p={3} flex={1} display="flex" flexDir="column">
                        <Button
                          variant="link"
                          fontFamily="heading"
                          fontSize="15px"
                          fontWeight={600}
                          color="brand.900"
                          textAlign="left"
                          p={0}
                          minH="auto"
                          h="auto"
                          onClick={() => navigate(`/producto/${slugify(shop?.name)}/${p.id}`)}
                        >
                          {p.name}
                        </Button>
                        {p.description && (
                          <Text fontFamily="body" fontSize="11px" color="warmGray.500" mt={0.5} mb={1.5} lineHeight={1.4} flex={1}>
                            {p.description}
                          </Text>
                        )}
                        {p.stock !== undefined && p.stock !== null && p.stock <= 5 && p.stock > 0 && (
                          <Text fontSize="10px" color="#b45309" fontFamily="body" mb={1}>
                            Solo quedan {p.stock}
                          </Text>
                        )}
                        <Flex justify="space-between" align="center" mt="auto" pt={1.5} borderTop="1px solid" borderTopColor="warmGray.100">
                          <PastelPrice value={p.price || 0} size="sm" />
                          <Button
                            size="xs"
                            borderRadius="99px"
                            fontSize="11px"
                            fontWeight={600}
                            fontFamily="body"
                            bg={addedIds[p.id] ? 'green.500' : 'accent.500'}
                            color="white"
                            _hover={!addedIds[p.id] ? { bg: '#168959' } : undefined}
                            transform={addedIds[p.id] ? 'scale(0.95)' : 'scale(1)'}
                            onClick={() => addToCart(p)}
                          >
                            {addedIds[p.id] ? '✓' : 'Agregar'}
                          </Button>
                        </Flex>
                      </Box>
                    </PastelCard>
                  ))}
                </SimpleGrid>
              )}
            </Box>

            {/* Sidebar */}
            <VStack spacing={4} align="stretch">
              {(shop.shopDescription || shop.description) && (
                <PastelCard title="Descripción" variant="elevated">
                  <Text fontFamily="body" fontSize="13px" color="warmGray.500" m={0} lineHeight={1.7}>
                    {shop.shopDescription || shop.description}
                  </Text>
                </PastelCard>
              )}

              <PastelCard title="Información" variant="elevated">
                <VStack spacing={0} align="stretch" divider={<Box h="1px" bg="warmGray.100" />}>
                  {shop.rating !== undefined && shop.rating > 0 && (
                    <PastelInfoRow icon="star" color="warm">
                      <Flex align="center" gap={2}>
                        <PastelRating value={shop.rating} showValue />
                        <Text as="span" fontSize="12px" color="warmGray.400">/ 5</Text>
                      </Flex>
                    </PastelInfoRow>
                  )}
                  <PastelInfoRow icon="location" label="Dirección" color="brand">
                    {shop.address || shop.city || '—'}
                  </PastelInfoRow>
                  {shop.phone && (
                    <PastelInfoRow icon="phone" label="Teléfono" color="blue" href={`tel:${shop.phone}`}>
                      {shop.phone}
                    </PastelInfoRow>
                  )}
                  {shop.email && (
                    <PastelInfoRow icon="mail" label="Email" color="blue" href={`mailto:${shop.email}`}>
                      {shop.email}
                    </PastelInfoRow>
                  )}
                  {shop.delivery_range && (
                    <PastelInfoRow icon="truck" label="Cobertura" color="accent">
                      {shop.delivery_range} km
                    </PastelInfoRow>
                  )}
                  {shop.owner_name && (
                    <PastelInfoRow icon="user" label="Dueño" color="rose">
                      {shop.owner_name}
                    </PastelInfoRow>
                  )}
                </VStack>
              </PastelCard>

              {shop.schedules && shop.schedules.length > 0 && (
                <PastelCard title="Horarios" variant="elevated">
                  <VStack spacing={1} align="stretch">
                    {shop.schedules.map((s, i) => (
                      <Flex key={i} justify="space-between" fontSize="12px" fontFamily="body">
                        <Text color="warmGray.500">{s.day || s.dayOfWeek}</Text>
                        <Text color="brand.900">{s.open} — {s.close}</Text>
                      </Flex>
                    ))}
                  </VStack>
                </PastelCard>
              )}

              {shop.categories && shop.categories.length > 0 && (
                <PastelCard title="Categorías" variant="elevated">
                  <Flex gap={1.5} flexWrap="wrap">
                    {shop.categories.map((cat, i) => (
                      <PastelTag key={i} size="sm">{cat.name || cat}</PastelTag>
                    ))}
                  </Flex>
                </PastelCard>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <PastelCard title={`Reseñas (${reviews.length})`} variant="elevated">
                  <VStack spacing={3.5} align="stretch">
                    {reviews.slice(0, 5).map((r) => (
                      <Box key={r.id} borderBottom="1px solid" borderBottomColor="warmGray.200" pb={2.5}>
                        <PastelRating value={r.rating} size="sm" showValue={false} />
                        {r.comment && <Text fontFamily="body" fontSize="12px" color="brand.900" m={0} lineHeight={1.5}>{r.comment}</Text>}
                        {r.ownerReply && (
                          <Box mt={1.5} p={2} bg="warmGray.100" borderRadius="6px" fontSize="11px" color="warmGray.500" fontFamily="body" borderLeft="2px solid" borderLeftColor="accent.500">
                            <Text as="strong" color="accent.500">Dueño:</Text> {r.ownerReply}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </VStack>
                </PastelCard>
              )}
            </VStack>
          </Grid>
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
            fontSize="14px"
            fontFamily="body"
            boxShadow="0 4px 16px rgba(0,0,0,0.2)"
            zIndex={1000}
          >
            {toast}
          </Box>
        )}
      </Box>
    </PastelPageTransition>
  );
}
