import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { colors, font, inputStyle, selectStyle, btnPrimary } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { ordersService } from '../../services/ordersService';
import { paymentsService } from '../../services/paymentsService';

const METHOD_ICONS = { card: '💳', cash: '💵', yape: '📱', plin: '📱' };

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Payment gateway state
  const [step, setStep] = useState('form'); // form | processing | card_form | yape_plin | done
  const [orderIds, setOrderIds] = useState([]);
  const [pagoResult, setPagoResult] = useState(null);

  const [form, setForm] = useState({
    customerName: '', email: '', phone: '',
    address: '', city: '',
    paymentMethod: 'card',
    notes: '',
    // Card demo fields
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

  // Step 1: Create orders
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

      // Ir al paso de pago según método
      if (form.paymentMethod === 'cash') {
        setStep('processing');
        await sleep(500);
        setPagoResult({ success: true, method: 'cash', message: 'Pagarás en efectivo al recibir el pedido' });
        setStep('done');
      } else if (form.paymentMethod === 'card') {
        setStep('card_form');
      } else {
        setStep('yape_plin');
      }
    } catch (e) {
      console.error(e);
      setError('Error al crear la orden. Intenta de nuevo.');
    } finally { setLoading(false); }
  };

  // Step 2: Process card payment through demo gateway
  const handleCardPayment = async () => {
    if (!form.cardholderName) { setError('Ingresa el titular de la tarjeta'); return; }
    setLoading(true);
    setError('');
    setStep('processing');
    try {
      const result = await paymentsService.processGateway({
        orderId: orderIds[0],
        paymentMethod: 'card',
        amount: grandTotal,
        cardDetails: {
          last4: form.cardNumber.replace(/\s/g, '').slice(-4),
          cardholderName: form.cardholderName,
        },
      });
      setPagoResult(result);
      await sleep(800);
      setStep('done');
    } catch (e) {
      console.error(e);
      setError('Error al procesar el pago. Intenta de nuevo.');
      setStep('card_form');
    } finally { setLoading(false); }
  };

  // Step 2: Process Yape/Plin (simulated)
  const handleYapePlinConfirm = async () => {
    setLoading(true);
    setError('');
    setStep('processing');
    try {
      const result = await paymentsService.processGateway({
        orderId: orderIds[0],
        paymentMethod: form.paymentMethod,
        amount: grandTotal,
      });
      setPagoResult(result);
      await sleep(800);
      setStep('done');
    } catch (e) {
      console.error(e);
      setError('Error al procesar el pago. Intenta de nuevo.');
      setStep('yape_plin');
    } finally { setLoading(false); }
  };

  const inpStyle = { ...inputStyle, height: '42px', fontSize: '13px' };

  // --- DONE STEP ---
  if (step === 'done') {
    const ok = pagoResult?.success;
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: '500px', margin: '0 auto', padding: '60px 2rem', textAlign: 'center' }}>
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
        </motion.div>
      </div>
    );
  }

  // --- PROCESSING STEP ---
  if (step === 'processing') {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '500px', margin: '0 auto', padding: '80px 2rem', textAlign: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} style={{ fontSize: '48px', marginBottom: '20px', width: '60px', height: '60px', margin: '0 auto 20px' }}>
            {form.paymentMethod === 'card' ? '💳' : form.paymentMethod === 'yape' ? '📱' : '📱'}
          </motion.div>
          <h3 style={{ fontFamily: font.heading, fontSize: '18px', color: colors.primary, margin: '0 0 8px' }}>Procesando pago</h3>
          <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textMuted, margin: 0 }}>Estamos verificando tu pago...</p>
          <div style={{ width: '200px', height: '4px', background: '#eee', borderRadius: '99px', margin: '20px auto 0', overflow: 'hidden' }}>
            <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }} style={{ width: '50%', height: '100%', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px' }} />
          </div>
        </motion.div>
      </div>
    );
  }

  // --- CARD FORM STEP ---
  if (step === 'card_form') {
    const cardInputStyle = { ...inputStyle, height: '38px', fontSize: '13px' };
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 2rem 2rem' }}>
          <button onClick={() => { setStep('form'); setOrderIds([]); localStorage.setItem('cart', JSON.stringify(items)); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: colors.accent, fontFamily: font.body, padding: 0, marginBottom: '20px', display: 'inline-block' }}>
            ← Volver
          </button>
          <h2 style={{ fontFamily: font.heading, fontSize: '24px', fontWeight: 700, color: colors.primary, margin: '0 0 4px' }}>💳 Pago con tarjeta</h2>
          <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textMuted, margin: '0 0 24px' }}>Datos simulados — gateway demo</p>

          {error && (
            <div style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</div>
          )}

          <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '24px', color: '#fff', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: font.body }}>Demo Bank</span>
              <span style={{ fontSize: '22px' }}>💳</span>
            </div>
            <div style={{ fontSize: '18px', fontFamily: 'monospace', letterSpacing: '2px', marginBottom: '16px' }}>
              {form.cardNumber || '•••• •••• •••• ••••'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase', fontFamily: font.body, marginBottom: '2px' }}>Titular</div>
                <div style={{ fontSize: '12px', fontFamily: font.body }}>{form.cardholderName || 'Tu nombre'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase', fontFamily: font.body, marginBottom: '2px' }}>Vence</div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>{form.cardExpiry || 'MM/AA'}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>Número de tarjeta</label>
              <input style={cardInputStyle} value={form.cardNumber} onChange={(e) => update('cardNumber', e.target.value)} placeholder="4242 4242 4242 4242" maxLength={19} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>Vencimiento</label>
                <input style={cardInputStyle} value={form.cardExpiry} onChange={(e) => update('cardExpiry', e.target.value)} placeholder="MM/AA" />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>CVV</label>
                <input style={cardInputStyle} value={form.cardCvv} onChange={(e) => update('cardCvv', e.target.value)} placeholder="123" maxLength={4} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>Titular de la tarjeta *</label>
              <input style={cardInputStyle} value={form.cardholderName} onChange={(e) => update('cardholderName', e.target.value)} placeholder="Como aparece en la tarjeta" />
            </div>
          </div>

          <div style={{ background: colors.white, borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', margin: '20px 0' }}>
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

          <button onClick={handleCardPayment} disabled={loading} style={{ ...btnPrimary, width: '100%', padding: '14px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Procesando...' : `Pagar S/ ${grandTotal.toFixed(2)}`}
          </button>
        </motion.div>
      </div>
    );
  }

  // --- YAPE / PLIN STEP ---
  if (step === 'yape_plin') {
    const isYape = form.paymentMethod === 'yape';
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 2rem 2rem' }}>
          <button onClick={() => { setStep('form'); setOrderIds([]); localStorage.setItem('cart', JSON.stringify(items)); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: colors.accent, fontFamily: font.body, padding: 0, marginBottom: '20px', display: 'inline-block' }}>
            ← Volver
          </button>
          <h2 style={{ fontFamily: font.heading, fontSize: '24px', fontWeight: 700, color: colors.primary, margin: '0 0 4px' }}>{isYape ? '📱 Yape' : '📱 Plin'}</h2>
          <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textMuted, margin: '0 0 24px' }}>Escanea y paga desde tu app</p>

          <div style={{ background: colors.white, borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ width: '180px', height: '180px', background: isYape ? '#e83e8c' : '#3b82f6', borderRadius: '16px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '140px', height: '140px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <div style={{ fontSize: '40px', marginBottom: '4px' }}>{isYape ? '🔵' : '🟣'}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, fontFamily: font.heading, color: '#333' }}>{isYape ? 'YAPE' : 'PLIN'}</div>
                <div style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace', marginTop: '2px' }}>PastelHub</div>
                <div style={{ fontSize: '9px', color: '#999', fontFamily: 'monospace' }}>S/ {grandTotal.toFixed(2)}</div>
              </div>
            </div>
            <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textSecondary, margin: '0 0 8px' }}>
              {isYape
                ? '1. Abre Yape en tu celular'
                : '1. Abre Plin en tu celular'}
            </p>
            <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textSecondary, margin: '0 0 8px' }}>2. Escanea este código QR</p>
            <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textSecondary, margin: '0 0 8px' }}>3. Confirma el pago</p>
            <p style={{ fontFamily: font.body, fontSize: '13px', fontWeight: 600, color: colors.primary, margin: '12px 0 0' }}>Total: S/ {grandTotal.toFixed(2)}</p>
          </div>

          <div style={{ background: '#fff8e1', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', borderLeft: `4px solid ${colors.accent}` }}>
            <p style={{ fontFamily: font.body, fontSize: '12px', color: colors.text, margin: 0, lineHeight: 1.5 }}>
              ⚡ Demo: Haz clic en "Confirmar pago" para simular el proceso. No se realizará un cobro real.
            </p>
          </div>

          <button onClick={handleYapePlinConfirm} disabled={loading} style={{ ...btnPrimary, width: '100%', padding: '14px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Verificando...' : 'Confirmar pago'}
          </button>
        </motion.div>
      </div>
    );
  }

  // --- MAIN FORM ---
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

            {form.paymentMethod === 'card' && (
              <div style={{ background: '#e8f5e9', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', borderLeft: `4px solid ${colors.success}` }}>
                <p style={{ fontFamily: font.body, fontSize: '12px', color: colors.text, margin: 0, lineHeight: 1.5 }}>
                  🔒 Demo: Después de crear la orden, ingresarás los datos de tarjeta simulados. No se realizará un cobro real.
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
      </motion.div>
    </div>
  );
}
