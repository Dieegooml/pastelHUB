import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { colors, font, inputStyle, selectStyle, btnPrimary } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { ordersService } from '../../services/ordersService';

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    customerName: '', email: '', phone: '',
    address: '', city: '',
    paymentMethod: 'card',
    notes: '',
  });

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) { navigate('/cart'); return; }
    setItems(cart);
  }, [navigate]);

  const total = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const deliveryFee = total > 0 ? 5 : 0;
  const grandTotal = total + deliveryFee;

  const handleSubmit = async () => {
    if (!form.customerName || !form.address || !form.city) {
      setError('Completa los campos obligatorios');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const shopId = items[0]?.shopId;
      if (!shopId) { setError('Error con el carrito'); setLoading(false); return; }

      const orderData = {
        customer: { user_id: user?.uid || '' },
        shop: { shop_id: shopId },
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price_at_purchase: item.price,
          name: item.name,
        })),
        totals: {
          subtotal: total,
          delivery_fee: deliveryFee,
        },
        payment: {
          method: form.paymentMethod,
        },
      };

      await ordersService.create(orderData);
      localStorage.setItem('cart', '[]');
      setSuccess('¡Orden creada exitosamente!');
      setTimeout(() => navigate('/my-orders'), 1500);
    } catch {
      setError('Error al crear la orden. Intenta de nuevo.');
    } finally { setLoading(false); }
  };

  const inpStyle = { ...inputStyle, height: '42px', fontSize: '13px' };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 2rem 2rem' }}
      >
        <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0, marginBottom: '4px' }}>Checkout</h2>
        <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textMuted, margin: '0 0 24px' }}>Revisa tu pedido y completa los datos</p>
        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.5rem' }} />

        {error && (
          <div style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</div>
        )}
        {success && (
          <div style={{ background: colors.successBg, color: colors.success, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.success}` }}>{success}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <div style={{ background: colors.white, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef' }}>
              <h3 style={{ fontFamily: font.heading, fontSize: '16px', fontWeight: 600, color: colors.primary, margin: 0, marginBottom: '16px' }}>Datos de entrega</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>Nombre completo *</label>
                  <input style={inpStyle} value={form.customerName} onChange={(e) => update('customerName', e.target.value)} placeholder="Tu nombre" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>Email</label>
                    <input style={inpStyle} type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="correo@ejemplo.com" />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>Teléfono</label>
                    <input style={inpStyle} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="999 999 999" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>Dirección *</label>
                  <input style={inpStyle} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Av. Ejemplo 123" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>Ciudad *</label>
                  <input style={inpStyle} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Lima" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>Método de pago</label>
                  <select style={selectStyle} value={form.paymentMethod} onChange={(e) => update('paymentMethod', e.target.value)}>
                    <option value="card">Tarjeta de crédito/débito</option>
                    <option value="cash">Efectivo</option>
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>Notas</label>
                  <textarea style={{ ...inputStyle, height: 'auto', minHeight: '60px', padding: '10px 14px', fontSize: '13px', resize: 'vertical' }} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Instrucciones especiales..." />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ background: colors.white, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: font.heading, fontSize: '16px', fontWeight: 600, color: colors.primary, margin: 0, marginBottom: '16px' }}>Resumen del pedido</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: font.body }}>
                    <span style={{ color: colors.text }}><strong>{item.quantity}x</strong> {item.name}</span>
                    <span style={{ color: colors.textSecondary }}>S/ {((item.price || 0) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: '12px', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: font.body, marginBottom: '4px' }}>
                  <span style={{ color: colors.textSecondary }}>Subtotal</span>
                  <span style={{ color: colors.textSecondary }}>S/ {total.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: font.body, marginBottom: '4px' }}>
                  <span style={{ color: colors.textSecondary }}>Delivery</span>
                  <span style={{ color: colors.textSecondary }}>S/ {deliveryFee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, fontFamily: font.heading, color: colors.primary, marginTop: '8px', paddingTop: '12px', borderTop: `1px solid ${colors.border}` }}>
                  <span>Total</span>
                  <span>S/ {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ ...btnPrimary, width: '100%', padding: '14px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creando orden...' : 'Confirmar pedido'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
