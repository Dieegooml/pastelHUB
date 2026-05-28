import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { colors, font, badge as badgeStyle, btnDanger, btnSmallSecondary, cardStyle } from '../../styles/theme';
import { notificationsService } from '../../services/notificationsService';

const TYPE_LABELS = {
  order_update: '🛵 Estado de orden',
  new_review: '⭐ Nueva reseña',
  shop_approved: '✅ Pastelería aprobada',
  shop_rejected: '❌ Pastelería rechazada',
  shop_suspended: '🚫 Pastelería suspendida',
  report_resolved: '📋 Reporte resuelto',
  new_order: '🆕 Nueva orden',
  payment_confirmed: '💳 Pago confirmado',
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await notificationsService.getByUser(user.uid);
      const list = Array.isArray(res) ? res : res?.data || [];
      setNotifs(list);
    } catch {} finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead(user.uid);
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await notificationsService.delete(id);
      setNotifs((prev) => prev.filter((n) => n.id !== id));
    } finally { setDeleting(null); }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 2rem 2rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0 }}>Notificaciones</h2>
            <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginTop: '12px' }} />
          </div>
          {notifs.some((n) => !n.isRead) && (
            <button onClick={handleMarkAllRead} style={btnSmallSecondary}>Marcar todas como leídas</button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: '64px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '10px', animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textMuted, fontFamily: font.body }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔔</div>
            <p style={{ fontSize: '15px', margin: 0 }}>No tienes notificaciones</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifs.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  ...cardStyle, padding: '14px 18px', marginBottom: 0,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  borderLeft: n.isRead ? `1px solid ${colors.border}` : `3px solid ${colors.accent}`,
                  background: n.isRead ? colors.white : '#fafffd',
                }}
              >
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleMarkRead(n.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: font.body, fontSize: '13px', fontWeight: 600, color: colors.text }}>{TYPE_LABELS[n.type] || n.type}</span>
                    {!n.isRead && <span style={badgeStyle(colors.accent, '#fff')}>Nueva</span>}
                  </div>
                  <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textSecondary, margin: 0, lineHeight: 1.5 }}>{n.message}</p>
                  <span style={{ fontFamily: font.body, fontSize: '11px', color: colors.textMuted, marginTop: '4px', display: 'inline-block' }}>{formatDate(n.createdAt)}</span>
                </div>
                <button onClick={() => handleDelete(n.id)} disabled={deleting === n.id} style={{ ...btnDanger, padding: '4px 10px', fontSize: '11px', marginLeft: '12px', flexShrink: 0 }}>
                  {deleting === n.id ? '...' : 'Eliminar'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
