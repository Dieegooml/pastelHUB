import { useEffect, useState, Fragment } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import AdminNav from './AdminNav';
import { colors, font, inputStyle, selectStyle, tableHeaderStyle, btnSmallPrimary, btnDanger, badge as badgeStyle, statusTab } from '../../styles/theme';
import { reportsService } from '../../services/reportsService';

const STATUSES = ['all', 'pending', 'reviewed', 'resolved', 'dismissed'];
const STATUS_TRANSLATIONS = { pending: 'Pendiente', reviewed: 'Revisado', resolved: 'Resuelto', dismissed: 'Descartado' };
const STATUS_COLORS = {
  pending: { bg: '#fff8e1', color: '#f59e0b' },
  reviewed: { bg: '#e3f2fd', color: '#2196f3' },
  resolved: { bg: '#e8f5e9', color: '#2e7d32' },
  dismissed: { bg: '#fce4ec', color: '#c62828' },
};
const TARGET_TYPES = ['all', 'review', 'shop', 'product'];
const TARGET_TRANSLATIONS = { all: 'Todos', review: 'Reseña', shop: 'Pastelería', product: 'Producto' };

const stagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35, ease: 'easeOut' } }),
};

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [moderatorId, setModeratorId] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      let data;
      if (targetFilter !== 'all') {
        data = await reportsService.getByTarget(targetFilter);
      } else if (statusFilter !== 'all') {
        data = await reportsService.getByStatus(statusFilter);
      } else {
        data = await reportsService.getAll();
      }
      setReports(data?.data || []);
    } catch { setError('Error al cargar reportes'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter, targetFilter]);

  const handleStatus = async (id, status) => {
    try { await reportsService.updateStatus(id, status); setSuccess(`Reporte ${STATUS_TRANSLATIONS[status]?.toLowerCase() || status}`); load(); }
    catch { setError('Error al actualizar'); }
  };

  const handleAssign = async (id) => {
    if (!moderatorId[id]) return;
    try { await reportsService.assignModerator(id, moderatorId[id]); setSuccess('Moderador asignado'); setModeratorId((p) => ({ ...p, [id]: '' })); load(); }
    catch { setError('Error al asignar moderador'); }
  };

  const badge = (statusKey) => {
    const c = STATUS_COLORS[statusKey] || STATUS_COLORS.pending;
    return <span style={badgeStyle(c.bg, c.color)}>{STATUS_TRANSLATIONS[statusKey] || statusKey}</span>;
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 2rem 2rem' }}>
        <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0, marginBottom: '24px' }}>Reportes</h2>
        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.2rem' }} />
        <div style={{ marginBottom: '16px' }}><AdminNav /></div>

        {success && <div style={{ background: colors.successBg, color: colors.success, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.success}` }}>{success}</div>}
        {error && <div style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</div>}

        <motion.div variants={stagger} initial="hidden" animate="visible" custom={0} style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setTargetFilter('all'); }} style={statusTab(statusFilter === s && targetFilter === 'all')}>
              {s === 'all' ? 'Todos' : STATUS_TRANSLATIONS[s]}
            </button>
          ))}
        </motion.div>
        <motion.div variants={stagger} initial="hidden" animate="visible" custom={0} style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {TARGET_TYPES.map((t) => (
            <button key={t} onClick={() => { setTargetFilter(t); setStatusFilter('all'); }} style={{ ...statusTab(targetFilter === t && statusFilter === 'all'), fontSize: '11px' }}>
              {TARGET_TRANSLATIONS[t]}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map((i) => <div key={i} style={{ height: '48px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '8px', animation: 'shimmer 1.5s infinite' }} />)}
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" custom={1} style={{ background: colors.white, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #efefef' }}>
            {reports.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#999', fontFamily: font.body, fontSize: '15px' }}>No hay reportes que mostrar</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                      <th style={tableHeaderStyle}>ID</th>
                      <th style={tableHeaderStyle}>Tipo</th>
                      <th style={tableHeaderStyle}>Usuario</th>
                      <th style={tableHeaderStyle}>Motivo</th>
                      <th style={tableHeaderStyle}>Estado</th>
                      <th style={tableHeaderStyle}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r, i) => (
                      <Fragment key={r.id}>
                        <motion.tr
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                          style={{ borderTop: `1px solid ${colors.tableBorder}`, background: i % 2 === 0 ? colors.white : colors.tableStripe, transition: 'background 0.15s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f0ede8'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? colors.white : colors.tableStripe; }}
                        >
                          <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: colors.textSecondary }}>{r.id?.slice(0, 8)}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body }}>{r.target_type || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body, color: colors.textSecondary }}>{r.user_id?.slice(0, 8) || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.textSecondary }} title={r.reason || ''}>{r.reason || '—'}</td>
                          <td style={{ padding: '12px 16px' }}>{badge(r.status)}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {r.status === 'pending' && (
                                <>
                                  <button onClick={() => handleStatus(r.id, 'reviewed')} style={{ padding: '4px 12px', background: '#e3f2fd', color: '#1565c0', border: 'none', borderRadius: '99px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: font.body }}>Revisar</button>
                                  <button onClick={() => handleStatus(r.id, 'dismissed')} style={btnDanger}>Descartar</button>
                                  <input
                                    placeholder="Moderador ID"
                                    value={moderatorId[r.id] || ''}
                                    onChange={(e) => setModeratorId((p) => ({ ...p, [r.id]: e.target.value }))}
                                    style={{ padding: '4px 8px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '11px', fontFamily: font.body, width: '100px', outline: 'none' }}
                                  />
                                  <button onClick={() => handleAssign(r.id)} style={{ padding: '4px 10px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '99px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: font.body }}>Asignar</button>
                                </>
                              )}
                              {r.status === 'reviewed' && (
                                <>
                                  <button onClick={() => handleStatus(r.id, 'resolved')} style={{ padding: '4px 12px', background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: '99px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: font.body }}>Resolver</button>
                                  <span style={{ fontSize: '11px', color: colors.textMuted, fontFamily: font.body }}>{r.moderator_id ? `Mod: ${r.moderator_id.slice(0, 8)}` : ''}</span>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      </Fragment>
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
