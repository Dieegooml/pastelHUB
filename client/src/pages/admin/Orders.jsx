import { useEffect, useState, Fragment } from 'react';
import { motion } from 'framer-motion';
import { ordersService } from '../../services/ordersService';
import Navbar from '../../components/Navbar';
import AdminNav from './AdminNav';
import { colors, font, inputStyle, selectStyle, badge as themeBadge, tableHeaderStyle, btnSmallPrimary, btnDanger } from '../../styles/theme';
import { useIsMobile } from '../../styles/useIsMobile';

const STATUSES = ['all', 'pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed'];

const STATUS_TRANSLATIONS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  on_the_way: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS = {
  pending:    { bg: '#fff8e1', color: '#f59e0b' },
  confirmed:  { bg: '#e1f5ee', color: '#1D9E75' },
  preparing:  { bg: '#e3f2fd', color: '#2196f3' },
  on_the_way: { bg: '#e3f2fd', color: '#1565C0' },
  delivered:  { bg: '#e8f5e9', color: '#2e7d32' },
  cancelled:  { bg: '#fee2e2', color: '#ef4444' },
};

const STATUS_ICONS = {
  pending:    '⏳', confirmed: '✅', preparing: '👨‍🍳',
  on_the_way: '🚚', delivered: '📦', cancelled: '❌',
};

const FILTER_ACTIVE_STYLES = {
  all:        { bg: colors.primary, text: '#fff', border: 'none' },
  pending:    { bg: '#fff8e1', text: '#f57f17', border: '#f57f17' },
  confirmed:  { bg: '#e8f5e9', text: '#2e7d32', border: '#2e7d32' },
  preparing:  { bg: '#e3f2fd', text: '#1565c0', border: '#1565c0' },
  on_the_way: { bg: '#fff3e0', text: '#e65100', border: '#e65100' },
  delivered:  { bg: '#e8f5e9', text: '#1b5e20', border: '#1b5e20' },
  cancelled:  { bg: '#fce4ec', text: '#c62828', border: '#c62828' },
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

const smallInput = { ...inputStyle, height: '36px', padding: '0 12px', fontSize: '13px' };
const smallSelect = { ...selectStyle, height: '36px', padding: '0 12px', fontSize: '13px' };

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

const cellStyle = { padding: '12px 16px' };
const tdText = (size = '14px', extra = {}) => ({ ...cellStyle, fontSize: size, fontFamily: font.body, ...extra });
const tdMono = (extra = {}) => ({ ...cellStyle, fontSize: '12px', color: colors.textSecondary, fontFamily: 'monospace', ...extra });

export default function Orders() {
  const isMobile = useIsMobile(768);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const HEADERS = isMobile
    ? ['ID', 'Cliente', 'Total', 'Estado', '']
    : ['ID', 'Fecha', 'Cliente', 'Pastelería', 'Total', 'Estado', 'Pago', 'Acciones'];

  const [newStatus, setNewStatus] = useState({});
  const [newPaymentStatus, setNewPaymentStatus] = useState({});
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [replyForm, setReplyForm] = useState({});

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = filter === 'all'
        ? await ordersService.getAll()
        : await ordersService.getByStatus(filter);
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setError('Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [filter]);

  const handleUpdateStatus = async (id) => {
    if (!newStatus[id]) return;
    try {
      await ordersService.updateStatus(id, newStatus[id]);
      setNewStatus((p) => ({ ...p, [id]: '' }));
      setSuccess('Estado actualizado');
      loadOrders();
    } catch {
      setError('Error al actualizar estado');
    }
  };

  const handleUpdatePaymentStatus = async (id) => {
    if (!newPaymentStatus[id]) return;
    try {
      await ordersService.updatePaymentStatus(id, newPaymentStatus[id]);
      setNewPaymentStatus((p) => ({ ...p, [id]: '' }));
      setSuccess('Estado de pago actualizado');
      loadOrders();
    } catch {
      setError('Error al actualizar estado de pago');
    }
  };

  const handleAddReview = async (id) => {
    try {
      await ordersService.addReview(id, reviewForm.rating, reviewForm.comment);
      setReviewForm({ rating: 5, comment: '' });
      setSuccess('Reseña agregada');
      loadOrders();
    } catch {
      setError('Error al agregar reseña');
    }
  };

  const handleReplyReview = async (id) => {
    if (!replyForm[id]) return;
    try {
      await ordersService.replyReview(id, replyForm[id]);
      setReplyForm((p) => ({ ...p, [id]: '' }));
      setSuccess('Respuesta agregada');
      loadOrders();
    } catch {
      setError('Error al responder reseña');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta orden?')) return;
    try {
      await ordersService.delete(id);
      setSuccess('Orden eliminada');
      loadOrders();
    } catch {
      setError('Error al eliminar la orden');
    }
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusBadge = (statusKey) => {
    const c = STATUS_COLORS[statusKey] || STATUS_COLORS.pending;
    return (
      <span style={{ ...themeBadge(c.bg, c.color), padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {STATUS_ICONS[statusKey] && <span>{STATUS_ICONS[statusKey]}</span>}
        {STATUS_TRANSLATIONS[statusKey] || statusKey}
      </span>
    );
  };

  const paymentBadge = (ps) => {
    const c = STATUS_COLORS[ps] || STATUS_COLORS.pending;
    return (
      <span style={{ ...themeBadge(c.bg, c.color), padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {ps === 'paid' ? '💳' : '⏳'}
        {ps === 'paid' ? 'Pagado' : ps === 'refunded' ? 'Reembolsado' : ps === 'failed' ? 'Fallido' : 'Pendiente'}
      </span>
    );
  };

  const idLabel = (raw) => {
    if (!raw) return <span style={{ color: '#999' }}>—</span>;
    return <span title={raw}>{raw.slice(0, 8)}…</span>;
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '1rem 1rem 2rem' : '40px 2rem 2rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '24px', flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: font.heading, fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: colors.primary, margin: 0 }}>
            Órdenes
          </h2>
          <span style={{
            background: '#f0f0f0', color: orders.length > 0 ? colors.primary : '#666',
            padding: '2px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 500,
            fontFamily: font.body, marginLeft: '10px',
          }}>
            {orders.length}
          </span>
        </div>

        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '24px' }} />

        <div style={{ marginBottom: '16px' }}><AdminNav /></div>

        {success && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
            background: colors.successBg, color: colors.success, padding: '12px 16px',
            borderRadius: '10px', marginTop: '1rem', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body,
            borderLeft: `4px solid ${colors.success}`,
          }}>
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
            background: colors.errorBg, color: colors.error, padding: '12px 16px',
            borderRadius: '10px', marginTop: '1rem', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body,
            borderLeft: `4px solid ${colors.error}`,
          }}>
            {error}
          </motion.div>
        )}

        <motion.div variants={stagger} initial="hidden" animate="visible" custom={0} style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
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
        </motion.div>

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
          <motion.div variants={stagger} initial="hidden" animate="visible" custom={1} style={{ background: colors.white, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #efefef' }}>
            {orders.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '12px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <path d="M9 14l2 2 4-4"/>
                </svg>
                <p style={{ color: '#999', fontSize: '15px', margin: 0, fontFamily: font.body }}>
                  {filter === 'all' ? 'No hay órdenes que mostrar' : `No hay órdenes con estado "${STATUS_TRANSLATIONS[filter] || filter}"`}
                </p>
                <p style={{ color: '#bbb', fontSize: '13px', margin: 0, fontFamily: font.body }}>
                  {filter === 'all' ? 'Aún no se han registrado órdenes en el sistema' : 'Intenta cambiar el filtro para ver más resultados'}
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
                    {orders.map((o, i) => {
                      const sc = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
                      const ps = o.payment?.status || 'pending';
                      const expanded = expandedId === o.id;
                      return (
                        <Fragment key={o.id}>
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            style={{
                              borderTop: `1px solid ${colors.tableBorder}`,
                              background: i % 2 === 0 ? colors.white : colors.tableStripe,
                              cursor: 'pointer', transition: 'background 0.15s ease',
                            }}
                            onClick={() => toggleExpand(o.id)}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0ede8'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? colors.white : colors.tableStripe; }}
                          >
                            <td style={tdMono()}>
                              {o.id.slice(0, 8)}…
                              <span
                                onClick={(e) => { e.stopPropagation(); handleCopy(o.id); }}
                                style={{ cursor: 'pointer', marginLeft: '4px', position: 'relative', userSelect: 'none' }}
                                title="Copiar ID"
                              >
                                📋
                                {copiedId === o.id && (
                                  <span style={{
                                    position: 'absolute', left: '100%', top: '-2px', marginLeft: '4px',
                                    background: colors.primary, color: '#fff', padding: '2px 6px',
                                    borderRadius: '4px', fontSize: '10px', whiteSpace: 'nowrap', zIndex: 10,
                                  }}>
                                    Copiado!
                                  </span>
                                )}
                              </span>
                            </td>
                            {!isMobile && (
                              <td style={tdText('13px', { color: colors.textSecondary })} title={o.created_at ? formatDate(o.created_at) : undefined}>
                                {formatDate(o.created_at)}
                              </td>
                            )}
                            <td style={tdText()}>
                              {o.customer?.name || idLabel(o.customer?.user_id)}
                            </td>
                            {!isMobile && <td style={tdText()}>{o.shop?.name || idLabel(o.shop?.shop_id)}</td>}
                            <td style={{ ...cellStyle, fontSize: '14px', fontWeight: 600, fontFamily: font.body, color: colors.primary }}>
                              S/ {(o.totals?.total || 0).toFixed(2)}
                            </td>
                            <td style={cellStyle}>
                              {statusBadge(o.status)}
                            </td>
                            {!isMobile && (
                              <td style={cellStyle}>
                                {paymentBadge(ps)}
                              </td>
                            )}
                            <td style={cellStyle} onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleDelete(o.id)} style={btnDanger}>Eliminar</button>
                            </td>
                          </motion.tr>
                          {expanded && (
                            <tr key={`${o.id}-detail`}>
                              <td colSpan={HEADERS.length} style={{ padding: '0 16px 16px', background: colors.tableStripe }}>
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  transition={{ duration: 0.25 }}
                                  style={{ borderTop: `1px solid ${colors.tableBorder}`, paddingTop: '16px' }}
                                >
                                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', fontSize: '13px', fontFamily: font.body }}>
                                    <div style={{ lineHeight: 1.8 }}>
                                      <strong>Cliente:</strong> {o.customer?.name || '—'}<br />
                                      <strong>User ID:</strong> <code style={{ fontSize: '12px', color: colors.textSecondary }}>{o.customer?.user_id || '—'}</code><br />
                                      <strong>Pastelería:</strong> {o.shop?.name || '—'}<br />
                                      <strong>Shop ID:</strong> <code style={{ fontSize: '12px', color: colors.textSecondary }}>{o.shop?.shop_id || '—'}</code>
                                    </div>
                                    <div style={{ lineHeight: 1.8 }}>
                                      <strong>Subtotal:</strong> S/ {(o.totals?.subtotal || 0).toFixed(2)}<br />
                                      <strong>Delivery:</strong> S/ {(o.totals?.delivery_fee || 0).toFixed(2)}<br />
                                      <strong>Total:</strong> <span style={{ fontWeight: 600, color: colors.primary }}>S/ {(o.totals?.total || 0).toFixed(2)}</span><br />
                                      <strong>Método pago:</strong> {o.payment?.method || '—'}
                                    </div>
                                  </div>

                                  {o.items?.length > 0 && (
                                    <div style={{ marginTop: '12px' }}>
                                      <strong style={{ fontSize: '13px', fontFamily: font.body }}>Items:</strong>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                                        {o.items.map((item, idx) => (
                                          <span key={idx} style={{
                                            background: colors.white, padding: '6px 12px', borderRadius: '8px',
                                            fontSize: '12px', fontFamily: font.body, border: `1px solid ${colors.border}`,
                                          }}>
                                            <strong>{item.quantity}x</strong> {item.name} — S/ {item.price_at_purchase}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {o.status_history?.length > 0 && (
                                    <div style={{ marginTop: '12px' }}>
                                      <strong style={{ fontSize: '13px', fontFamily: font.body }}>Historial:</strong>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                        {o.status_history.map((s, idx) => statusBadge(s))}
                                      </div>
                                    </div>
                                  )}

                                  <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'end' }}>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'end' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body }}>Estado</label>
                                        <select style={smallSelect} value={newStatus[o.id] || ''} onChange={(e) => setNewStatus((p) => ({ ...p, [o.id]: e.target.value }))}>
                                          <option value="">—</option>
                                          {STATUSES.filter((s) => s !== 'all').map((s) => (
                                            <option key={s} value={s}>{STATUS_TRANSLATIONS[s]}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <button onClick={() => handleUpdateStatus(o.id)} style={btnSmallPrimary}>Actualizar</button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'end' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body }}>Estado pago</label>
                                        <select style={smallSelect} value={newPaymentStatus[o.id] || ''} onChange={(e) => setNewPaymentStatus((p) => ({ ...p, [o.id]: e.target.value }))}>
                                          <option value="">—</option>
                                          {PAYMENT_STATUSES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <button onClick={() => handleUpdatePaymentStatus(o.id)} style={btnSmallPrimary}>Actualizar</button>
                                    </div>
                                  </div>

                                  {(o.review?.rating || o.review?.comment) && (
                                    <div style={{ marginTop: '16px', padding: '14px', background: colors.white, borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                                      <strong style={{ fontSize: '13px', fontFamily: font.body }}>Reseña:</strong>
                                      <div style={{ fontSize: '13px', marginTop: '4px', fontFamily: font.body }}>
                                        {'⭐'.repeat(o.review.rating)} {o.review.comment && `— ${o.review.comment}`}
                                      </div>
                                      {o.review.reply_text && (
                                        <div style={{ fontSize: '13px', marginTop: '6px', color: colors.textSecondary, fontFamily: font.body }}>
                                          <strong>Respuesta:</strong> {o.review.reply_text}
                                        </div>
                                      )}
                                      {!o.review.reply_text && (
                                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'end' }}>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                            <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body }}>Responder</label>
                                            <input style={{ ...smallInput, minWidth: '200px' }} value={replyForm[o.id] || ''} onChange={(e) => setReplyForm((p) => ({ ...p, [o.id]: e.target.value }))} placeholder="Escribe una respuesta..." />
                                          </div>
                                          <button onClick={() => handleReplyReview(o.id)} style={{ padding: '6px 14px', background: colors.accent, color: '#fff', border: 'none', borderRadius: '99px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: font.body }}>
                                            Responder
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {(!o.review?.rating || o.review?.rating === 0) && o.status === 'delivered' && (
                                    <div style={{ marginTop: '16px', padding: '14px', background: colors.white, borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                                      <strong style={{ fontSize: '13px', fontFamily: font.body }}>Agregar reseña:</strong>
                                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'end', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                          <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body }}>Rating</label>
                                          <select style={smallSelect} value={reviewForm.rating} onChange={(e) => setReviewForm((p) => ({ ...p, rating: Number(e.target.value) }))}>
                                            {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{'⭐'.repeat(r)}</option>)}
                                          </select>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: '150px' }}>
                                          <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body }}>Comentario</label>
                                          <input style={smallInput} value={reviewForm.comment} onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))} placeholder="Comentario..." />
                                        </div>
                                        <button onClick={() => handleAddReview(o.id)} style={{ padding: '6px 14px', background: colors.accent, color: '#fff', border: 'none', borderRadius: '99px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: font.body }}>
                                          Agregar
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
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
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
