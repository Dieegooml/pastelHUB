import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { colors, font, badge as badgeStyle, inputStyle, selectStyle } from '../../styles/theme';
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

const STATUS_ICONS = {
  pending: '⏳', confirmed: '✅', preparing: '👨‍🍳',
  on_the_way: '🚚', delivered: '📦', cancelled: '❌',
};

const ORDERED_STATUSES = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await ordersService.getById(id);
        setOrder(data);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleSubmitReview = async () => {
    setSubmitting(true);
    setReviewError('');
    try {
      await ordersService.addReview(id, reviewRating, reviewComment);
      setReviewSuccess('¡Reseña enviada!');
      setReviewComment('');
      const data = await ordersService.getById(id);
      setOrder(data);
    } catch {
      setReviewError('Error al enviar la reseña');
    } finally { setSubmitting(false); }
  };

  const badge = (statusKey) => {
    const c = STATUS_COLORS[statusKey] || STATUS_COLORS.pending;
    return <span style={badgeStyle(c.bg, c.color)}>{STATUS_ICONS[statusKey]} {STATUS_TRANSLATIONS[statusKey] || statusKey}</span>;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 2rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '48px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '10px', marginBottom: '12px', animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 2rem', textAlign: 'center' }}>
          <p style={{ color: colors.textMuted, fontFamily: font.body, fontSize: '15px' }}>Orden no encontrada</p>
          <button onClick={() => navigate('/my-orders')} style={{ padding: '10px 24px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '99px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: font.body, marginTop: '12px' }}>Mis órdenes</button>
        </div>
      </div>
    );
  }

  const currentIdx = ORDERED_STATUSES.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 2rem 2rem' }}
      >
        <button onClick={() => navigate('/my-orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: colors.accent, fontFamily: font.body, padding: 0, marginBottom: '16px', display: 'inline-block' }}>
          ← Mis órdenes
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontFamily: font.heading, fontSize: '22px', fontWeight: 700, color: colors.primary, margin: 0 }}>Orden #{order.id?.slice(0, 8)}</h2>
            <span style={{ fontFamily: font.body, fontSize: '13px', color: colors.textMuted }}>{order.created_at?.toDate ? order.created_at.toDate().toLocaleString('es-PE') : new Date(order.created_at).toLocaleString('es-PE')}</span>
          </div>
          {badge(order.status)}
        </div>

        {!isCancelled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '32px', background: colors.white, borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef' }}>
            {ORDERED_STATUSES.map((s, idx) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 700, fontFamily: font.body,
                  background: idx <= currentIdx ? STATUS_COLORS[s]?.bg : '#f0f0f0',
                  color: idx <= currentIdx ? STATUS_COLORS[s]?.color : '#ccc',
                  border: `2px solid ${idx <= currentIdx ? STATUS_COLORS[s]?.color : '#e0e0e0'}`,
                }}>
                  {idx + 1}
                </div>
                <div style={{ marginLeft: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, fontFamily: font.body, color: idx <= currentIdx ? colors.text : colors.textMuted }}>{STATUS_TRANSLATIONS[s]}</div>
                </div>
                {idx < ORDERED_STATUSES.length - 1 && (
                  <div style={{
                    flex: 1, height: '2px', margin: '0 8px',
                    background: idx < currentIdx ? STATUS_COLORS[s]?.color : '#e0e0e0',
                  }} />
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: colors.white, borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef' }}>
            <div style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Dirección de entrega</div>
            <div style={{ fontSize: '14px', fontFamily: font.body, color: colors.text, lineHeight: 1.6 }}>
              {order.shipping_address?.address || '—'}<br />
              {order.shipping_address?.city || '—'}
            </div>
          </div>
          <div style={{ background: colors.white, borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef' }}>
            <div style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Contacto</div>
            <div style={{ fontSize: '14px', fontFamily: font.body, color: colors.text, lineHeight: 1.6 }}>
              {order.customer?.name || '—'}<br />
              {order.customer?.email || ''}<br />
              {order.customer?.phone || ''}
            </div>
          </div>
        </div>

        <div style={{ background: colors.white, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: font.heading, fontSize: '16px', fontWeight: 600, color: colors.primary, margin: 0, marginBottom: '16px' }}>Productos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {order.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontFamily: font.body, color: colors.text }}>
                  <strong>{item.quantity}x</strong> {item.name}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: font.body, color: colors.primary }}>
                  S/ {(item.price_at_purchase * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: '16px', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: font.body, marginBottom: '4px' }}>
              <span style={{ color: colors.textSecondary }}>Subtotal</span>
              <span style={{ color: colors.textSecondary }}>S/ {(order.totals?.subtotal || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: font.body, marginBottom: '4px' }}>
              <span style={{ color: colors.textSecondary }}>Delivery</span>
              <span style={{ color: colors.textSecondary }}>S/ {(order.totals?.delivery_fee || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 700, fontFamily: font.heading, color: colors.primary, marginTop: '8px', paddingTop: '12px', borderTop: `1px solid ${colors.border}` }}>
              <span>Total</span>
              <span>S/ {(order.totals?.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {order.status_history?.length > 0 && (
          <div style={{ background: colors.white, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef' }}>
            <h3 style={{ fontFamily: font.heading, fontSize: '16px', fontWeight: 600, color: colors.primary, margin: 0, marginBottom: '12px' }}>Historial</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {order.status_history.map((s, i) => (
                <span key={i} style={badgeStyle(STATUS_COLORS[s]?.bg || '#f0f0f0', STATUS_COLORS[s]?.color || '#666')}>
                  {STATUS_TRANSLATIONS[s] || s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Review Section */}
        {order.review?.rating !== undefined && (
          <div style={{ marginTop: '20px', background: colors.white, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef' }}>
            <h3 style={{ fontFamily: font.heading, fontSize: '16px', fontWeight: 600, color: colors.primary, margin: 0, marginBottom: '12px' }}>Tu reseña</h3>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} style={{ color: star <= order.review.rating ? '#f59e0b' : '#ddd', marginRight: '2px' }}>★</span>
              ))}
            </div>
            {order.review.comment && <p style={{ fontFamily: font.body, fontSize: '14px', color: colors.text, margin: 0, lineHeight: 1.6 }}>{order.review.comment}</p>}
            {order.review.reply_text && (
              <div style={{ marginTop: '12px', padding: '12px', background: colors.grayLight, borderRadius: '8px', borderLeft: `3px solid ${colors.accent}` }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: colors.accent, fontFamily: font.body, marginBottom: '4px' }}>Respuesta del dueño:</div>
                <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.text, margin: 0 }}>{order.review.reply_text}</p>
              </div>
            )}
          </div>
        )}

        {/* Review Form (solo si entregada, sin reseña, o con rating 0) */}
        {order.status === 'delivered' && (!order.review?.rating || order.review.rating === 0) && (
          <div style={{ marginTop: '20px', background: colors.white, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef' }}>
            <h3 style={{ fontFamily: font.heading, fontSize: '16px', fontWeight: 600, color: colors.primary, margin: 0, marginBottom: '12px' }}>
              {order.review?.rating === 0 ? 'Editar reseña' : 'Calificar esta orden'}
            </h3>
            {reviewError && <div style={{ color: colors.error, fontSize: '13px', fontFamily: font.body, marginBottom: '8px' }}>{reviewError}</div>}
            {reviewSuccess && <div style={{ color: colors.success, fontSize: '13px', fontFamily: font.body, marginBottom: '8px' }}>{reviewSuccess}</div>}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '6px' }}>Puntuación</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '28px',
                      color: star <= reviewRating ? '#f59e0b' : '#ddd',
                      transition: 'color 0.15s ease', padding: '0 2px',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '6px' }}>Comentario (opcional)</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                style={{ ...inputStyle, width: '100%', minHeight: '80px', padding: '10px 14px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
                placeholder="Cuenta tu experiencia..."
              />
            </div>
            <button
              onClick={handleSubmitReview}
              disabled={submitting}
              style={{
                padding: '10px 24px', background: colors.accent, color: '#fff', border: 'none',
                borderRadius: '99px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                fontFamily: font.body, opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Enviando...' : 'Enviar reseña'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
