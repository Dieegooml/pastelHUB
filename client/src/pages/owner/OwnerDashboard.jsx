import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { colors, font, inputStyle, selectStyle, badge as badgeStyle, tableHeaderStyle, btnPrimary, btnSmallPrimary, btnDanger, btnGhost } from '../../styles/theme';
import { shopsService } from '../../services/shopsService';
import { productsService } from '../../services/productsService';
import { ordersService } from '../../services/ordersService';

const TABS = ['info', 'products', 'orders'];
const TAB_LABELS = { info: 'Información', products: 'Productos', orders: 'Órdenes' };

const STATUS_TRANSLATIONS = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'Preparando',
  on_the_way: 'En camino', delivered: 'Entregado', cancelled: 'Cancelado',
};
const STATUS_COLORS = {
  pending: { bg: '#fff8e1', color: '#f59e0b' }, confirmed: { bg: '#e1f5ee', color: '#1D9E75' },
  preparing: { bg: '#e3f2fd', color: '#2196f3' }, on_the_way: { bg: '#fff3e0', color: '#e65100' },
  delivered: { bg: '#e8f5e9', color: '#2e7d32' }, cancelled: { bg: '#fee2e2', color: '#ef4444' },
};
const ALL_STATUSES = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'];

const smallInput = { ...inputStyle, height: '40px', fontSize: '13px' };

const sectionTitle = { fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '6px' };

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [tab, setTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Shop form state
  const [shopForm, setShopForm] = useState({ shopName: '', shopDescription: '', address: '', city: '', phone: '', email: '', deliveryRange: '', logoUrl: '', bannerUrl: '' });
  const [savingShop, setSavingShop] = useState(false);

  // Products
  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [productForm, setProductForm] = useState({ productName: '', productDescription: '', price: '', stock: '', categoryId: '', imageUrl: '', isAvailable: true });

  // Orders
  const [orders, setOrders] = useState([]);
  const [statusUpdate, setStatusUpdate] = useState({});

  const selectedShop = shops[selectedIdx];

  useEffect(() => {
    const load = async () => {
      try {
        const all = await shopsService.getAll();
        const owned = Array.isArray(all) ? all.filter((s) => s.ownerId === user?.uid) : [];
        setShops(owned);
      } catch (e) { setError(e.message || 'Error al cargar pastelerías'); } finally { setLoading(false); }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!selectedShop) return;
    setShopForm({
      shopName: selectedShop.shopName || '', shopDescription: selectedShop.shopDescription || '',
      address: selectedShop.address || '', city: selectedShop.city || '',
      phone: selectedShop.phone || '', email: selectedShop.email || '',
      deliveryRange: selectedShop.deliveryRange || '', logoUrl: selectedShop.logoUrl || '',
      bannerUrl: selectedShop.bannerUrl || '',
    });
    setError(''); setSuccess('');
  }, [selectedShop]);

  useEffect(() => {
    if (!selectedShop?.id || tab !== 'products') return;
    productsService.getByShop(selectedShop.id).then((data) => setProducts(Array.isArray(data) ? data : [])).catch(() => {});
  }, [selectedShop, tab]);

  useEffect(() => {
    if (!selectedShop?.id || tab !== 'orders') return;
    ordersService.getByShop(selectedShop.id).then((data) => setOrders(Array.isArray(data) ? data : [])).catch(() => {});
  }, [selectedShop, tab]);

  const handleShopSave = async () => {
    setSavingShop(true); setError(''); setSuccess('');
    try {
      await shopsService.update(selectedShop.id, shopForm);
      const all = await shopsService.getAll();
      setShops(Array.isArray(all) ? all.filter((s) => s.ownerId === user?.uid) : []);
      setSuccess('Información actualizada');
    } catch { setError('Error al guardar'); } finally { setSavingShop(false); }
  };

  const resetProductForm = () => {
    setProductForm({ productName: '', productDescription: '', price: '', stock: '', categoryId: '', imageUrl: '', isAvailable: true });
    setEditProductId(null); setShowProductForm(false);
  };

  const handleProductSave = async () => {
    if (!productForm.productName || !productForm.price) { setError('Nombre y precio obligatorios'); return; }
    setError(''); setSuccess('');
    try {
      const payload = { ...productForm, shopId: selectedShop.id, price: Number(productForm.price), stock: productForm.stock ? Number(productForm.stock) : 0 };
      if (editProductId) {
        await productsService.update(editProductId, payload);
        setSuccess('Producto actualizado');
      } else {
        await productsService.create(payload);
        setSuccess('Producto creado');
      }
      resetProductForm();
      const data = await productsService.getByShop(selectedShop.id);
      setProducts(Array.isArray(data) ? data : []);
    } catch { setError('Error al guardar producto'); }
  };

  const handleProductDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try { await productsService.delete(id); setSuccess('Producto eliminado'); const data = await productsService.getByShop(selectedShop.id); setProducts(Array.isArray(data) ? data : []); }
    catch { setError('Error al eliminar'); }
  };

  const handleEditProduct = (p) => {
    setProductForm({ productName: p.productName || p.name || '', productDescription: p.productDescription || p.description || '', price: p.price || '', stock: p.stock || '', categoryId: p.categoryId || p.category_id || '', imageUrl: p.imageUrl || p.image_url || '', isAvailable: p.isAvailable !== false });
    setEditProductId(p.id); setShowProductForm(true);
  };

  const handleOrderStatus = async (id) => {
    if (!statusUpdate[id]) return;
    try { await ordersService.updateStatus(id, statusUpdate[id]); setStatusUpdate((p) => ({ ...p, [id]: '' })); setSuccess('Estado actualizado'); const data = await ordersService.getByShop(selectedShop.id); setOrders(Array.isArray(data) ? data : []); }
    catch { setError('Error al actualizar estado'); }
  };

  const statusBadge = (key) => {
    const c = STATUS_COLORS[key] || STATUS_COLORS.pending;
    return <span style={badgeStyle(c.bg, c.color)}>{STATUS_TRANSLATIONS[key] || key}</span>;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 2rem' }}>
          {[1, 2].map((i) => <div key={i} style={{ height: '80px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '12px', marginBottom: '16px', animation: 'shimmer 1.5s infinite' }} />)}
        </div>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: '12px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <p style={{ color: '#999', fontSize: '15px', margin: 0, fontFamily: font.body }}>No tienes pastelerías registradas</p>
          <p style={{ color: '#bbb', fontSize: '13px', margin: 0, fontFamily: font.body }}>Solicita a un administrador que te asigne una pastelería</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 2rem 2rem' }}>
        <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0, marginBottom: '4px' }}>Panel de Dueño</h2>
        <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textMuted, margin: '0 0 24px' }}>Administra tus pastelerías, productos y órdenes</p>
        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.5rem' }} />

        {shops.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {shops.map((s, i) => (
              <button key={s.id} onClick={() => { setSelectedIdx(i); setTab('info'); }}
                style={{
                  padding: '8px 18px', borderRadius: '99px', cursor: 'pointer', fontSize: '13px', fontWeight: selectedIdx === i ? 600 : 500,
                  fontFamily: font.body, border: selectedIdx === i ? 'none' : `1px solid ${colors.border}`,
                  background: selectedIdx === i ? colors.accent : colors.white,
                  color: selectedIdx === i ? '#fff' : colors.textSecondary, transition: 'all 0.2s ease',
                }}
              >{s.shopName}</button>
            ))}
          </div>
        )}

        {selectedShop && (
          <>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '4px' }}>
              {TABS.map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  style={{
                    padding: '8px 18px', borderRadius: '99px', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t ? 600 : 500,
                    fontFamily: font.body, border: 'none', background: tab === t ? colors.primary : 'transparent',
                    color: tab === t ? '#fff' : colors.textSecondary, transition: 'all 0.2s ease',
                  }}
                >{TAB_LABELS[t]}</button>
              ))}
            </div>

            {error && <div style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</div>}
            {success && <div style={{ background: colors.successBg, color: colors.success, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.success}` }}>{success}</div>}

            {tab === 'info' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={sectionTitle}>Nombre</label>
                  <input style={smallInput} value={shopForm.shopName} onChange={(e) => setShopForm((p) => ({ ...p, shopName: e.target.value }))} />
                </div>
                <div>
                  <label style={sectionTitle}>Ciudad</label>
                  <input style={smallInput} value={shopForm.city} onChange={(e) => setShopForm((p) => ({ ...p, city: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={sectionTitle}>Descripción</label>
                  <textarea style={{ ...inputStyle, height: 'auto', minHeight: '70px', padding: '10px 14px', fontSize: '13px', resize: 'vertical' }} value={shopForm.shopDescription} onChange={(e) => setShopForm((p) => ({ ...p, shopDescription: e.target.value }))} />
                </div>
                <div>
                  <label style={sectionTitle}>Dirección</label>
                  <input style={smallInput} value={shopForm.address} onChange={(e) => setShopForm((p) => ({ ...p, address: e.target.value }))} />
                </div>
                <div>
                  <label style={sectionTitle}>Teléfono</label>
                  <input style={smallInput} value={shopForm.phone} onChange={(e) => setShopForm((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label style={sectionTitle}>Email</label>
                  <input style={smallInput} value={shopForm.email} onChange={(e) => setShopForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label style={sectionTitle}>Cobertura (km)</label>
                  <input style={smallInput} value={shopForm.deliveryRange} onChange={(e) => setShopForm((p) => ({ ...p, deliveryRange: e.target.value }))} />
                </div>
                <div>
                  <label style={sectionTitle}>Logo URL</label>
                  <input style={smallInput} value={shopForm.logoUrl} onChange={(e) => setShopForm((p) => ({ ...p, logoUrl: e.target.value }))} />
                  {shopForm.logoUrl && <img src={shopForm.logoUrl} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', marginTop: '4px' }} onError={(e) => { e.target.style.display = 'none'; }} />}
                </div>
                <div>
                  <label style={sectionTitle}>Banner URL</label>
                  <input style={smallInput} value={shopForm.bannerUrl} onChange={(e) => setShopForm((p) => ({ ...p, bannerUrl: e.target.value }))} />
                  {shopForm.bannerUrl && <img src={shopForm.bannerUrl} alt="" style={{ width: '100%', height: '48px', borderRadius: '6px', objectFit: 'cover', marginTop: '4px' }} onError={(e) => { e.target.style.display = 'none'; }} />}
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button onClick={handleShopSave} disabled={savingShop} style={{ ...btnPrimary, fontSize: '13px', padding: '10px 28px', opacity: savingShop ? 0.7 : 1 }}>{savingShop ? 'Guardando...' : 'Guardar cambios'}</button>
                </div>
              </div>
            )}

            {tab === 'products' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', color: colors.textMuted, fontFamily: font.body }}>{products.length} {products.length === 1 ? 'producto' : 'productos'}</span>
                  <button onClick={() => { resetProductForm(); setShowProductForm(!showProductForm); }} style={btnSmallPrimary}>{showProductForm ? 'Cancelar' : '+ Nuevo producto'}</button>
                </div>

                {showProductForm && (
                  <div style={{ background: colors.white, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', marginBottom: '20px' }}>
                    <h4 style={{ fontFamily: font.heading, fontSize: '15px', fontWeight: 600, color: colors.primary, margin: 0, marginBottom: '14px' }}>{editProductId ? 'Editar producto' : 'Nuevo producto'}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div><label style={sectionTitle}>Nombre *</label><input style={smallInput} value={productForm.productName} onChange={(e) => setProductForm((p) => ({ ...p, productName: e.target.value }))} /></div>
                      <div><label style={sectionTitle}>Precio S/ *</label><input style={smallInput} type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} /></div>
                      <div><label style={sectionTitle}>Stock</label><input style={smallInput} type="number" value={productForm.stock} onChange={(e) => setProductForm((p) => ({ ...p, stock: e.target.value }))} /></div>
                      <div><label style={sectionTitle}>Categoría</label><input style={smallInput} value={productForm.categoryId} onChange={(e) => setProductForm((p) => ({ ...p, categoryId: e.target.value }))} /></div>
                      <div style={{ gridColumn: '1 / -1' }}><label style={sectionTitle}>Descripción</label><textarea style={{ ...inputStyle, height: 'auto', minHeight: '50px', padding: '10px 14px', fontSize: '13px', resize: 'vertical' }} value={productForm.productDescription} onChange={(e) => setProductForm((p) => ({ ...p, productDescription: e.target.value }))} /></div>
                      <div style={{ gridColumn: '1 / -1' }}><label style={sectionTitle}>Imagen URL</label><input style={smallInput} value={productForm.imageUrl} onChange={(e) => setProductForm((p) => ({ ...p, imageUrl: e.target.value }))} /></div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontFamily: font.body, color: colors.text, cursor: 'pointer' }}>
                          <input type="checkbox" checked={productForm.isAvailable} onChange={(e) => setProductForm((p) => ({ ...p, isAvailable: e.target.checked }))} />
                          Producto disponible
                        </label>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                      <button onClick={handleProductSave} style={btnSmallPrimary}>{editProductId ? 'Actualizar' : 'Crear producto'}</button>
                      <button onClick={resetProductForm} style={btnGhost}>Cancelar</button>
                    </div>
                  </div>
                )}

                {products.length === 0 && !showProductForm ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontFamily: font.body, fontSize: '14px' }}>Aún no tienes productos. Crea tu primer producto.</div>
                ) : (
                  <div style={{ background: colors.white, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #efefef' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                          <th style={tableHeaderStyle}>Nombre</th><th style={tableHeaderStyle}>Precio</th><th style={tableHeaderStyle}>Stock</th><th style={tableHeaderStyle}>Disponible</th><th style={tableHeaderStyle}>Acciones</th>
                        </tr></thead>
                        <tbody>
                          {products.map((p, i) => (
                            <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                              style={{ borderTop: `1px solid ${colors.tableBorder}`, background: i % 2 === 0 ? colors.white : colors.tableStripe }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#f0ede8'; }} onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? colors.white : colors.tableStripe; }}
                            >
                              <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: font.body }}>{p.productName || p.name}</td>
                              <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: colors.accent, fontFamily: font.body }}>S/ {(p.price || 0).toFixed(2)}</td>
                              <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body }}>{p.stock ?? '—'}</td>
                              <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body }}>{p.isAvailable !== false ? '✅' : '❌'}</td>
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button onClick={() => handleEditProduct(p)} style={btnGhost}>Editar</button>
                                  <button onClick={() => handleProductDelete(p.id)} style={btnDanger}>Eliminar</button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'orders' && (
              <div style={{ background: colors.white, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #efefef' }}>
                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontFamily: font.body, fontSize: '14px' }}>No hay órdenes para esta pastelería</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                        <th style={tableHeaderStyle}>Orden</th><th style={tableHeaderStyle}>Cliente</th><th style={tableHeaderStyle}>Total</th><th style={tableHeaderStyle}>Estado</th><th style={tableHeaderStyle}>Actualizar</th>
                      </tr></thead>
                      <tbody>
                        {orders.map((o, i) => (
                          <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                            style={{ borderTop: `1px solid ${colors.tableBorder}`, background: i % 2 === 0 ? colors.white : colors.tableStripe }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0ede8'; }} onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? colors.white : colors.tableStripe; }}
                          >
                            <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: colors.textSecondary }}>{o.id?.slice(0, 8)}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body }}>{o.customer?.name || '—'}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: colors.primary, fontFamily: font.body }}>S/ {(o.totals?.total || 0).toFixed(2)}</td>
                            <td style={{ padding: '12px 16px' }}>{statusBadge(o.status)}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <select style={{ ...selectStyle, height: '32px', padding: '0 8px', fontSize: '11px', width: '120px' }}
                                  value={statusUpdate[o.id] || ''} onChange={(e) => setStatusUpdate((s) => ({ ...s, [o.id]: e.target.value }))}>
                                  <option value="">—</option>
                                  {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_TRANSLATIONS[s]}</option>)}
                                </select>
                                <button onClick={() => handleOrderStatus(o.id)} style={btnSmallPrimary}>OK</button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
