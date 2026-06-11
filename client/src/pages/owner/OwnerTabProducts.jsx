import { useEffect, useState } from 'react';
import { colors, font, inputStyle, btnSmallPrimary, btnGhost, btnDanger, tableHeaderStyle, animStagger } from '../../styles/theme';
import { productsService } from '../../services/productsService';
import { smallInput, sectionTitle } from './ownerConstants';
import ImageUploader from '../../components/ImageUploader';

export default function OwnerTabProducts({ selectedShop, setError, setSuccess }) {
  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    productName: '', productDescription: '', price: '', stock: '', categoryId: '', imageUrl: '', isAvailable: true,
  });

  useEffect(() => {
    if (!selectedShop?.id) return;
    productsService.getByShop(selectedShop.id).then((data) => setProducts(data?.data || [])).catch((e) => console.error(e));
  }, [selectedShop]);

  const resetProductForm = () => {
    setProductForm({ productName: '', productDescription: '', price: '', stock: '', categoryId: '', imageUrl: '', isAvailable: true });
    setEditProductId(null);
    setShowProductForm(false);
  };

  const handleProductSave = async () => {
    if (!productForm.productName || !productForm.price) { setError('Nombre y precio obligatorios'); return; }
    setError('');
    setSuccess('');
    try {
      const payload = { ...productForm, shop_id: selectedShop.id, price: Number(productForm.price), stock: productForm.stock ? Number(productForm.stock) : 0 };
      if (editProductId) {
        await productsService.update(editProductId, payload);
        setSuccess('Producto actualizado');
      } else {
        await productsService.create(payload);
        setSuccess('Producto creado');
      }
      resetProductForm();
      const data = await productsService.getByShop(selectedShop.id);
      setProducts(data?.data || []);
    } catch (e) { console.error(e); setError('Error al guardar producto'); }
  };

  const handleProductDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await productsService.delete(id);
      setSuccess('Producto eliminado');
      const data = await productsService.getByShop(selectedShop.id);
      setProducts(data?.data || []);
    } catch (e) { console.error(e); setError('Error al eliminar'); }
  };

  const handleEditProduct = (p) => {
    setProductForm({
      productName: p.productName || p.name || '',
      productDescription: p.productDescription || p.description || '',
      price: p.price || '',
      stock: p.stock || '',
      categoryId: p.categoryId || p.category_id || '',
      imageUrl: p.imageUrl || p.image_url || '',
      isAvailable: p.isAvailable !== false,
    });
    setEditProductId(p.id);
    setShowProductForm(true);
  };

  return (
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
            <div style={{ gridColumn: '1 / -1' }}><label style={sectionTitle}>Imagen</label><ImageUploader folder="products" currentImageUrl={productForm.imageUrl} onUploadComplete={(url) => setProductForm((p) => ({ ...p, imageUrl: url }))} label="Producto" aspectRatio="1/1" /></div>
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
                  <tr
                    style={{ ...animStagger(i * 0.03), borderTop: `1px solid ${colors.tableBorder}`, background: i % 2 === 0 ? colors.white : colors.tableStripe }}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
