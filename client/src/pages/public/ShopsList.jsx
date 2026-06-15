import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopsService } from '../../services/shopsService';
import { useDebounce } from '../../utils/useDebounce';
import {
  PastelCard, PastelStatusBadge, PastelEmptyState, PastelErrorState,
  PastelSkeletonCard, PastelSkeletonHero, PastelSkeletonShopCard, PastelHero, PastelRating, PastelTag, PastelInfoRow, PastelPageTransition,
} from '../../components/UI';
import {
  Box, Flex, Text, Heading, Input, SimpleGrid, IconButton,
} from '@chakra-ui/react';

const searchIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const clearIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function ShopsList() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await shopsService.getAll();
        setShops(data?.data || []);
      } catch (e) {
        console.error(e);
        setError('Error al cargar las pastelerías');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const approved = shops.filter(s => s.approvalStatus === 'approved');
    if (!debouncedSearch.trim()) return approved;
    const q = debouncedSearch.toLowerCase();
    return approved.filter(s =>
      (s.shopName || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q) ||
      (s.shopDescription || s.description || '').toLowerCase().includes(q)
    );
  }, [shops, debouncedSearch]);

  const approvedCount = useMemo(() => shops.filter(s => s.approvalStatus === 'approved').length, [shops]);

  return (
    <PastelPageTransition>
      <Box minH="100vh" bg="warmGray.50">
        <PastelHero
          title={
            <>
              Descubre las mejores<br />
              <Box as="span" color="#FDE68A" position="relative">
                pastelerías artesanales
                <Box position="absolute" bottom="-4px" left={0} right={0} h="3px" bg="rgba(253,230,138,0.3)" borderRadius="full" />
              </Box>
            </>
          }
          subtitle="Explora una selección de las mejores pastelerías locales. Encuentra tu postre favorito y ordénalo con un clic."
          gradient="dark"
          size="lg"
        >
          <Flex
            align="center"
            gap={3}
            bg="rgba(255,255,255,0.1)"
            borderRadius="14px"
            p="6px 6px 6px 16px"
            maxW="500px"
            border="1px solid"
            borderColor="rgba(255,255,255,0.15)"
            backdropFilter="blur(8px)"
            transition="border-color 0.2s"
            _focusWithin={{ borderColor: 'rgba(253,230,138,0.5)' }}
          >
            <Box color="whiteAlpha.600" flexShrink={0}>
              {searchIcon}
            </Box>
            <Input
              placeholder="Buscar por nombre, ciudad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              variant="unstyled"
              flex={1}
              py={3.5}
              fontSize="14px"
              fontFamily="body"
              color="white"
              _placeholder={{ color: 'whiteAlpha.500' }}
            />
            {search && (
              <IconButton
                icon={clearIcon}
                size="sm"
                variant="ghost"
                onClick={() => setSearch('')}
                color="whiteAlpha.600"
                _hover={{ bg: 'whiteAlpha.200' }}
                aria-label="Limpiar búsqueda"
              />
            )}
          </Flex>
        </PastelHero>

        {/* Stats bar */}
        <Box maxW="1100px" mx="auto" px={{ base: 4, md: 6 }} mt="-1.5rem" position="relative" zIndex={2}>
          <Flex
            align="center"
            gap={6}
            bg="white"
            borderRadius="16px"
            px={6}
            py={4}
            boxShadow="0 4px 20px rgba(0,0,0,0.06)"
          >
            <Box>
              <Text fontSize="20px" fontWeight={700} color="brand.900" fontFamily="body" lineHeight={1.2}>
                {approvedCount}
              </Text>
              <Text fontSize="12px" color="warmGray.500" fontFamily="body">
                pastelerías activas
              </Text>
            </Box>
            {debouncedSearch && (
              <Text fontSize="13px" color="warmGray.400" fontFamily="body">
                {filtered.length} resultados para &ldquo;{debouncedSearch}&rdquo;
              </Text>
            )}
          </Flex>
        </Box>

        {error && (
          <Box maxW="1100px" mx="auto" px={{ base: 4, md: 6 }} mb={4}>
            <PastelErrorState
              title="Error al cargar"
              message={error}
              onRetry={() => window.location.reload()}
              onBack={() => navigate('/')}
            />
          </Box>
        )}

        {loading ? (
          <Box>
            <PastelSkeletonHero />
            <Box maxW="1100px" mx="auto" px={{ base: 4, md: 6 }} pt={6} pb={12}>
              <PastelSkeletonProductGrid count={6} />
            </Box>
          </Box>
        ) : filtered.length === 0 ? (
          <Box pt={6}>
            <PastelEmptyState
              title={search ? 'Sin resultados' : 'No hay pastelerías disponibles'}
              description={search ? `No encontramos nada para "${search}"` : 'Vuelve pronto para descubrir nuevas opciones'}
            />
          </Box>
        ) : (
          <Box maxW="1100px" mx="auto" px={{ base: 4, md: 6 }} pb={12}>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
              {filtered.map((shop) => (
                <PastelCard
                  key={shop.id}
                  variant="elevated"
                  p={0}
                  cursor="pointer"
                  onClick={() => navigate(`/shops/${shop.id}`)}
                  _hover={{ transform: 'translateY(-4px)', boxShadow: '0 12px 28px rgba(0,0,0,0.12)' }}
                  transition="transform 0.25s ease, box-shadow 0.25s ease"
                  mb={0}
                >
                  {/* Banner */}
                  <Box
                    position="relative"
                    h="160px"
                    overflow="hidden"
                    bg={shop.bannerUrl ? undefined : 'linear-gradient(135deg, #2D1810, #6B4226)'}
                  >
                    {shop.bannerUrl && (
                      <Box
                        as="img"
                        src={shop.bannerUrl}
                        alt=""
                        w="100%" h="100%"
                        objectFit="cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <Box position="absolute" top={3} right={3}>
                      <PastelStatusBadge status={shop.approvalStatus || 'pending'} />
                    </Box>
                  </Box>

                  <Box px={6} pb={6} position="relative">
                    {/* Logo avatar */}
                    <Flex
                      w="72px" h="72px"
                      borderRadius="50%"
                      overflow="hidden"
                      mt="-36px"
                      mb={3}
                      border="3px solid white"
                      bg="warmGray.50"
                      align="center"
                      justify="center"
                      boxShadow="0 4px 12px rgba(0,0,0,0.08)"
                    >
                      {shop.logoUrl ? (
                        <Box
                          as="img"
                          src={shop.logoUrl}
                          alt=""
                          w="100%" h="100%"
                          objectFit="cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C48B5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                      )}
                    </Flex>

                    {/* Name */}
                    <Heading as="h3" fontFamily="heading" fontSize="20px" fontWeight={700} color="brand.900" mb={1}>
                      {shop.shopName}
                    </Heading>

                    {/* City & Rating */}
                    <Flex
                      align="center"
                      gap={1.5}
                      fontSize="13px"
                      color="warmGray.500"
                      fontFamily="body"
                      mb={2.5}
                      flexWrap="wrap"
                    >
                      <PastelInfoRow icon="location" label={shop.city} />
                      {shop.rating !== undefined && shop.rating > 0 && (
                        <Flex align="center" gap={1}>
                          <PastelRating value={shop.rating} size="sm" showValue={false} />
                        </Flex>
                      )}
                    </Flex>

                    {/* Description */}
                    {(shop.shopDescription || shop.description) && (
                      <Text
                        fontSize="13px"
                        color="warmGray.600"
                        fontFamily="body"
                        lineHeight={1.6}
                        mb={4}
                        noOfLines={2}
                      >
                        {shop.shopDescription || shop.description}
                      </Text>
                    )}

                    {/* Categories chips */}
                    {shop.categories && shop.categories.length > 0 && (
                      <Flex gap={1.5} flexWrap="wrap" mb={3.5}>
                        {shop.categories.slice(0, 3).map((cat, i) => (
                          <PastelTag key={i} size="sm">
                            {typeof cat === 'string' ? cat : cat.name || ''}
                          </PastelTag>
                        ))}
                        {shop.categories.length > 3 && (
                          <PastelTag color="gray" size="sm">+{shop.categories.length - 3}</PastelTag>
                        )}
                      </Flex>
                    )}

                    {/* Bottom row */}
                    {shop.address && (
                      <Flex
                        fontSize="12px"
                        color="warmGray.400"
                        fontFamily="body"
                        pt={3}
                        borderTop="1px solid"
                        borderTopColor="warmGray.200"
                        align="center"
                        gap={1.5}
                      >
                        <Box as="span" w="14px" h="14px" color="warmGray.300" flexShrink={0}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                        </Box>
                        <Text as="span">{shop.address}</Text>
                      </Flex>
                    )}
                  </Box>
                </PastelCard>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Box>
    </PastelPageTransition>
  );
}
