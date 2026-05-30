import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import AdminNav from './AdminNav';
import { colors, font, tableHeaderStyle, btnDanger, badge as badgeStyle, statusTab } from '../../styles/theme';
import { promotionsService } from '../../services/promotionsService';

const TYPES = { discount: 'Descuento', combo: 'Combo', bogo: '2x1' };
const TYPE_COLORS = {
  discount: { bg: '#fff8e1', color: '#f59e0b' },
  combo: { bg: '#e3f2fd', color: '#2196f3' },
  bogo: { bg: '#e8f5e9', color: '#2e7d32' },
};

const stagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35, ease: 'easeOut' } }),
};

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d.slice(0, 10);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
};

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await promotionsService.getAll();
      setPromotions(data?.data || []);
    } catch (e) { console.error(e); setError('Error al cargar promociones'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id) => {
    try { await promotionsService.toggle(id); setSuccess('Estado cambiado'); load(); }
    catch (e) { console.error(e); setError('Error al cambiar estado'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    try { await promotionsService.delete(id); setSuccess('Promoción eliminada'); load(); }
    catch (e) { console.error(e); setError('Error al eliminar'); }
  };

  const typeBadge = (type) => {
    const c = TYPE_COLORS[type] || { bg: '#f0f0f0', color: '#666' };
    return <span style={badgeStyle(c.bg, c.color)}>{TYPES[type] || type}</span>;
  };

  const activeBadge = (active) => {
    if (active) return <span style={badgeStyle('#e8f5e9', '#2e7d32')}>Activa</span>;
    return <span style={badgeStyle('#fee2e2', '#ef4444')}>Inactiva</span>;
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 2rem 2rem' }}>
        <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0, marginBottom: '24px' }}>Promociones</h2>
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
            {promotions.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#999', fontFamily: font.body, fontSize: '15px' }}>No hay promociones registradas</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                      <th style={tableHeaderStyle}>Nombre</th>
                      <th style={tableHeaderStyle}>Pastelería</th>
                      <th style={tableHeaderStyle}>Tipo</th>
                      <th style={tableHeaderStyle}>Estado</th>
                      <th style={tableHeaderStyle}>Inicio</th>
                      <th style={tableHeaderStyle}>Fin</th>
                      <th style={tableHeaderStyle}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotions.map((p, i) => (
                      <motion.tr
                        key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        style={{ borderTop: `1px solid ${colors.tableBorder}`, background: i % 2 === 0 ? colors.white : colors.tableStripe, transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f0ede8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? colors.white : colors.tableStripe; }}
                      >
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, fontFamily: font.body, color: colors.primary }}>{p.name || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: colors.textSecondary }}>{p.shop_id?.slice(0, 8) || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>{typeBadge(p.type)}</td>
                        <td style={{ padding: '12px 16px' }}>{activeBadge(p.is_active)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body, color: colors.textSecondary }}>{formatDate(p.start_date)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body, color: colors.textSecondary }}>{formatDate(p.end_date)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleToggle(p.id)} style={{ padding: '4px 12px', background: p.is_active ? '#fff8e1' : '#e8f5e9', color: p.is_active ? '#f59e0b' : '#2e7d32', border: 'none', borderRadius: '99px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: font.body }}>
                              {p.is_active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button onClick={() => handleDelete(p.id)} style={btnDanger}>Eliminar</button>
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
