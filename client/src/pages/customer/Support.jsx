import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { supportService } from '../../services/supportService';
import { colors, font, inputStyle, textareaStyle, btnPrimary, btnSmallPrimary, badge as badgeStyle, tableHeaderStyle } from '../../styles/theme';
import { useIsMobile } from '../../styles/useIsMobile';

const STATUS_COLORS = {
  open:         { bg: '#fff8e1', color: '#f59e0b' },
  in_progress:  { bg: '#e3f2fd', color: '#2196f3' },
  resolved:     { bg: '#e1f5ee', color: '#1D9E75' },
  closed:       { bg: '#f5f5f5', color: '#999' },
};

const STATUS_TRANSLATIONS = {
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const PRIORITY_COLORS = {
  low:    { bg: '#e8f5e9', color: '#2e7d32' },
  medium: { bg: '#fff8e1', color: '#f57f17' },
  high:   { bg: '#fce4ec', color: '#c62828' },
};

const PRIORITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

const stagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35 } }),
};

const cellStyle = { padding: '12px 16px' };
const tdText = (size = '13px', extra = {}) => ({ ...cellStyle, fontSize: size, fontFamily: font.body, ...extra });

export default function Support() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isModerator = user?.roles?.includes('moderator') || user?.roles?.includes('admin');

  const load = async () => {
    try {
      setLoading(true);
      const res = await supportService.getTickets(statusFilter || undefined);
      setTickets(res?.data || []);
    } catch (e) { console.error(e); setError('Error al cargar tickets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleAssign = async (id) => {
    try {
      await supportService.assign(id);
      load();
    } catch (e) { console.error(e); setError('Error al asignar ticket'); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await supportService.updateStatus(id, newStatus);
      load();
    } catch (e) { console.error(e); setError('Error al cambiar estado'); }
  };

  const STATUS_FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'open', label: 'Abiertos' },
    { value: 'in_progress', label: 'En progreso' },
    { value: 'resolved', label: 'Resueltos' },
    { value: 'closed', label: 'Cerrados' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
        style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '1rem' : '40px 2rem 2rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontFamily: font.heading, fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: colors.primary, margin: 0 }}>
              {isModerator ? 'Tickets de soporte' : 'Mis tickets'}
            </h2>
            <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textMuted, margin: '4px 0 0' }}>
              {isModerator ? 'Administra los tickets de clientes y dueños' : 'Consulta y da seguimiento a tus solicitudes'}
            </p>
          </div>
          {!isModerator && (
            <button onClick={() => navigate('/support/new')} style={btnPrimary}>
              + Nuevo ticket
            </button>
          )}
        </div>

        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '24px' }} />

        {isModerator && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map((s) => (
              <button key={s.value} onClick={() => setStatusFilter(s.value)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 500, fontFamily: font.body,
                  border: statusFilter === s.value ? 'none' : `1px solid ${colors.border}`,
                  background: statusFilter === s.value ? colors.primary : 'transparent',
                  color: statusFilter === s.value ? '#fff' : colors.textSecondary,
                  transition: 'all 0.2s ease',
                }}
              >{s.label}</button>
            ))}
          </div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}
          >{error}</motion.div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: '48px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '8px', marginBottom: '8px', animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '12px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <p style={{ color: '#999', fontSize: '15px', fontFamily: font.body }}>{isModerator ? 'No hay tickets' : 'No tienes tickets aún'}</p>
            {!isModerator && (
              <button onClick={() => navigate('/support/new')} style={btnPrimary}>Crear mi primer ticket</button>
            )}
          </div>
        ) : (
          <div style={{ background: colors.white, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #efefef' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                    {isModerator && <th style={tableHeaderStyle}>Usuario</th>}
                    <th style={tableHeaderStyle}>Asunto</th>
                    {!isMobile && <th style={tableHeaderStyle}>Prioridad</th>}
                    <th style={tableHeaderStyle}>Estado</th>
                    {isModerator && !isMobile && <th style={tableHeaderStyle}>Asignado</th>}
                    <th style={tableHeaderStyle}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t, i) => {
                    const pc = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium;
                    const sc = STATUS_COLORS[t.status] || STATUS_COLORS.open;
                    return (
                      <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        style={{ borderTop: `1px solid ${colors.tableBorder}`, background: i % 2 === 0 ? colors.white : colors.tableStripe }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0ede8'}
                        onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? colors.white : colors.tableStripe}
                      >
                        {isModerator && <td style={tdText()}><span title={t.userId}>{t.userId?.slice(0, 8)}…</span></td>}
                        <td style={{ ...tdText(), fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate(`/support/${t.id}`)}>
                          {t.subject}
                        </td>
                        {!isMobile && <td style={cellStyle}><span style={badgeStyle(pc.bg, pc.color)}>{PRIORITY_LABELS[t.priority] || t.priority}</span></td>}
                        <td style={cellStyle}><span style={badgeStyle(sc.bg, sc.color)}>{STATUS_TRANSLATIONS[t.status] || t.status}</span></td>
                        {isModerator && !isMobile && <td style={tdText()}>{t.assignedTo ? <span title={t.assignedTo}>{t.assignedTo.slice(0, 8)}…</span> : <span style={{ color: '#999' }}>—</span>}</td>}
                        <td style={tdText()}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button onClick={() => navigate(`/support/${t.id}`)} style={{ padding: '4px 12px', borderRadius: '99px', border: `1px solid ${colors.border}`, cursor: 'pointer', fontSize: '12px', fontFamily: font.body, background: colors.white }}>Ver</button>
                            {isModerator && (
                              <>
                                {!t.assignedTo && t.status === 'open' && (
                                  <button onClick={() => handleAssign(t.id)} style={{ padding: '4px 10px', borderRadius: '99px', border: 'none', cursor: 'pointer', fontSize: '11px', fontFamily: font.body, background: '#e3f2fd', color: '#1565c0' }}>Asignarme</button>
                                )}
                                {t.status === 'open' && (
                                  <button onClick={() => handleStatusChange(t.id, 'in_progress')} style={{ padding: '4px 10px', borderRadius: '99px', border: 'none', cursor: 'pointer', fontSize: '11px', fontFamily: font.body, background: '#e3f2fd', color: '#1565c0' }}>→ Prog.</button>
                                )}
                                {t.status === 'open' || t.status === 'in_progress' ? (
                                  <button onClick={() => handleStatusChange(t.id, 'resolved')} style={{ padding: '4px 10px', borderRadius: '99px', border: 'none', cursor: 'pointer', fontSize: '11px', fontFamily: font.body, background: '#e1f5ee', color: '#1D9E75' }}>Resolver</button>
                                ) : null}
                                {(t.status === 'resolved' || t.status === 'closed') && (
                                  <button onClick={() => handleStatusChange(t.id, 'open')} style={{ padding: '4px 10px', borderRadius: '99px', border: 'none', cursor: 'pointer', fontSize: '11px', fontFamily: font.body, background: '#fff8e1', color: '#f59e0b' }}>Reabrir</button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
