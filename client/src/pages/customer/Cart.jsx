import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Tooltip from '../../components/Tooltip';
import { colors, font, btnPrimary, animFadeIn, animStagger } from '../../styles/theme';

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

  if (!loaded) return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 2rem 2rem' }}>
        <div style={{ height: '28px', width: '120px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '12px', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }} />
        <div style={{ height: '3px', width: '60px', background: '#e0e0e0', borderRadius: '99px', marginBottom: '1.5rem', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            background: colors.white, borderRadius: '12px', padding: '16px',
            marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#e0e0e0', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '15px', width: '60%', background: '#e0e0e0', borderRadius: '4px', marginBottom: '8px', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }} />
              <div style={{ height: '13px', width: '30%', background: '#e0e0e0', borderRadius: '4px', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <div
        style={{ ...animFadeIn, maxWidth: '800px', margin: '0 auto', padding: '40px 2rem 2rem' }}
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
                <div
                  key={item.id}
                  style={{ ...animStagger(i * 0.05),
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
                    <Tooltip text="Disminuir cantidad">
                      <button onClick={() => updateQuantity(item.id, -1)} style={{
                        width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${colors.border}`,
                        background: colors.white, cursor: 'pointer', fontSize: '16px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.text,
                      }}>−</button>
                    </Tooltip>
                    <span style={{ fontSize: '15px', fontWeight: 600, fontFamily: font.body, minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                    <Tooltip text="Aumentar cantidad">
                      <button onClick={() => updateQuantity(item.id, 1)} style={{
                        width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${colors.border}`,
                        background: colors.white, cursor: 'pointer', fontSize: '16px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.text,
                      }}>+</button>
                    </Tooltip>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: font.body, color: colors.primary, minWidth: '80px', textAlign: 'right' }}>
                    S/ {((item.price || 0) * item.quantity).toFixed(2)}
                  </div>
                  <Tooltip text="Eliminar producto">
                    <button onClick={() => removeItem(item.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px',
                      color: colors.textMuted, padding: '4px',
                    }}>✕</button>
                  </Tooltip>
                </div>
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
      </div>
    </div>
  );
}
