import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { colors, font, btnPrimary } from '../../styles/theme';

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cart;
    try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch { cart = []; }
    setItems(cart);
    setLoaded(true);
  }, []);

  const updateQuantity = (id, delta) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    );
    setItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const removeItem = (id) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.setItem('cart', '[]');
  };

  const total = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  if (!loaded) return null;

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 2rem 2rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0 }}>Carrito</h2>
            <span style={{ fontFamily: font.body, fontSize: '13px', color: colors.textMuted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</span>
          </div>
          {items.length > 0 && (
            <button onClick={clearCart} style={{
              padding: '6px 14px', borderRadius: '99px', border: `1px solid ${colors.border}`,
              fontSize: '12px', fontWeight: 500, fontFamily: font.body, cursor: 'pointer',
              background: colors.white, color: colors.error,
            }}>Vaciar carrito</button>
          )}
        </div>

        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.5rem' }} />

        {items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '12px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            <p style={{ color: '#999', fontSize: '15px', margin: 0, fontFamily: font.body }}>Tu carrito está vacío</p>
            <p style={{ color: '#bbb', fontSize: '13px', margin: 0, fontFamily: font.body }}>Explora las pastelerías y agrega productos</p>
            <button onClick={() => navigate('/')} style={{ ...btnPrimary, marginTop: '8px' }}>Ver pastelerías</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    background: colors.white, borderRadius: '12px', padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef',
                  }}
                >
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: font.body, color: colors.text }}>{item.name}</div>
                    <div style={{ fontSize: '13px', fontFamily: font.body, color: colors.accent, fontWeight: 600 }}>
                      S/ {(item.price || 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{
                      width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${colors.border}`,
                      background: colors.white, cursor: 'pointer', fontSize: '16px', fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.text,
                    }}>−</button>
                    <span style={{ fontSize: '15px', fontWeight: 600, fontFamily: font.body, minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{
                      width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${colors.border}`,
                      background: colors.white, cursor: 'pointer', fontSize: '16px', fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.text,
                    }}>+</button>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: font.body, color: colors.primary, minWidth: '80px', textAlign: 'right' }}>
                    S/ {((item.price || 0) * item.quantity).toFixed(2)}
                  </div>
                  <button onClick={() => removeItem(item.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px',
                    color: colors.textMuted, padding: '4px',
                  }}>✕</button>
                </motion.div>
              ))}
            </div>

            <div style={{
              background: colors.white, borderRadius: '12px', padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: font.body }}>Total</div>
                <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: font.heading, color: colors.primary }}>S/ {total.toFixed(2)}</div>
              </div>
              <button onClick={() => navigate('/checkout')} style={{ ...btnPrimary, fontSize: '15px', padding: '12px 32px' }}>
                Ir a pagar
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
