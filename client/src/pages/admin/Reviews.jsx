import { useEffect, useState, Fragment } from 'react';
import { reviewsService } from '../../services/reviewsService';
import Navbar from '../../components/Navbar';
import AdminNav from './AdminNav';
import ModeratorNav from '../moderator/ModeratorNav';
import { useAuth } from '../../context/AuthContext';
import {
  colors, font, inputStyle,
  btnSmallPrimary, btnDanger, btnGhost,
  badge as badgeStyle,
  tableHeaderStyle,
  animStagger, animFadeIn, animFadeInLeft, animScaleIn,
} from '../../styles/theme';
import { useIsMobile } from '../../styles/useIsMobile';

const STATUSES = ['all', 'pending', 'approved', 'rejected'];

const STATUS_TRANSLATIONS = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

const STATUS_COLORS = {
  pending:  { bg: '#fff8e1', color: '#f59e0b' },
  approved: { bg: '#e1f5ee', color: '#1D9E75' },
  rejected: { bg: '#fee2e2', color: '#ef4444' },
};

const FILTER_ACTIVE_STYLES = {
  all:      { bg: colors.primary, text: '#fff', border: 'none' },
  pending:  { bg: '#fff8e1', text: '#f57f17', border: '#f57f17' },
  approved: { bg: '#e8f5e9', text: '#2e7d32', border: '#2e7d32' },
  rejected: { bg: '#fce4ec', text: '#c62828', border: '#c62828' },
};

const filterTabStyle = (statusKey, active) => {
  const base = {
    padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500, fontFamily: font.body,
    border: '1px solid #ddd', color: '#666', background: 'transparent',
    transition: 'all 0.2s ease',
  };
  if (active) {
    const s = FILTER_ACTIVE_STYLES[statusKey] || FILTER_ACTIVE_STYLES.all;
    return { ...base, background: s.bg, color: s.text, border: s.border !== 'none' ? `1px solid ${s.border}` : 'none' };
  }
  return base;
};

const cellStyle = { padding: '12px 16px' };
const tdText = (size = '13px', extra = {}) => ({ ...cellStyle, fontSize: size, fontFamily: font.body, ...extra });

export default function Reviews() {
  const { user } = useAuth();
  const isPureModerator = user?.roles?.includes('moderator') && !user?.roles?.includes('admin');
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const isMobile = useIsMobile(768);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = filter === 'all'
        ? await reviewsService.getAll()
        : await reviewsService.getByStatus(filter);
      setReviews(data?.data || []);
    } catch (e) {
      console.error(e);
      setError('Error al cargar reseñas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, [filter]);

  const handleModerate = async (id, status) => {
    try {
      await reviewsService.moderate(id, status);
      setSuccess(`Reseña ${status === 'approved' ? 'aprobada' : 'rechazada'}`);
      loadReviews();
    } catch (e) {
      console.error(e);
      setError('Error al moderar la reseña');
    }
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      await reviewsService.reply(id, replyText.trim());
      setReplyText('');
      setSuccess('Respuesta enviada');
      loadReviews();
    } catch (e) {
      console.error(e);
      setError('Error al responder la reseña');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta reseña? Se recalculará el rating de la pastelería.')) return;
    try {
      await reviewsService.delete(id);
      setSuccess('Reseña eliminada');
      loadReviews();
    } catch (e) {
      console.error(e);
      setError('Error al eliminar la reseña');
    }
  };

  const idLabel = (raw) => {
    if (!raw) return <span style={{ color: '#999' }}>—</span>;
    return <span title={raw}>{raw.slice(0, 8)}…</span>;
  };

  const badge = (statusKey) => {
    const sc = STATUS_COLORS[statusKey] || STATUS_COLORS.pending;
    return (
      <span style={badgeStyle(sc.bg, sc.color)}>
        {STATUS_TRANSLATIONS[statusKey] || statusKey}
      </span>
    );
  };

  const HEADERS = isMobile
    ? ['Cliente', 'Rating', 'Estado', '']
    : ['Cliente', 'Pastelería', 'Rating', 'Comentario', 'Estado', 'Respuesta', 'Acciones'];

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <div style={{ ...animFadeIn, maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '1rem 1rem 2rem' : '40px 2rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '24px', flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: font.heading, fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: colors.primary, margin: 0 }}>
            Reseñas
          </h2>
          <span style={{
            background: '#f0f0f0', color: reviews.length > 0 ? colors.primary : '#666',
            padding: '2px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 500,
            fontFamily: font.body, marginLeft: '10px',
          }}>
            {reviews.length}
          </span>
        </div>

        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '24px' }} />

        <div style={{ marginBottom: '16px' }}>{isPureModerator ? <ModeratorNav /> : <AdminNav />}</div>

        {success && (
          <div style={{ ...animFadeInLeft, background: colors.successBg, color: colors.success, padding: '12px 16px',
            borderRadius: '10px', marginTop: '1rem', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body,
            borderLeft: `4px solid ${colors.success}`,
          }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ ...animFadeInLeft, background: colors.errorBg, color: colors.error, padding: '12px 16px',
            borderRadius: '10px', marginTop: '1rem', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body,
            borderLeft: `4px solid ${colors.error}`,
          }}>
            {error}
          </div>
        )}

        <div style={{ ...animFadeIn, display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={filterTabStyle(s, filter === s)}
              onMouseEnter={(e) => { if (filter !== s) e.currentTarget.style.background = '#f5f5f5'; }}
              onMouseLeave={(e) => { if (filter !== s) e.currentTarget.style.background = 'transparent'; }}
            >
              {s === 'all' ? 'Todas' : STATUS_TRANSLATIONS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: '48px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%', borderRadius: '8px', marginBottom: '8px',
                animation: 'shimmer 1.5s infinite',
              }} />
            ))}
          </div>
        ) : (
          <div style={{ ...animStagger(0.04), background: colors.white, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #efefef' }}>
            {reviews.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '12px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  <path d="M8 10h.01M12 10h.01M16 10h.01"/>
                </svg>
                <p style={{ color: '#999', fontSize: '15px', margin: 0, fontFamily: font.body }}>
                  {filter === 'all' ? 'No hay reseñas que mostrar' : `No hay reseñas con estado "${STATUS_TRANSLATIONS[filter]}"`}
                </p>
                <p style={{ color: '#bbb', fontSize: '13px', margin: 0, fontFamily: font.body }}>
                  {filter === 'all' ? 'Aún no se han registrado reseñas en el sistema' : 'Intenta cambiar el filtro para ver más resultados'}
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                      {HEADERS.map((h) => (
                        <th key={h} style={tableHeaderStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r, i) => {
                      const sc = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
                      const expanded = expandedId === r.id;
                      return (
                        <Fragment key={r.id}>
                          <tr
                            style={{
                              ...animStagger(i * 0.03),
                              borderTop: `1px solid ${colors.tableBorder}`,
                              background: i % 2 === 0 ? colors.white : colors.tableStripe,
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0ede8'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? colors.white : colors.tableStripe; }}
                          >
                            <td style={tdText()}>
                              {idLabel(r.customerId)}
                            </td>
                            {!isMobile && <td style={tdText()}>
                              {idLabel(r.shopId)}
                            </td>}
                            <td style={{ ...cellStyle, fontSize: '14px', fontFamily: font.body }}>
                              {'⭐'.repeat(r.rating)}
                            </td>
                            {!isMobile && (
                              <td style={{
                                ...tdText(), maxWidth: '200px', overflow: 'hidden',
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}
                                title={r.comment || undefined}
                              >
                                {r.comment || <span style={{ color: '#999' }}>Sin datos</span>}
                              </td>
                            )}
                            <td style={cellStyle}>{badge(r.status)}</td>
                            {!isMobile && (
                              <td style={{
                                ...tdText(), color: r.ownerReply ? colors.textSecondary : '#999',
                              }}
                                title={r.ownerReply || undefined}
                              >
                                {r.ownerReply ? (
                                  <span title={r.ownerReply}>{r.ownerReply.slice(0, 30) + (r.ownerReply.length > 30 ? '…' : '')}</span>
                                ) : (
                                  <span style={{ color: '#999' }}>Sin datos</span>
                                )}
                              </td>
                            )}
                            <td style={tdText()}>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button onClick={() => handleModerate(r.id, 'approved')} style={{
                                  padding: '4px 12px', background: '#e1f5ee', color: '#1D9E75',
                                  border: 'none', borderRadius: '99px', cursor: 'pointer', fontSize: '12px',
                                  fontWeight: 600, fontFamily: font.body,
                                }}>
                                  Aprobar
                                </button>
                                <button onClick={() => handleModerate(r.id, 'rejected')} style={btnDanger}>
                                  Rechazar
                                </button>
                                {!isPureModerator && (
                                  <button onClick={() => handleDelete(r.id)} style={btnGhost}>
                                    Eliminar
                                  </button>
                                )}
                                {!isPureModerator && (
                                  <button onClick={() => setExpandedId(expanded ? null : r.id)} style={{ ...btnGhost, fontSize: '11px' }}>
                                    {expanded ? '▲' : '▼'} Responder
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expanded && (
                            <tr key={`${r.id}-reply`}>
                              <td colSpan={isMobile ? 4 : 7} style={{ padding: '0 16px 16px', background: colors.tableStripe }}>
                                <div style={{ ...animFadeIn, borderTop: `1px solid ${colors.tableBorder}`, paddingTop: '12px' }}
                                >
                                  <div style={{ fontSize: '13px', fontFamily: font.body, marginBottom: '8px', lineHeight: 1.7 }}>
                                    <strong>Comentario:</strong> {r.comment || <span style={{ color: '#999' }}>Sin datos</span>}
                                  </div>
                                  {r.ownerReply && (
                                    <div style={{ fontSize: '13px', fontFamily: font.body, marginBottom: '8px', color: colors.textSecondary, lineHeight: 1.7 }}>
                                      <strong>Respuesta actual:</strong> {r.ownerReply}
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                      <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body }}>Responder al cliente</label>
                                      <input
                                        style={{ ...inputStyle, height: '36px', padding: '0 12px' }}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={r.ownerReply ? 'Actualizar respuesta...' : 'Escribe una respuesta...'}
                                      />
                                    </div>
                                    <button
                                      onClick={() => handleReply(r.id)}
                                      style={{ ...btnSmallPrimary, background: colors.accent }}
                                      onMouseEnter={(e) => e.target.style.background = '#168959'}
                                      onMouseLeave={(e) => e.target.style.background = colors.accent}
                                    >
                                      {r.ownerReply ? 'Actualizar' : 'Responder'}
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
