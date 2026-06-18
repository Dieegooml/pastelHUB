import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, SimpleGrid, Text, Flex, useToast
} from '@chakra-ui/react';
import AdminNav from './AdminNav';
import { PastelPageHeader, PastelCard, PastelStatCard, PastelSkeletonPage } from '../../components/UI';
import { usersService } from '../../services/usersService';
import { shopsService } from '../../services/shopsService';
import { ordersService } from '../../services/ordersService';
import { reviewsService } from '../../services/reviewsService';
import { promotionsService } from '../../services/promotionsService';
import { customersService } from '../../services/customersService';
import { reportsService } from '../../services/reportsService';
import { notificationsService } from '../../services/notificationsService';
import { paymentsService } from '../../services/paymentsService';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [stats, setStats] = useState({ users: 0, shops: 0, orders: 0, reviews: 0, promotions: 0, customers: 0, reports: 0, notifications: 0, payments: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [users, shops, orders, reviews, promotions, customers, reports, notifications, payments] = await Promise.all([
          usersService.getAll().catch(() => []),
          shopsService.getAll().catch(() => []),
          ordersService.getAll().catch(() => []),
          reviewsService.getAll().catch(() => []),
          promotionsService.getAll().catch(() => []),
          customersService.getAll().catch(() => []),
          reportsService.getAll().catch(() => []),
          notificationsService.getAll().catch(() => []),
          paymentsService.getAll().catch(() => []),
        ]);
        setStats({
          users: users?.data?.length || 0,
          shops: shops?.data?.length || 0,
          orders: orders?.data?.length || 0,
          reviews: reviews?.data?.length || 0,
          promotions: promotions?.data?.length || 0,
          customers: customers?.data?.length || 0,
          reports: reports?.data?.length || 0,
          notifications: notifications?.data?.length || 0,
          payments: payments?.data?.length || 0,
        });
        if (orders?.data) setRecentOrders(orders.data.slice(0, 5));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  const cards = [
    { label: 'Usuarios', value: stats.users, color: 'brand', path: '/admin/users', icon: '👥' },
    { label: 'Pastelerías', value: stats.shops, color: 'blue', path: '/admin/shops', icon: '🏪' },
    { label: 'Órdenes', value: stats.orders, color: 'rose', path: '/admin/orders', icon: '📋' },
    { label: 'Reseñas', value: stats.reviews, color: 'accent', path: '/admin/reviews', icon: '⭐' },
    { label: 'Promociones', value: stats.promotions, color: 'rose', path: '/admin/promotions', icon: '🎉' },
    { label: 'Clientes', value: stats.customers, color: 'blue', path: '/admin/customers', icon: '👤' },
    { label: 'Reportes', value: stats.reports, color: 'rose', path: '/admin/reports', icon: '🚩' },
    { label: 'Notificaciones', value: stats.notifications, color: 'brand', path: '/admin/notifications', icon: '🔔' },
    { label: 'Pagos', value: stats.payments, color: 'accent', path: '/admin/payments', icon: '💳' },
  ];

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <PastelPageHeader title="Panel de Administración" description="Resumen general del sistema" icon="⚙️" />

      <Box mb={4}>
        <AdminNav />
      </Box>

      {loading ? (
        <PastelSkeletonPage cards={4} />
      ) : (
        <>
          <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4} mb={8}>
            {cards.map((c) => (
              <Box key={c.label} as="button" textAlign="left" cursor="pointer" onClick={() => navigate(c.path)} onKeyDown={(e) => { if (e.key === 'Enter') navigate(c.path) }}>
                <PastelStatCard label={c.label} value={c.value} icon={c.icon} color={c.color} />
              </Box>
            ))}
          </SimpleGrid>

          <PastelCard title="Órdenes Recientes" variant="elevated">
            {recentOrders.length === 0 ? (
              <Text color="warmGray.400" fontSize="sm">No hay órdenes recientes</Text>
            ) : (
              <Flex direction="column" gap={2}>
                {recentOrders.map((o, i) => (
                  <Flex
                    key={o.id}
                    as="button"
                    textAlign="left"
                    w="full"
                    justify="space-between"
                    align="center"
                    p={3}
                    borderRadius="lg"
                    cursor="pointer"
                    bg={i % 2 === 0 ? 'warmGray.50' : 'white'}
                    _hover={{ bg: 'warmGray.100' }}
                    onClick={() => navigate('/admin/orders')}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate('/admin/orders') }}
                  >
                    <Box>
                      <Text fontSize="sm" fontFamily="mono" color="warmGray.500">
                        {o.id?.slice(0, 8)}
                      </Text>
                      <Text fontSize="sm" color="warmGray.400" ml={3} as="span">
                        {o.customer?.name || '—'}
                      </Text>
                    </Box>
                    <Text fontSize="sm" fontWeight={600} color="brand.700">
                      S/ {(o.totals?.total || 0).toFixed(2)}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            )}
          </PastelCard>
        </>
      )}
    </Box>
  );
}
