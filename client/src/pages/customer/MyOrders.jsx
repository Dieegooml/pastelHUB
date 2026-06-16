import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Flex, HStack, VStack, Text, Button,
} from '@chakra-ui/react';
import { ordersService } from '../../services/ordersService';
import {
  PastelPageHeader, PastelCard, PastelEmptyState, PastelSkeletonCard,
  PastelFilterBar, PastelStatusBadge,
} from '../../components/UI';

const STATUS_TRANSLATIONS = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'Preparando',
  on_the_way: 'En camino', delivered: 'Entregado', cancelled: 'Cancelado',
};

const STATUSES = ['all', 'pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'];

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await ordersService.getMy();
        const list = Array.isArray(res) ? res : res?.data || [];
        setOrders(list);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleCancel = useCallback(async (e, orderId) => {
    e.stopPropagation();
    if (!window.confirm('¿Cancelar esta orden?')) return;
    setCancellingId(orderId);
    try {
      await ordersService.cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      } catch (e) { console.error(e); } finally { setCancellingId(null); }
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  return (
    <Box maxW="800px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <PastelPageHeader title="Mis Órdenes" icon="📋" />

      <PastelFilterBar
        active={filter}
        onChange={setFilter}
        options={STATUSES.map(s => ({
          value: s,
          label: s === 'all' ? 'Todas' : STATUS_TRANSLATIONS[s],
        }))}
      />

      {loading ? (
        <VStack spacing={3}>
          {[1, 2, 3].map((i) => (
            <PastelSkeletonCard key={i} h="80px" />
          ))}
        </VStack>
      ) : filtered.length === 0 ? (
        <PastelEmptyState
          icon="📋"
          title={filter === 'all' ? 'No tienes órdenes aún' : `No hay órdenes ${STATUS_TRANSLATIONS[filter]?.toLowerCase()}`}
          actionLabel="Ver pastelerías"
          actionPath="/"
        />
      ) : (
        <VStack spacing={3}>
          {filtered.map((o) => (
            <PastelCard
              key={o.id}
              variant="elevated"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/my-orders/${o.id}`)}
            >
              <Flex justify="space-between" align="center" flexDir={{ base: 'column', md: 'row' }} gap={{ base: 2, md: 0 }}>
                <Box flex={1} w={{ base: 'full', md: 'auto' }}>
                  <HStack spacing={2} mb={1}>
                    <Text fontFamily="monospace" fontSize="xs" color="warmGray.500">
                      #{o.id?.slice(0, 8)}
                    </Text>
                    <Text fontSize="xs" color="warmGray.800" fontWeight={500}>
                      {o.shop?.name || 'Pastelería'}
                    </Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Text fontSize="xs" color="warmGray.400">{formatDate(o.created_at)}</Text>
                    <Text fontSize="md" fontWeight={700} color="brand.700">
                      S/ {(o.totals?.total || 0).toFixed(2)}
                    </Text>
                    <PastelStatusBadge status={o.status} />
                  </HStack>
                </Box>
                <HStack spacing={2} flexShrink={0}>
                  {o.status === 'pending' && (
                    <Button
                      size="xs"
                      variant="danger"
                      onClick={(e) => handleCancel(e, o.id)}
                      isLoading={cancellingId === o.id}
                      loadingText="..."
                    >
                      Cancelar
                    </Button>
                  )}
                  <Text color="warmGray.400" fontSize="lg">→</Text>
                </HStack>
              </Flex>
            </PastelCard>
          ))}
        </VStack>
      )}
    </Box>
  );
}
