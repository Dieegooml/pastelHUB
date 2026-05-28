import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { colors, font, badge as badgeStyle, btnDanger, cardStyle } from '../../styles/theme';
import { ordersService } from '../../services/ordersService';

const STATUS_TRANSLATIONS = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'Preparando',
  on_the_way: 'En camino', delivered: 'Entregado', cancelled: 'Cancelado',
};

const STATUS_COLORS = {
  pending: { bg: '#fff8e1', color: '#f59e0b' },
  confirmed: { bg: '#e1f5ee', color: '#1D9E75' },
  preparing: { bg: '#e3f2fd', color: '#2196f3' },
  on_the_way: { bg: '#fff3e0', color: '#e65100' },
  delivered: { bg: '#e8f5e9', color: '#2e7d32' },
  cancelled: { bg: '#fee2e2', color: '#ef4444' },
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
      } catch {} finally { setLoading(false); }
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
    } catch {} finally { setCancellingId(null); }
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const badge = (statusKey) => {
    const c = STATUS_COLORS[statusKey] || STATUS_COLORS.pending;
    return <span style={badgeStyle(c.bg, c.color)}>{STATUS_TRANSLATIONS[statusKey] || statusKey}</span>;
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 2rem 2rem' }}
      >
        <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0, marginBottom: '24px' }}>Mis Órdenes</h2>
        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.5rem' }} />

        {/* Filtros por estado */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '6px 16px', borderRadius: '99px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500, fontFamily: font.body,
                background: filter === s ? colors.primary : colors.white,
                color: filter === s ? '#fff' : colors.textSecondary,
                border: filter === s ? 'none' : `1px solid ${colors.border}`,
                transition: 'all 0.2s ease',
              }}
            >
              {s === 'all' ? 'Todas' : STATUS_TRANSLATIONS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: '80px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '12px', animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '12px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
            <p style={{ color: '#999', fontSize: '15px', margin: 0, fontFamily: font.body }}>
              {filter === 'all' ? 'No tienes órdenes aún' : `No hay órdenes ${STATUS_TRANSLATIONS[filter]?.toLowerCase()}`}
            </p>
            <button onClick={() => navigate('/')} style={{ padding: '10px 24px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '99px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: font.body, marginTop: '8px' }}>Ver pastelerías</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((o, i) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/my-orders/${o.id}`)}
                style={{
                  ...cardStyle, cursor: 'pointer', padding: '16px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all 0.2s ease', marginBottom: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = colors.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = colors.border; }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: colors.textSecondary }}>#{o.id?.slice(0, 8)}</span>
                    <span style={{ fontFamily: font.body, fontSize: '13px', color: colors.text, fontWeight: 500 }}>{o.shop?.name || 'Pastelería'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontFamily: font.body, fontSize: '12px', color: colors.textMuted }}>{formatDate(o.created_at)}</span>
                    <span style={{ fontFamily: font.heading, fontSize: '16px', fontWeight: 700, color: colors.primary }}>S/ {(o.totals?.total || 0).toFixed(2)}</span>
                    {badge(o.status)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {o.status === 'pending' && (
                    <button onClick={(e) => handleCancel(e, o.id)} disabled={cancellingId === o.id} style={{ ...btnDanger, padding: '5px 12px', fontSize: '12px' }}>
                      {cancellingId === o.id ? '...' : 'Cancelar'}
                    </button>
                  )}
                  <span style={{ color: colors.textMuted, fontSize: '18px' }}>→</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
