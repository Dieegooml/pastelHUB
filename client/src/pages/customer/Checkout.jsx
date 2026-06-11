import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { colors, font, inputStyle, selectStyle, btnPrimary, animFadeIn, animScaleIn, animFadeInRight } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { ordersService } from '../../services/ordersService';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [step, setStep] = useState('form');
  const [orderIds, setOrderIds] = useState([]);
  const [pagoResult, setPagoResult] = useState(null);

  const [form, setForm] = useState({
    customerName: '', email: '', phone: '',
    address: '', city: '',
    paymentMethod: 'mercadopago',
    notes: '',
    cardNumber: '4242 4242 4242 4242',
    cardExpiry: '12/28',
    cardCvv: '123',
    cardholderName: '',
  });

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  useEffect(() => {
    let cart;
    try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch { cart = []; }
    if (cart.length === 0) { navigate('/cart'); return; }
    setItems(cart);
  }, [navigate]);

  const total = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const deliveryFee = total > 0 ? 5 : 0;
  const grandTotal = total + deliveryFee;
  const hasMultipleShops = [...new Set(items.map(i => i.shopId).filter(Boolean))].length > 1;

  const handleCreateOrders = async () => {
    if (!form.customerName || !form.address || !form.city) {
      setError('Completa los campos obligatorios');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const shopIds = [...new Set(items.map((i) => i.shopId).filter(Boolean))];
      if (shopIds.length === 0) { setError('Error con el carrito'); setLoading(false); return; }

      const ids = [];
      for (const shopId of shopIds) {
        const shopItems = items.filter((i) => i.shopId === shopId);
        const shopTotal = shopItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
        const orderData = {
          customer: { user_id: user?.uid || '' },
          shop: { shop_id: shopId },
          items: shopItems.map((item) => ({
            product_id: item.id, quantity: item.quantity,
            price_at_purchase: item.price, name: item.name,
          })),
          totals: { subtotal: shopTotal, delivery_fee: 5 },
          payment: { method: form.paymentMethod },
        };
        const res = await ordersService.create(orderData);
        ids.push(res?.id || res?.orderId || '');
      }
      setOrderIds(ids);
      localStorage.setItem('cart', '[]');

      if (form.paymentMethod === 'cash') {
        setStep('processing');
        await sleep(500);
        setPagoResult({ success: true, method: 'cash', message: 'Pagarás en efectivo al recibir el pedido' });
        setStep('done');
      } else {
        setStep('payment_gateway');
      }
    } catch (e) {
      console.error(e);
      setError('Error al crear la orden. Intenta de nuevo.');
    } finally { setLoading(false); }
  };

  const handlePaymentSuccess = (result) => {
    setPagoResult(result);
    setStep('done');
  };

  const handlePaymentError = (msg) => {
    setError(msg);
    setStep('form');
  };

  const inpStyle = { ...inputStyle, height: '42px', fontSize: '13px' };

  if (step === 'done') {
    const ok = pagoResult?.success;
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ ...animScaleIn, maxWidth: '500px', margin: '0 auto', padding: '60px 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>{ok ? '🎉' : '❌'}</div>
          <h2 style={{ fontFamily: font.heading, fontSize: '24px', fontWeight: 700, color: ok ? colors.primary : colors.error, margin: '0 0 8px' }}>
            {ok ? '¡Pedido confirmado!' : 'Pago rechazado'}
          </h2>
          <p style={{ fontFamily: font.body, fontSize: '14px', color: colors.textMuted, margin: '0 0 4px', lineHeight: 1.6 }}>
            {pagoResult?.message || (ok
              ? 'Tu orden está en proceso. Te notificaremos cuando esté lista.'
              : 'Hubo un problema con el pago. Intenta con otro método.')}
          </p>
          {pagoResult?.transactionRef && (
            <p style={{ fontFamily: font.body, fontSize: '12px', color: colors.textSecondary, margin: '8px 0' }}>
              Ref: {pagoResult.transactionRef}
            </p>
          )}
          <button onClick={() => navigate('/my-orders')} style={{ ...btnPrimary, marginTop: '20px', padding: '12px 32px', fontSize: '14px' }}>
            Ver mis órdenes
          </button>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ ...animFadeIn, maxWidth: '500px', margin: '0 auto', padding: '80px 2rem', textAlign: 'center' }}>
          <div className="spin-icon" style={{ fontSize: '48px', marginBottom: '20px', width: '60px', height: '60px', margin: '0 auto 20px' }}>
            {form.paymentMethod === 'card' ? '💳' : form.paymentMethod === 'yape' ? '📱' : form.paymentMethod === 'mercadopago' ? '🟡' : '📱'}
          </div>
          <h3 style={{ fontFamily: font.heading, fontSize: '18px', color: colors.primary, margin: '0 0 8px' }}>Procesando pago</h3>
          <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textMuted, margin: 0 }}>Estamos verificando tu pago...</p>
          <div style={{ width: '200px', height: '4px', background: '#eee', borderRadius: '99px', margin: '20px auto 0', overflow: 'hidden' }}>
            <div className="progress-bar" style={{ width: '50%', height: '100%', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px' }} />
          </div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1.5s linear infinite}@keyframes progressSlide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}.progress-bar{animation:progressSlide 1.2s ease-in-out infinite}`}</style>
      </div>
    );
  }

  if (step === 'payment_gateway') {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ ...animFadeInRight, maxWidth: '480px', margin: '0 auto', padding: '40px 2rem 2rem' }}>
          <button onClick={() => { setStep('form'); setOrderIds([]); localStorage.setItem('cart', JSON.stringify(items)); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: colors.accent, fontFamily: font.body, padding: 0, marginBottom: '20px', display: 'inline-block' }}>
            ← Volver
          </button>
          <h2 style={{ fontFamily: font.heading, fontSize: '24px', fontWeight: 700, color: colors.primary, margin: '0 0 4px' }}>
            {form.paymentMethod === 'mercadopago' ? '🟡 Pago con MercadoPago' : form.paymentMethod === 'card' ? '💳 Pago con tarjeta' : form.paymentMethod === 'yape' ? '📱 Yape' : '📱 Plin'}
          </h2>
          <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textMuted, margin: '0 0 24px' }}>Completa el pago para confirmar tu pedido</p>

          <div style={{ background: colors.white, borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, fontFamily: font.heading, color: colors.primary }}>
              <span>Total a pagar</span>
              <span>S/ {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {hasMultipleShops && (
            <p style={{ fontSize: '12px', color: colors.textMuted, fontFamily: font.body, marginBottom: '12px' }}>
              ℹ️ El pago se procesa para la primera orden. Las demás quedan registradas con pago pendiente.
            </p>
          )}

          <PaymentGateway
            orderIds={orderIds}
            total={grandTotal}
            email={user?.email || form.email}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onBack={() => { setStep('form'); setOrderIds([]); localStorage.setItem('cart', JSON.stringify(items)); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <div
        style={{ ...animFadeIn, maxWidth: '800px', margin: '0 auto', padding: '40px 2rem 2rem' }}
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
                    <option value="mercadopago">🟡 MercadoPago</option>
                    <option value="card">💳 Tarjeta de crédito/débito</option>
                    <option value="cash">💵 Efectivo</option>
                    <option value="yape">📱 Yape</option>
                    <option value="plin">📱 Plin</option>
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

            {form.paymentMethod === 'cash' && (
              <div style={{ background: '#fff8e1', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', borderLeft: `4px solid ${colors.accent}` }}>
                <p style={{ fontFamily: font.body, fontSize: '12px', color: colors.text, margin: 0, lineHeight: 1.5 }}>
                  💵 Pagarás en efectivo al recibir tu pedido. No es necesario procesar un pago ahora.
                </p>
              </div>
            )}

            {form.paymentMethod === 'mercadopago' && (
              <div style={{ background: '#e8f5e9', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', borderLeft: `4px solid ${colors.success}` }}>
                <p style={{ fontFamily: font.body, fontSize: '12px', color: colors.text, margin: 0, lineHeight: 1.5 }}>
                  🟡 Paga con MercadoPago — tarjetas, transferencia o efectivo. Redirigiremos al portal de pago.
                </p>
              </div>
            )}

            {form.paymentMethod === 'card' && (
              <div style={{ background: '#e8f5e9', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', borderLeft: `4px solid ${colors.success}` }}>
                <p style={{ fontFamily: font.body, fontSize: '12px', color: colors.text, margin: 0, lineHeight: 1.5 }}>
                  🔒 Demo: Después de crear la orden, podrás pagar con tarjeta.
                </p>
              </div>
            )}

            <button
              onClick={handleCreateOrders}
              disabled={loading}
              style={{ ...btnPrimary, width: '100%', padding: '14px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creando orden...' : `Confirmar pedido — S/ ${grandTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
