import { useEffect, useState, Fragment, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { colors, font, badge as badgeStyle, tableHeaderStyle, btnDanger } from '../../styles/theme';
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
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancel = useCallback(async (e, orderId) => {
    e.stopPropagation();
    if (!window.confirm('¿Cancelar esta orden?')) return;
    setCancellingId(orderId);
    try {
      await ordersService.cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch {} finally { setCancellingId(null); }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await ordersService.getMy();
        setOrders(Array.isArray(data) ? data : []);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

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
        style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 2rem 2rem' }}
      >
        <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0, marginBottom: '24px' }}>Mis Órdenes</h2>
        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.5rem' }} />

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: '56px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '10px', animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '12px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
            <p style={{ color: '#999', fontSize: '15px', margin: 0, fontFamily: font.body }}>No tienes órdenes aún</p>
            <p style={{ color: '#bbb', fontSize: '13px', margin: 0, fontFamily: font.body }}>Explora las pastelerías y haz tu primer pedido</p>
            <button onClick={() => navigate('/')} style={{ padding: '10px 24px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '99px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: font.body, marginTop: '8px' }}>Ver pastelerías</button>
          </div>
        ) : (
          <div style={{ background: colors.white, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                    <th style={tableHeaderStyle}>Orden</th>
                    <th style={tableHeaderStyle}>Fecha</th>
                    <th style={tableHeaderStyle}>Total</th>
                    <th style={tableHeaderStyle}>Estado</th>
                    <th style={tableHeaderStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <Fragment key={o.id}>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        style={{ borderTop: `1px solid ${colors.tableBorder}`, background: i % 2 === 0 ? colors.white : colors.tableStripe, cursor: 'pointer', transition: 'background 0.15s ease' }}
                        onClick={() => navigate(`/my-orders/${o.id}`)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f0ede8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? colors.white : colors.tableStripe; }}
                      >
                        <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: colors.textSecondary }}>{o.id?.slice(0, 8)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body, color: colors.textSecondary }}>{formatDate(o.created_at)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, fontFamily: font.body, color: colors.primary }}>S/ {(o.totals?.total || 0).toFixed(2)}</td>
                        <td style={{ padding: '12px 16px' }}>{badge(o.status)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: colors.accent, fontFamily: font.body, textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {o.status === 'pending' && (
                            <button onClick={(e) => handleCancel(e, o.id)} disabled={cancellingId === o.id} style={{ ...btnDanger, marginRight: '8px', fontSize: '11px', padding: '4px 10px' }}>
                              {cancellingId === o.id ? '...' : 'Cancelar'}
                            </button>
                          )}
                          Ver detalle →
                        </td>
                      </motion.tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
