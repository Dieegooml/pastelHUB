import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsService } from '../../services/productsService';
import { shopsService } from '../../services/shopsService';
import Navbar from '../../components/Navbar';
import Tooltip from '../../components/Tooltip';
import { colors, font, btnPrimary, animStagger, animFadeIn, badge } from '../../styles/theme';

const presetQuantities = [1, 3, 6, 12];

const mediaStyle = `
@media (max-width: 768px) {
  .pd-grid { grid-template-columns: 1fr !important; }
  .pd-image { height: 280px !important; }
  .pd-presets { flex-wrap: wrap; }
}
.lightbox-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.85); z-index: 2000;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; animation: fadeIn 0.2s ease;
}
.lightbox-img {
  max-width: 90vw; max-height: 90vh; object-fit: contain;
  border-radius: 8px; box-shadow: 0 8px 40px rgba(0,0,0,0.4);
}
`;

export default function ProductDetail() {
  const { shop: shopSlug, id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [related, setRelated] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [added, setAdded] = useState(false);
  const [toast, setToast] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const prod = await productsService.getById(id);
        if (!prod || Object.keys(prod).length === 0) {
          setError('Producto no encontrado');
          setLoading(false);
          return;
        }
        setProduct(prod);
        const [shopData, relatedData] = await Promise.all([
          shopsService.getById(prod.shop_id),
          (async () => { try { return await productsService.getByShop(prod.shop_id); } catch { return { data: [] }; } })(),
        ]);
        setShop(shopData);
        const others = (relatedData?.data || []).filter(p => p.id !== prod.id && p.is_available !== false);
        setRelated(others.slice(0, 4));
        try {
          const v = await productsService.getVariants(id);
          setVariants(v?.data || []);
        } catch (e) { console.warn('Failed to load variants:', e); }
      } catch (e) {
        setError(e.message || 'Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  function addToCart() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item.id === product.id && item.variant === selectedVariant);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        shopId: product.shop_id,
        shopName: shop?.name || '',
        name: product.name,
        price: product.price + (selectedVariant ? selectedVariant.extra_price : 0),
        image_url: product.image_url,
        variant: selectedVariant,
        quantity,
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    setAdded(true);
    setToast(`${product.name} agregado al carrito`);
    setTimeout(() => setAdded(false), 1200);
    setTimeout(() => setToast(''), 2500);
  }

  function handleRelatedClick(prodId) {
    navigate(`/producto/${shopSlug}/${prodId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const price = product?.price ?? 0;
  const variantExtra = selectedVariant ? selectedVariant.extra_price : 0;
  const unitPrice = price + variantExtra;
  const totalPrice = unitPrice * quantity;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <style>{mediaStyle}</style>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 16px' }}>
          <div style={{ width: '180px', height: '14px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '20px', animation: 'shimmer 1.5s infinite' }} />
          <div className="pd-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div style={{ width: '100%', height: '400px', background: '#e0e0e0', borderRadius: '12px', animation: 'shimmer 1.5s infinite' }} />
            <div>
              <div style={{ width: '40%', height: '14px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '10px', animation: 'shimmer 1.5s infinite' }} />
              <div style={{ width: '70%', height: '28px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '10px', animation: 'shimmer 1.5s infinite' }} />
              <div style={{ width: '30%', height: '24px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '16px', animation: 'shimmer 1.5s infinite' }} />
              <div style={{ width: '100%', height: '12px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '6px', animation: 'shimmer 1.5s infinite' }} />
              <div style={{ width: '90%', height: '12px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '6px', animation: 'shimmer 1.5s infinite' }} />
              <div style={{ width: '60%', height: '12px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '24px', animation: 'shimmer 1.5s infinite' }} />
              <div style={{ width: '50%', height: '48px', background: '#e0e0e0', borderRadius: '99px', animation: 'shimmer 1.5s infinite' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <style>{mediaStyle}</style>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
          <h2 style={{ fontFamily: font.heading, color: colors.primary }}>Producto no encontrado</h2>
          <p style={{ fontFamily: font.body, color: colors.textSecondary, marginBottom: '20px' }}>{error}</p>
          <button onClick={() => navigate(-1)} style={{ ...btnPrimary, display: 'inline-block' }}>Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <style>{mediaStyle}</style>

      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <img
            src={product.image_url}
            alt={product.name}
            className="lightbox-img"
          />
        </div>
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontFamily: font.body, fontSize: '12px', color: colors.textSecondary,
          marginBottom: '16px', flexWrap: 'wrap',
        }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.accent, fontFamily: font.body, fontSize: '12px', padding: 0 }}>Inicio</button>
          <span>/</span>
          <button onClick={() => navigate(`/shops/${product.shop_id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.accent, fontFamily: font.body, fontSize: '12px', padding: 0 }}>{shop?.name || 'Tienda'}</button>
          <span>/</span>
          <span style={{ color: colors.textMuted }}>{product.name}</span>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button onClick={() => navigate('/shops/' + product.shop_id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: font.body, fontSize: '13px', color: colors.accent,
            padding: '4px 0', display: 'inline-flex', alignItems: 'center', gap: '4px',
          }}>
            ← Volver a {shop?.name || 'la tienda'}
          </button>
        </div>

        <div className="pd-grid" style={{
          ...animStagger(0.02),
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px',
          alignItems: 'start',
        }}>
          <div>
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="pd-image"
                style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'transform 0.2s', display: 'block' }}
                onClick={() => setLightboxOpen(true)}
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.01)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={{
                width: '100%', height: '400px', borderRadius: '16px',
                background: `linear-gradient(135deg, ${colors.grayLight}, ${colors.border})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '72px', color: colors.textSecondary,
              }}>🧁</div>
            )}
            <p style={{ fontFamily: font.body, fontSize: '11px', color: colors.textMuted, textAlign: 'center', marginTop: '8px' }}>
              {product.image_url ? 'Click para ampliar' : 'Sin imagen disponible'}
            </p>
          </div>

          <div>
            {shop && (
              <div style={{
                ...badge,
                background: '#e1f5ee', color: colors.accent,
                display: 'inline-block', marginBottom: '10px',
              }}>
                {shop.name}
              </div>
            )}

            <h1 style={{
              fontFamily: font.heading, fontSize: '26px',
              fontWeight: 700, color: colors.primary,
              margin: '0 0 8px', lineHeight: 1.2,
            }}>{product.name}</h1>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '28px', fontWeight: 700, color: colors.accent, fontFamily: font.body }}>
                S/ {unitPrice.toFixed(2)}
              </span>
              {selectedVariant && selectedVariant.extra_price > 0 && (
                <span style={{ fontSize: '13px', color: colors.textSecondary, fontWeight: 400 }}>
                  (+S/ {selectedVariant.extra_price.toFixed(2)})
                </span>
              )}
              {quantity > 1 && (
                <span style={{ fontSize: '13px', color: colors.textMuted, fontWeight: 400 }}>
                  (S/ {totalPrice.toFixed(2)} total)
                </span>
              )}
            </div>

            {product.stock !== undefined && product.stock !== null && (
              <div style={{
                fontFamily: font.body, fontSize: '13px',
                padding: '6px 12px', borderRadius: '99px',
                display: 'inline-block', marginBottom: '20px',
                background: product.stock === 0 ? '#fee2e2' : product.stock <= 5 ? '#fef3c7' : '#e1f5ee',
                color: product.stock === 0 ? '#dc2626' : product.stock <= 5 ? '#d97706' : '#059669',
                fontWeight: 500,
              }}>
                {product.stock === 0
                  ? 'Agotado'
                  : product.stock <= 5
                    ? `Solo quedan ${product.stock} unidades`
                    : `${product.stock} en stock`
                }
              </div>
            )}

            {product.description && (
              <div style={{
                fontFamily: font.body, fontSize: '14px',
                color: colors.textSecondary, lineHeight: 1.8,
                margin: '0 0 24px', padding: '16px 0', borderTop: `1px solid ${colors.tableBorder}`,
              }}>
                {product.description}
              </div>
            )}

            {variants.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  fontFamily: font.heading, fontSize: '13px',
                  fontWeight: 600, color: colors.primary,
                  margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.03em',
                }}>Variantes</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {variants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(selectedVariant?.type === v.type && selectedVariant?.value === v.value ? null : v)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '99px',
                        border: `1.5px solid ${selectedVariant?.type === v.type && selectedVariant?.value === v.value ? colors.accent : colors.border}`,
                        background: selectedVariant?.type === v.type && selectedVariant?.value === v.value ? '#e1f5ee' : colors.white,
                        cursor: 'pointer',
                        fontFamily: font.body,
                        fontSize: '13px',
                        color: selectedVariant?.type === v.type && selectedVariant?.value === v.value ? colors.accent : colors.text,
                        transition: 'all 0.2s',
                        fontWeight: selectedVariant?.type === v.type && selectedVariant?.value === v.value ? 600 : 400,
                      }}
                    >
                      {v.value} {v.extra_price > 0 ? `(+S/ ${v.extra_price.toFixed(2)})` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontFamily: font.body, fontSize: '13px', fontWeight: 600, color: colors.primary, display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Cantidad
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: `1px solid ${colors.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                  <Tooltip text="Disminuir cantidad">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      style={{
                        width: '36px', height: '36px', border: 'none',
                        background: colors.grayLight, cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '16px', color: colors.text, opacity: quantity <= 1 ? 0.4 : 1,
                      }}
                    >−</button>
                  </Tooltip>
                  <span style={{
                    width: '44px', textAlign: 'center',
                    fontFamily: font.body, fontSize: '15px', fontWeight: 600, color: colors.text,
                  }}>{quantity}</span>
                  <Tooltip text="Aumentar cantidad">
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      style={{
                        width: '36px', height: '36px', border: 'none',
                        background: colors.grayLight, cursor: 'pointer',
                        fontSize: '16px', color: colors.text,
                      }}
                    >+</button>
                  </Tooltip>
                </div>
                <div className="pd-presets" style={{ display: 'flex', gap: '6px' }}>
                  {presetQuantities.map(q => (
                    <button
                      key={q}
                      onClick={() => setQuantity(q)}
                      style={{
                        padding: '4px 12px', borderRadius: '6px', border: `1px solid ${quantity === q ? colors.accent : colors.border}`,
                        background: quantity === q ? '#e1f5ee' : colors.white,
                        cursor: 'pointer', fontFamily: font.body, fontSize: '12px',
                        color: quantity === q ? colors.accent : colors.text,
                        fontWeight: quantity === q ? 600 : 400,
                        transition: 'all 0.15s',
                      }}
                    >{q}</button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={addToCart}
              disabled={product.stock === 0}
              style={{
                ...btnPrimary,
                width: '100%',
                padding: '14px 24px',
                fontSize: '15px',
                opacity: product.stock === 0 ? 0.5 : 1,
                cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                background: added ? '#4caf50' : colors.accent,
                transform: added ? 'scale(0.98)' : 'scale(1)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {product.stock === 0 ? <span>Agotado</span> : added ? <span>✓ Agregado</span> : <><span>🛒</span><span>Agregar al Carrito</span></>}
              {product.stock !== 0 && <span style={{ fontSize: '13px', opacity: 0.8 }}>— S/ {totalPrice.toFixed(2)}</span>}
            </button>
          </div>
        </div>

        {related.length > 0 && (
          <div style={{ marginTop: '48px', ...animFadeIn }}>
            <h2 style={{
              fontFamily: font.heading, fontSize: '20px',
              fontWeight: 700, color: colors.primary,
              margin: '0 0 16px',
            }}>Productos Relacionados</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
              {related.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => handleRelatedClick(p.id)}
                  style={{
                    ...animStagger(i * 0.06),
                    background: colors.white, borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #efefef',
                    overflow: 'hidden', cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name}
                      style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '120px', background: colors.grayLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: colors.border }}>🧁</div>
                  )}
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontFamily: font.heading, fontSize: '13px', fontWeight: 600, color: colors.primary, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: colors.accent, fontFamily: font.body }}>
                        S/ {(p.price || 0).toFixed(2)}
                      </span>
                      {p.stock !== undefined && p.stock <= 5 && p.stock > 0 && (
                        <span style={{ fontSize: '10px', color: '#f59e0b' }}>{p.stock} uds</span>
                      )}
                      {p.stock === 0 && (
                        <span style={{ fontSize: '10px', color: '#dc2626' }}>Agotado</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div style={{
          ...animFadeIn,
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: colors.primary, color: colors.white,
          padding: '12px 24px', borderRadius: '99px',
          fontFamily: font.body, fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
