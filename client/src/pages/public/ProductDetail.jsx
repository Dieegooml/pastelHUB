import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productsService } from '../../services/productsService';
import { shopsService } from '../../services/shopsService';
import Navbar from '../../components/Navbar';
import { colors, font, btnPrimary } from '../../styles/theme';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [added, setAdded] = useState(false);
  const [toast, setToast] = useState('');

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
        const shopData = await shopsService.getById(prod.shop_id);
        setShop(shopData);
        try {
          const v = await productsService.getVariants(id);
          setVariants(v?.data || []);
        } catch {}
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 16px' }}>
          <div style={{ width: '100%', height: '300px', background: '#e0e0e0', borderRadius: '12px', marginBottom: '20px', animation: 'shimmer 1.5s infinite' }} />
          <div style={{ width: '60%', height: '28px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '12px', animation: 'shimmer 1.5s infinite' }} />
          <div style={{ width: '30%', height: '20px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '20px', animation: 'shimmer 1.5s infinite' }} />
          <div style={{ width: '100%', height: '14px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '8px', animation: 'shimmer 1.5s infinite' }} />
          <div style={{ width: '80%', height: '14px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '8px', animation: 'shimmer 1.5s infinite' }} />
          <div style={{ width: '40%', height: '48px', background: '#e0e0e0', borderRadius: '99px', marginTop: '20px', animation: 'shimmer 1.5s infinite' }} />
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
          <h2 style={{ fontFamily: font.heading, color: colors.primary }}>Producto no encontrado</h2>
          <p style={{ fontFamily: font.body, color: colors.textSecondary, marginBottom: '20px' }}>{error}</p>
          <button onClick={() => navigate(-1)} style={{ ...btnPrimary, display: 'inline-block' }}>Volver</button>
        </div>
      </div>
    );
  }

  const price = product.price + (selectedVariant ? selectedVariant.extra_price : 0);

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
        <button
          onClick={() => navigate(`/shops/${product.shop_id}`)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: font.body, fontSize: '13px', color: colors.accent,
            padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          ← Volver a {shop?.name || 'la tienda'}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: colors.white,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: '100%', height: '240px',
              background: colors.grayLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '56px', color: colors.border,
            }}>🧁</div>
          )}

          <div style={{ padding: '28px' }}>
            {shop && (
              <div style={{
                fontFamily: font.body, fontSize: '12px', color: colors.accent,
                marginBottom: '6px', fontWeight: 500,
              }}>
                {shop.name}
              </div>
            )}

            <h1 style={{
              fontFamily: font.heading, fontSize: '26px',
              fontWeight: 700, color: colors.primary,
              margin: '0 0 8px',
            }}>{product.name}</h1>

            <div style={{
              fontSize: '28px', fontWeight: 700,
              color: colors.accent, fontFamily: font.body,
              marginBottom: '16px',
            }}>
              S/ {price.toFixed(2)}
              {selectedVariant && selectedVariant.extra_price > 0 && (
                <span style={{ fontSize: '13px', color: colors.textSecondary, fontWeight: 400, marginLeft: '8px' }}>
                  (+S/ {selectedVariant.extra_price.toFixed(2)})
                </span>
              )}
            </div>

            {product.description && (
              <p style={{
                fontFamily: font.body, fontSize: '14px',
                color: colors.textSecondary, lineHeight: 1.7,
                margin: '0 0 20px',
              }}>
                {product.description}
              </p>
            )}

            {product.stock !== undefined && product.stock !== null && (
              <div style={{
                fontFamily: font.body, fontSize: '13px',
                color: product.stock <= 5 ? '#f59e0b' : '#6b7280',
                marginBottom: '20px',
              }}>
                {product.stock === 0
                  ? 'Agotado'
                  : product.stock <= 5
                    ? `Solo quedan ${product.stock} unidades`
                    : `${product.stock} en stock`
                }
              </div>
            )}

            {variants.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  fontFamily: font.heading, fontSize: '14px',
                  fontWeight: 600, color: colors.primary,
                  margin: '0 0 8px',
                }}>Variantes</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {variants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(selectedVariant?.type === v.type && selectedVariant?.value === v.value ? null : v)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '99px',
                        border: `1.5px solid ${selectedVariant?.type === v.type && selectedVariant?.value === v.value ? colors.accent : colors.border}`,
                        background: selectedVariant?.type === v.type && selectedVariant?.value === v.value ? '#e1f5ee' : colors.white,
                        cursor: 'pointer',
                        fontFamily: font.body,
                        fontSize: '13px',
                        color: selectedVariant?.type === v.type && selectedVariant?.value === v.value ? colors.accent : colors.text,
                        transition: 'all 0.2s',
                      }}
                    >
                      {v.value} {v.extra_price > 0 ? `(+S/ ${v.extra_price.toFixed(2)})` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontFamily: font.body, fontSize: '14px', color: colors.text }}>Cantidad:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: `1px solid ${colors.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  style={{
                    width: '36px', height: '36px', border: 'none',
                    background: colors.grayLight, cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: '16px', color: colors.text, opacity: quantity <= 1 ? 0.4 : 1,
                  }}
                >−</button>
                <span style={{
                  width: '44px', textAlign: 'center',
                  fontFamily: font.body, fontSize: '15px', color: colors.text,
                }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{
                    width: '36px', height: '36px', border: 'none',
                    background: colors.grayLight, cursor: 'pointer',
                    fontSize: '16px', color: colors.text,
                  }}
                >+</button>
              </div>
            </div>

            <button
              onClick={addToCart}
              disabled={product.stock === 0}
              style={{
                ...btnPrimary,
                width: '100%',
                opacity: product.stock === 0 ? 0.5 : 1,
                cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                background: added ? '#4caf50' : colors.accent,
                transform: added ? 'scale(0.98)' : 'scale(1)',
                transition: 'all 0.2s',
              }}
            >
              {product.stock === 0 ? 'Agotado' : added ? '✓ Agregado' : 'Agregar al Carrito'}
            </button>
          </div>
        </motion.div>
      </div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            background: colors.primary, color: colors.white,
            padding: '12px 24px', borderRadius: '99px',
            fontFamily: font.body, fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
          }}
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
}
