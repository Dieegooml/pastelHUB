import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { colors, font, badge as badgeStyle } from '../../styles/theme';
import { shopsService } from '../../services/shopsService';
import { productsService } from '../../services/productsService';
import { reviewsService } from '../../services/reviewsService';

const smallBtn = {
  padding: '6px 14px', borderRadius: '99px', border: 'none', cursor: 'pointer',
  fontSize: '12px', fontWeight: 600, fontFamily: font.body,
  background: colors.accent, color: '#fff', transition: 'all 0.2s ease',
};

const sidebarBox = {
  background: colors.white, borderRadius: '12px', padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef',
};

const sectionTitle = { fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '8px' };

export default function ShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toast, setToast] = useState('');
  const [addedIds, setAddedIds] = useState({});
  const timeoutsRef = useRef([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [shopData, productsData, reviewsData] = await Promise.all([
          shopsService.getById(id),
          productsService.getByShop(id),
          reviewsService.getByShop(id).catch(() => []),
        ]);
        setShop(shopData);
        setProducts(productsData?.data || []);
        setReviews(reviewsData?.data || []);
      } catch (e) { console.error(e); setLoadError('Error al cargar la pastelería'); } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category_id).filter(Boolean))];
    return cats;
  }, [products]);

  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return products.filter((p) => p.is_available !== false);
    return products.filter((p) => p.category_id === categoryFilter && p.is_available !== false);
  }, [products, categoryFilter]);

  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  const addToCart = (product) => {
    let cart;
    try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch { cart = []; }
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: product.id, shopId: id, shopName: shop?.shopName || shop?.name, name: product.name, price: product.price, image_url: product.image_url, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    setAddedIds((p) => ({ ...p, [product.id]: true }));
    setToast(`${product.name} agregado al carrito`);
    timeoutsRef.current.push(setTimeout(() => setToast(''), 2500));
    timeoutsRef.current.push(setTimeout(() => setAddedIds((p) => ({ ...p, [product.id]: false })), 1200));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 2rem' }}>
          <div style={{ height: '200px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '12px', animation: 'shimmer 1.5s infinite', marginBottom: '16px' }} />
          <div style={{ height: '24px', width: '60%', background: '#f0f0f0', borderRadius: '6px', marginBottom: '12px' }} />
          <div style={{ height: '16px', width: '40%', background: '#f0f0f0', borderRadius: '6px' }} />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 2rem', textAlign: 'center' }}>
          <p style={{ color: colors.error, fontFamily: font.body, fontSize: '15px' }}>{loadError}</p>
          <button onClick={() => navigate('/')} style={{ ...smallBtn, marginTop: '12px' }}>Volver al inicio</button>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 2rem', textAlign: 'center' }}>
          <p style={{ color: colors.textMuted, fontFamily: font.body, fontSize: '15px' }}>Pastelería no encontrada</p>
          <button onClick={() => navigate('/')} style={{ ...smallBtn, marginTop: '12px' }}>Volver al inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 2rem 2rem' }}
      >
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: colors.accent, fontFamily: font.body, padding: 0, marginBottom: '16px', display: 'inline-block' }}>
          ← Volver a pastelerías
        </button>

        <div style={{
          background: (shop.bannerUrl || shop.banner_url) ? `url(${shop.bannerUrl || shop.banner_url}) center/cover no-repeat` : `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
          height: '220px', borderRadius: '12px', position: 'relative',
          marginBottom: '56px',
        }}>
          {(shop.logoUrl || shop.logo_url) && (
            <img
              src={shop.logoUrl || shop.logo_url}
              alt={shop.shopName || shop.name}
              style={{
                width: '110px', height: '110px', borderRadius: '50%',
                border: '4px solid white', position: 'absolute', bottom: '-55px',
                left: '32px', objectFit: 'cover', background: colors.white,
              }}
            />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0 }}>{shop.shopName || shop.name}</h1>
            <p style={{ fontFamily: font.body, fontSize: '14px', color: colors.textSecondary, margin: '4px 0 0' }}>
              📍 {shop.city}{shop.address ? ` — ${shop.address}` : ''}
            </p>
          </div>
          <span style={badgeStyle('#e8f5e9', '#2e7d32')}>{shop.approvalStatus || shop.status || 'Activo'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '28px', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: font.heading, fontSize: '22px', fontWeight: 700, color: colors.primary, margin: 0 }}>Productos</h2>
              <span style={{ fontSize: '13px', color: colors.textMuted, fontFamily: font.body }}>
                {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>

            {categories.length > 1 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <button
                  onClick={() => setCategoryFilter('all')}
                  style={{
                    padding: '5px 14px', borderRadius: '99px', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                    fontFamily: font.body, border: categoryFilter === 'all' ? 'none' : `1px solid ${colors.border}`,
                    background: categoryFilter === 'all' ? colors.primary : colors.white,
                    color: categoryFilter === 'all' ? '#fff' : colors.textSecondary,
                    transition: 'all 0.2s ease',
                  }}
                >Todas</button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      padding: '5px 14px', borderRadius: '99px', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                      fontFamily: font.body, border: categoryFilter === cat ? 'none' : `1px solid ${colors.border}`,
                      background: categoryFilter === cat ? colors.accent : colors.white,
                      color: categoryFilter === cat ? '#fff' : colors.textSecondary,
                      transition: 'all 0.2s ease',
                    }}
                  >{cat}</button>
                ))}
              </div>
            )}

            {filtered.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '12px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
                <p style={{ color: '#999', fontSize: '15px', margin: 0, fontFamily: font.body }}>
                  {categoryFilter !== 'all' ? 'No hay productos en esta categoría' : 'Esta pastelería aún no tiene productos disponibles'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    style={{
                      background: colors.white, borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef',
                      overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    }}
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name}
                        style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '140px', background: colors.grayLight,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '28px', color: colors.border,
                      }}>
                        🧁
                      </div>
                    )}
                    <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <button onClick={() => navigate(`/products/${p.id}`)} style={{ fontFamily: font.heading, fontSize: '15px', fontWeight: 600, color: colors.primary, margin: 0, padding: 0, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>{p.name}</button>
                      {p.description && (
                        <p style={{ fontFamily: font.body, fontSize: '11px', color: colors.textSecondary, margin: '3px 0 6px', lineHeight: 1.4, flex: 1 }}>{p.description}</p>
                      )}
                      {p.stock !== undefined && p.stock !== null && p.stock <= 5 && p.stock > 0 && (
                        <div style={{ fontSize: '10px', color: '#f59e0b', fontFamily: font.body, marginBottom: '4px' }}>Solo quedan {p.stock}</div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '6px', borderTop: `1px solid ${colors.tableBorder}` }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: colors.accent, fontFamily: font.body }}>
                          S/ {(p.price || 0).toFixed(2)}
                        </span>
                        <button
                          onClick={() => addToCart(p)}
                          style={{
                            ...smallBtn, padding: '5px 12px', fontSize: '11px',
                            background: addedIds[p.id] ? '#4caf50' : colors.accent,
                            transform: addedIds[p.id] ? 'scale(0.95)' : 'scale(1)',
                          }}
                          onMouseEnter={(e) => { if (!addedIds[p.id]) e.target.style.background = '#168959'; }}
                          onMouseLeave={(e) => { if (!addedIds[p.id]) e.target.style.background = colors.accent; }}
                        >
                          {addedIds[p.id] ? '✓' : 'Agregar'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(shop.shopDescription || shop.description) && (
              <div style={sidebarBox}>
                <div style={sectionTitle}>Descripción</div>
                <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textSecondary, margin: 0, lineHeight: 1.7 }}>{shop.shopDescription || shop.description}</p>
              </div>
            )}

            <div style={sidebarBox}>
              <div style={sectionTitle}>Información</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {shop.rating !== undefined && shop.rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>⭐</span>
                    <div>
                      <div style={{ fontSize: '11px', color: colors.textMuted, fontFamily: font.body }}>Puntuación</div>
                      <div style={{ fontSize: '14px', fontFamily: font.body, color: '#f59e0b' }}>
                        {'★'.repeat(Math.round(shop.rating))}{'☆'.repeat(5 - Math.round(shop.rating))}
                        <span style={{ color: colors.textSecondary, marginLeft: '6px', fontSize: '13px' }}>{shop.rating.toFixed(1)} / 5</span>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>📍</span>
                  <div>
                    <div style={{ fontSize: '11px', color: colors.textMuted, fontFamily: font.body }}>Dirección</div>
                    <div style={{ fontSize: '13px', fontFamily: font.body, color: colors.text }}>{shop.address || shop.city || '—'}</div>
                  </div>
                </div>
                {shop.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>📞</span>
                    <div>
                      <div style={{ fontSize: '11px', color: colors.textMuted, fontFamily: font.body }}>Teléfono</div>
                      <div style={{ fontSize: '13px', fontFamily: font.body, color: colors.text }}>{shop.phone}</div>
                    </div>
                  </div>
                )}
                {shop.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>✉️</span>
                    <div>
                      <div style={{ fontSize: '11px', color: colors.textMuted, fontFamily: font.body }}>Email</div>
                      <div style={{ fontSize: '13px', fontFamily: font.body, color: colors.text }}>{shop.email}</div>
                    </div>
                  </div>
                )}
                {shop.delivery_range && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>🚚</span>
                    <div>
                      <div style={{ fontSize: '11px', color: colors.textMuted, fontFamily: font.body }}>Cobertura</div>
                      <div style={{ fontSize: '13px', fontFamily: font.body, color: colors.text }}>{shop.delivery_range} km</div>
                    </div>
                  </div>
                )}
                {shop.owner_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>👤</span>
                    <div>
                      <div style={{ fontSize: '11px', color: colors.textMuted, fontFamily: font.body }}>Dueño</div>
                      <div style={{ fontSize: '13px', fontFamily: font.body, color: colors.text }}>{shop.owner_name}</div>
                    </div>
                  </div>
                )}
                {shop.owner_id && !shop.owner_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>👤</span>
                    <div>
                      <div style={{ fontSize: '11px', color: colors.textMuted, fontFamily: font.body }}>Dueño ID</div>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', color: colors.textSecondary }}>{shop.owner_id.slice(0, 12)}…</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {shop.schedules && shop.schedules.length > 0 && (
              <div style={sidebarBox}>
                <div style={sectionTitle}>Horarios</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {shop.schedules.map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: font.body }}>
                      <span style={{ color: colors.textSecondary }}>{s.day || s.dayOfWeek}</span>
                      <span style={{ color: colors.text }}>{s.open} — {s.close}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {shop.categories && shop.categories.length > 0 && (
              <div style={sidebarBox}>
                <div style={sectionTitle}>Categorías</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {shop.categories.map((cat, i) => (
                    <span key={i} style={{
                      padding: '3px 10px', borderRadius: '99px', fontSize: '11px',
                      background: colors.grayBg, color: colors.textSecondary, fontFamily: font.body,
                    }}>
                      {cat.name || cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div style={sidebarBox}>
                <div style={sectionTitle}>Reseñas ({reviews.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {reviews.slice(0, 5).map((r) => (
                    <div key={r.id} style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: '10px' }}>
                      <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} style={{ color: star <= r.rating ? '#f59e0b' : '#ddd', marginRight: '1px' }}>★</span>
                        ))}
                      </div>
                      {r.comment && <p style={{ fontFamily: font.body, fontSize: '12px', color: colors.text, margin: 0, lineHeight: 1.5 }}>{r.comment}</p>}
                      {r.ownerReply && (
                        <div style={{ marginTop: '6px', padding: '8px', background: colors.grayLight, borderRadius: '6px', fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, borderLeft: `2px solid ${colors.accent}` }}>
                          <strong style={{ color: colors.accent }}>Dueño:</strong> {r.ownerReply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
              background: colors.primary, color: '#fff', padding: '12px 24px',
              borderRadius: '99px', fontSize: '14px', fontFamily: font.body,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 1000,
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
