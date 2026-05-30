import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import AdminNav from './AdminNav';
import { colors, font } from '../../styles/theme';
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
    { label: 'Usuarios', value: stats.users, color: '#1D9E75', path: '/admin/users' },
    { label: 'Pastelerías', value: stats.shops, color: '#2196f3', path: '/admin/shops' },
    { label: 'Órdenes', value: stats.orders, color: '#f59e0b', path: '/admin/orders' },
    { label: 'Reseñas', value: stats.reviews, color: '#9c27b0', path: '/admin/reviews' },
    { label: 'Promociones', value: stats.promotions, color: '#e91e63', path: '/admin/promotions' },
    { label: 'Clientes', value: stats.customers, color: '#00bcd4', path: '/admin/customers' },
    { label: 'Reportes', value: stats.reports, color: '#ff5722', path: '/admin/reports' },
    { label: 'Notificaciones', value: stats.notifications, color: '#607d8b', path: '/admin/notifications' },
    { label: 'Pagos', value: stats.payments, color: '#4caf50', path: '/admin/payments' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 2rem 2rem' }}>
        <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0, marginBottom: '24px' }}>
          Panel de Administración
        </h2>
        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.2rem' }} />
        <div style={{ marginBottom: '16px' }}><AdminNav /></div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: '120px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '12px', animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {cards.map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.35 }}
                  onClick={() => navigate(c.path)}
                  style={{
                    background: colors.white, borderRadius: '12px', padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef',
                    cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; }}
                >
                  <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: font.heading, color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: font.body, marginTop: '4px' }}>{c.label}</div>
                </motion.div>
              ))}
            </div>

            <div style={{ background: colors.white, borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef' }}>
              <h3 style={{ fontFamily: font.heading, fontSize: '18px', fontWeight: 600, color: colors.primary, margin: 0, marginBottom: '16px' }}>
                Órdenes Recientes
              </h3>
              {recentOrders.length === 0 ? (
                <p style={{ color: colors.textMuted, fontFamily: font.body, fontSize: '14px', margin: 0 }}>No hay órdenes recientes</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentOrders.map((o, i) => (
                    <div
                      key={o.id}
                      onClick={() => navigate('/admin/orders')}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                        background: i % 2 === 0 ? colors.grayLight : colors.white,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f0ede8'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? colors.grayLight : colors.white; }}
                    >
                      <div>
                        <span style={{ fontSize: '13px', fontFamily: 'monospace', color: colors.textSecondary }}>{o.id?.slice(0, 8)}</span>
                        <span style={{ fontSize: '13px', color: colors.textMuted, marginLeft: '12px', fontFamily: font.body }}>
                          {o.customer?.name || '—'}
                        </span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: colors.primary, fontFamily: font.body }}>
                        S/ {(o.totals?.total || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
