import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { productsService } from '../../services/productsService';
import { shopsService } from '../../services/shopsService';
import Navbar from '../../components/Navbar';
import AdminNav from './AdminNav';
import { useIsMobile } from '../../styles/useIsMobile';
import {
  colors, font, cardStyle, inputStyle, selectStyle,
  textareaStyle, btnPrimary, btnDanger, btnGhost, btnSmallPrimary,
  btnSmallSecondary, tableHeaderStyle, labelStyle, badge,
} from '../../styles/theme';

const emptyForm = {
  category_id: '', name: '',
  description: '', price: '', stock: '',
  image_url: '', is_available: true,
};

const emptyVariant = { type: 'size', value: '', extra_price: '' };

const TH = ['Nombre', 'Precio', 'Stock', 'Disponible', 'Acciones'];
const TH_MOBILE = ['Producto', 'Precio', ''];

const stagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' } }),
};

function ImagePreview({ url }) {
  if (!url) return null;
  return (
    <div style={{
      width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden',
      border: `1px solid ${colors.border}`, flexShrink: 0,
      background: colors.bgBeige, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img src={url} alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </div>
  );
}

export default function Products() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [variants, setVariants] = useState([]);
  const [variantForm, setVariantForm] = useState(emptyVariant);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [showVariantPanel, setShowVariantPanel] = useState(false);

  const loadShop = async () => {
    try {
      const data = await shopsService.getById(shopId);
      setShop(data);
    } catch (e) {
      console.error(e);
      setError('Error al cargar la pastelería');
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getByShop(shopId);
      setProducts(data?.data || []);
    } catch (e) {
      console.error(e);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadShop(); loadProducts(); }, [shopId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    try {
      const payload = { ...form, shop_id: shopId };
      if (editingId) {
        await productsService.update(editingId, payload);
        setEditingId(null);
      } else {
        await productsService.create(payload);
      }
      setForm(emptyForm);
      setShowVariantPanel(false);
      setVariants([]);
      setSuccess(editingId ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
      loadProducts();
    } catch (e) {
      console.error(e);
      setError('Error al guardar el producto');
    }
  };

  const handleEdit = async (product) => {
    setEditingId(product.id);
    setForm({
      category_id: product.category_id || '',
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock || '',
      image_url: product.image_url || '',
      is_available: product.is_available !== undefined ? product.is_available : true,
    });
    setShowVariantPanel(true);
    try {
      const data = await productsService.getVariants(product.id);
      setVariants(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setVariants([]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    setError('');
    setSuccess('');
    try {
      await productsService.delete(id);
      setSuccess('Producto eliminado correctamente');
      loadProducts();
    } catch (e) {
      console.error(e);
      setError('Error al eliminar el producto');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowVariantPanel(false);
    setVariants([]);
    setEditingVariantId(null);
    setVariantForm(emptyVariant);
  };

  const handleToggleAvailability = async (id, current) => {
    try {
      await productsService.updateAvailability(id, !current);
      loadProducts();
    } catch (e) {
      console.error(e);
      setError('Error al cambiar disponibilidad');
    }
  };

  const handleVariantChange = (e) => setVariantForm({ ...variantForm, [e.target.name]: e.target.value });

  const handleAddVariant = async () => {
    if (!variantForm.value) return;
    try {
      if (editingVariantId) {
        await productsService.updateVariant(editingId, editingVariantId, variantForm);
      } else {
        await productsService.addVariant(editingId, variantForm);
      }
      setVariantForm(emptyVariant);
      setEditingVariantId(null);
      const data = await productsService.getVariants(editingId);
      setVariants(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('Error al guardar variante');
    }
  };

  const handleEditVariant = (v) => {
    setEditingVariantId(v.variant_id);
    setVariantForm({ type: v.type, value: v.value, extra_price: v.extra_price });
  };

  const handleDeleteVariant = async (variantId) => {
    if (!confirm('¿Eliminar esta variante?')) return;
    try {
      await productsService.deleteVariant(editingId, variantId);
      const data = await productsService.getVariants(editingId);
      setVariants(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('Error al eliminar variante');
    }
  };

  const sectionDivider = { height: '1px', background: colors.border, margin: '1.2rem 0' };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '1rem' : '2rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/admin/shops')} style={{ ...btnGhost, padding: '6px 14px', fontSize: '13px' }}>
            Volver
          </button>
          <h2 style={{ fontFamily: font.heading, fontSize: isMobile ? '20px' : '26px', fontWeight: 700, color: colors.primary, margin: 0 }}>
            {shop?.shopName || 'Cargando...'} — Productos
          </h2>
          <span style={{
            background: colors.white, color: colors.textSecondary, padding: '2px 12px',
            borderRadius: '99px', fontSize: '13px', fontWeight: 500, fontFamily: font.body,
            border: `1px solid ${colors.border}`,
          }}>
            {products.length}
          </span>
        </div>

        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.2rem' }} />

        <AdminNav />

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

        <motion.div variants={stagger} initial="hidden" animate="visible" custom={0} style={{ ...cardStyle, marginTop: '1rem' }}>
          <h3 style={{ fontFamily: font.heading, fontSize: '18px', fontWeight: 700, color: colors.primary, margin: '0 0 0.5rem' }}>
            {editingId ? 'Editar producto' : 'Nuevo producto'}
          </h3>
          <div style={sectionDivider} />

          <div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: isMobile ? '1' : '1 / -1' }}>
                <label style={labelStyle}>Pastelería</label>
                <input style={inputStyle} value={shop?.shopName || ''} disabled />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelStyle}>Nombre del producto *</label>
                <input style={inputStyle} name="name" value={form.name} onChange={handleChange} required placeholder="Ej: Torta de Chocolate" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelStyle}>Precio (S/) *</label>
                <input style={inputStyle} type="number" step="0.01" name="price" value={form.price} onChange={handleChange} required placeholder="0.00" />
              </div>
            </div>

            <div style={sectionDivider} />

            <p style={{ fontSize: '13px', fontWeight: 600, color: colors.primary, fontFamily: font.body, margin: '0 0 10px' }}>Detalles</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelStyle}>Categoría</label>
                <input style={inputStyle} name="category_id" value={form.category_id} onChange={handleChange} placeholder="ID de categoría" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelStyle}>Stock</label>
                <input style={inputStyle} type="number" name="stock" value={form.stock} onChange={handleChange} placeholder="0" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelStyle}>Disponible</label>
                <select style={selectStyle} name="is_available" value={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.value === 'true' })}>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Imagen (URL)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <input style={inputStyle} name="image_url" value={form.image_url} onChange={handleChange} placeholder="https://..." />
                  </div>
                  <ImagePreview url={form.image_url} />
                </div>
              </div>
            </div>

            <div style={sectionDivider} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={labelStyle}>Descripción</label>
              <textarea style={textareaStyle} name="description" value={form.description} onChange={handleChange} placeholder="Describe el producto..." />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
              <button onClick={handleSubmit} style={btnPrimary}
                onMouseEnter={(e) => e.target.style.background = colors.accent}
                onMouseLeave={(e) => e.target.style.background = colors.primary}
              >
                {editingId ? 'Guardar cambios' : 'Crear producto'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} style={btnGhost}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {showVariantPanel && editingId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ ...cardStyle, marginTop: '1rem' }}
          >
            <h3 style={{ fontFamily: font.heading, fontSize: '18px', fontWeight: 700, color: colors.primary, margin: '0 0 0.5rem' }}>
              Variantes
            </h3>
            <div style={sectionDivider} />

            <div style={{ display: 'flex', gap: '10px', alignItems: 'end', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
                <label style={{ ...labelStyle, fontSize: '11px' }}>Tipo</label>
                <select style={selectStyle} name="type" value={variantForm.type} onChange={handleVariantChange}>
                  <option value="size">Tamaño</option>
                  <option value="flavor">Sabor</option>
                  <option value="decoration">Decoración</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px' }}>
                <label style={{ ...labelStyle, fontSize: '11px' }}>Valor *</label>
                <input style={inputStyle} name="value" value={variantForm.value} onChange={handleVariantChange} placeholder="Ej: Grande" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
                <label style={{ ...labelStyle, fontSize: '11px' }}>Precio extra (S/)</label>
                <input style={inputStyle} type="number" step="0.01" name="extra_price" value={variantForm.extra_price} onChange={handleVariantChange} placeholder="0.00" />
              </div>
              <button onClick={handleAddVariant} style={btnSmallPrimary}
                onMouseEnter={(e) => e.target.style.background = colors.accent}
                onMouseLeave={(e) => e.target.style.background = colors.primary}
              >
                {editingVariantId ? 'Actualizar' : 'Agregar'}
              </button>
              {editingVariantId && (
                <button onClick={() => { setEditingVariantId(null); setVariantForm(emptyVariant); }} style={btnSmallSecondary}>
                  Cancelar
                </button>
              )}
            </div>

            {variants.length > 0 && (
              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                      <th style={tableHeaderStyle}>Tipo</th>
                      <th style={tableHeaderStyle}>Valor</th>
                      <th style={tableHeaderStyle}>Extra</th>
                      <th style={tableHeaderStyle}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, i) => (
                      <tr key={v.variant_id} style={{
                        borderTop: `1px solid ${colors.tableBorder}`,
                        background: i % 2 === 0 ? colors.white : colors.tableStripe,
                      }}>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body }}>{v.type}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body }}>{v.value}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body }}>S/ {(v.extra_price || 0).toFixed(2)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleEditVariant(v)} style={btnGhost}>Editar</button>
                            <button onClick={() => handleDeleteVariant(v.variant_id)} style={btnDanger}>Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {variants.length === 0 && <p style={{ color: colors.textMuted, fontSize: '13px', marginTop: '1rem', fontFamily: font.body }}>Sin variantes aún</p>}
          </motion.div>
        )}

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
          <motion.div variants={stagger} initial="hidden" animate="visible" custom={1} style={{ ...cardStyle, marginTop: '1rem', padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                <thead>
                  <tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                    {(isMobile ? TH_MOBILE : TH).map(h => (
                      <th key={h} style={tableHeaderStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={isMobile ? 3 : 5} style={{ padding: '3rem', textAlign: 'center', color: colors.textMuted, fontFamily: font.body }}>
                        No hay productos en esta pastelería aún
                      </td>
                    </tr>
                  ) : (
                    products.map((p, i) => {
                      const avBadge = p.is_available
                        ? { bg: '#e1f5ee', color: '#1D9E75', label: 'Disponible' }
                        : { bg: '#fee2e2', color: '#ef4444', label: 'No disponible' };
                      return (
                        <motion.tr
                          key={p.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          style={{
                            borderTop: `1px solid ${colors.tableBorder}`,
                            background: i % 2 === 0 ? colors.white : colors.tableStripe,
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => { if (i % 2 === 0) e.currentTarget.style.background = '#f5f5f5'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? colors.white : colors.tableStripe; }}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 500, fontFamily: font.body }}>{p.name}</div>
                            {p.description && <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '2px', fontFamily: font.body }}>{p.description.slice(0, 40)}{p.description.length > 40 ? '…' : ''}</div>}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, fontFamily: font.body }}>S/ {(p.price || 0).toFixed(2)}</td>
                          {!isMobile && <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: font.body }}>{p.stock ?? '—'}</td>}
                          {!isMobile && (
                            <td style={{ padding: '12px 16px' }}>
                              <span onClick={() => handleToggleAvailability(p.id, p.is_available)}
                                style={{
                                  cursor: 'pointer', ...badge(avBadge.bg, avBadge.color),
                                  transition: 'all 0.2s ease',
                                }}>
                                {avBadge.label}
                              </span>
                            </td>
                          )}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleEdit(p)} style={btnGhost}>Editar</button>
                              <button onClick={() => handleDelete(p.id)} style={btnDanger}>Eliminar</button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
