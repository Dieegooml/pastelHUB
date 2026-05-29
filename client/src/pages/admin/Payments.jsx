import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import AdminNav from './AdminNav';
import { colors, font, selectStyle, tableHeaderStyle, btnSmallPrimary, badge as badgeStyle } from '../../styles/theme';
import { paymentsService } from '../../services/paymentsService';

const STATUS_TRANSLATIONS = { pending: 'Pendiente', paid: 'Pagado', refunded: 'Reembolsado', failed: 'Fallido' };
const STATUS_COLORS = {
  pending: { bg: '#fff8e1', color: '#f59e0b' },
  paid: { bg: '#e8f5e9', color: '#2e7d32' },
  refunded: { bg: '#e3f2fd', color: '#2196f3' },
  failed: { bg: '#fee2e2', color: '#ef4444' },
};

const stagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35, ease: 'easeOut' } }),
};

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusUpdate, setStatusUpdate] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const data = await paymentsService.getAll();
      setPayments(data?.data || []);
    } catch { setError('Error al cargar pagos'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id) => {
    if (!statusUpdate[id]) return;
    try {
      await paymentsService.updateStatus(id, statusUpdate[id], '');
      setStatusUpdate((p) => ({ ...p, [id]: '' }));
      setSuccess('Estado de pago actualizado');
      load();
    } catch { setError('Error al actualizar'); }
  };

  const badge = (statusKey) => {
    const c = STATUS_COLORS[statusKey] || STATUS_COLORS.pending;
    return <span style={badgeStyle(c.bg, c.color)}>{STATUS_TRANSLATIONS[statusKey] || statusKey}</span>;
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 2rem 2rem' }}>
        <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0, marginBottom: '24px' }}>Pagos</h2>
        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.2rem' }} />
        <div style={{ marginBottom: '16px' }}><AdminNav /></div>

        {success && <div style={{ background: colors.successBg, color: colors.success, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.success}` }}>{success}</div>}
        {error && <div style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</div>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map((i) => <div key={i} style={{ height: '48px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '8px', animation: 'shimmer 1.5s infinite' }} />)}
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" custom={1} style={{ background: colors.white, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #efefef' }}>
            {payments.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#999', fontFamily: font.body, fontSize: '15px' }}>No hay pagos registrados</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                      <th style={tableHeaderStyle}>ID</th>
                      <th style={tableHeaderStyle}>Orden</th>
                      <th style={tableHeaderStyle}>Monto</th>
                      <th style={tableHeaderStyle}>Método</th>
                      <th style={tableHeaderStyle}>Estado</th>
                      <th style={tableHeaderStyle}>Fecha</th>
                      <th style={tableHeaderStyle}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <motion.tr
                        key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        style={{ borderTop: `1px solid ${colors.tableBorder}`, background: i % 2 === 0 ? colors.white : colors.tableStripe, transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f0ede8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? colors.white : colors.tableStripe; }}
                      >
                        <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: colors.textSecondary }}>{p.id?.slice(0, 8)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: colors.textSecondary }}>{p.orderId?.slice(0, 8) || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, fontFamily: font.body, color: colors.primary }}>S/ {(p.amount || 0).toFixed(2)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body, color: colors.textSecondary }}>{p.paymentMethod || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>{badge(p.paymentStatus)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: font.body, color: colors.textSecondary }}>{formatDate(p.createdAt)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <select style={{ ...selectStyle, height: '32px', padding: '0 8px', fontSize: '11px', width: '100px' }} value={statusUpdate[p.id] || ''} onChange={(e) => setStatusUpdate((s) => ({ ...s, [p.id]: e.target.value }))}>
                              <option value="">—</option>
                              {Object.keys(STATUS_TRANSLATIONS).map((s) => (
                                <option key={s} value={s}>{STATUS_TRANSLATIONS[s]}</option>
                              ))}
                            </select>
                            <button onClick={() => handleStatus(p.id)} style={btnSmallPrimary}>OK</button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
