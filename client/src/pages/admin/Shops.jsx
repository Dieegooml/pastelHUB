import { useEffect, useState } from 'react';
import { shopsService } from '../../services/shopsService';

const emptyForm = {
  shopName: '', description: '', ownerId: '',
  address: '', city: '', phone: '', email: '',
  logoUrl: '', bannerUrl: '',
  approvalStatus: 'pending',
};

const inputStyle = {
  padding: '8px 10px', borderRadius: '6px',
  border: '1px solid #ddd', fontSize: '14px', width: '100%',
};

const STATUS_COLORS = {
  approved:  { bg: '#e1f5ee', color: '#1D9E75' },
  pending:   { bg: '#fff8e1', color: '#f59e0b' },
  rejected:  { bg: '#fee2e2', color: '#ef4444' },
  suspended: { bg: '#f3f4f6', color: '#6b7280' },
};

export default function Shops() {
  const [shops, setShops] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadShops = async () => {
    try {
      setLoading(true);
      const data = await shopsService.getAll();
      setShops(Array.isArray(data) ? data : []);
    } catch {
      setError('Error al cargar pastelerías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadShops(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await shopsService.update(editingId, form);
        setEditingId(null);
      } else {
        await shopsService.create(form);
      }
      setForm(emptyForm);
      loadShops();
    } catch {
      setError('Error al guardar la pastelería');
    }
  };

  const handleEdit = (shop) => {
    setEditingId(shop.id);
    setForm({
      shopName:       shop.shopName       || '',
      description:    shop.description    || '',
      ownerId:        shop.ownerId        || '',
      address:        shop.address        || '',
      city:           shop.city           || '',
      phone:          shop.phone          || '',
      email:          shop.email          || '',
      logoUrl:        shop.logoUrl        || '',
      bannerUrl:      shop.bannerUrl      || '',
      approvalStatus: shop.approvalStatus || 'pending',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta pastelería? Esta acción no se puede deshacer.')) return;
    await shopsService.delete(id);
    loadShops();
  };

  const handleCancel = () => { setEditingId(null); setForm(emptyForm); };

  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>🏪 Pastelerías</h2>

      {/* Formulario */}
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '1.5rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem' }}>{editingId ? 'Editar pastelería' : 'Nueva pastelería'}</h3>

        {error && <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '14px' }}>{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Nombre *</label>
            <input style={inputStyle} name="shopName" value={form.shopName} onChange={handleChange} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Owner ID (UID Firebase) *</label>
            <input style={inputStyle} name="ownerId" value={form.ownerId} onChange={handleChange} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Descripción</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '70px' }} name="description" value={form.description} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Dirección</label>
            <input style={inputStyle} name="address" value={form.address} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Ciudad</label>
            <input style={inputStyle} name="city" value={form.city} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Teléfono</label>
            <input style={inputStyle} name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Email</label>
            <input style={inputStyle} type="email" name="email" value={form.email} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>URL Logo</label>
            <input style={inputStyle} name="logoUrl" value={form.logoUrl} onChange={handleChange} placeholder="https://..." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>URL Banner</label>
            <input style={inputStyle} name="bannerUrl" value={form.bannerUrl} onChange={handleChange} placeholder="https://..." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Estado de aprobación</label>
            <select style={inputStyle} name="approvalStatus" value={form.approvalStatus} onChange={handleChange}>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
              <option value="suspended">Suspendido</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '1.2rem' }}>
          <button type="submit" style={{ padding: '10px 24px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            {editingId ? '💾 Guardar cambios' : '➕ Crear pastelería'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancel} style={{ padding: '10px 24px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Tabla */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#aaa' }}>Cargando...</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9', textAlign: 'left' }}>
                {['Nombre', 'Ciudad', 'Email', 'Teléfono', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shops.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#aaa' }}>
                    No hay pastelerías registradas aún
                  </td>
                </tr>
              ) : (
                shops.map((shop, i) => {
                  const statusStyle = STATUS_COLORS[shop.approvalStatus] || STATUS_COLORS.pending;
                  return (
                    <tr key={shop.id} style={{ borderTop: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500 }}>{shop.shopName}</div>
                        {shop.description && <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{shop.description.slice(0, 50)}{shop.description.length > 50 ? '…' : ''}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>{shop.city || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>{shop.email || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>{shop.phone || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 500, background: statusStyle.bg, color: statusStyle.color }}>
                          {shop.approvalStatus || 'pending'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEdit(shop)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer', background: '#fff', fontSize: '13px' }}>
                            ✏️ Editar
                          </button>
                          <button onClick={() => handleDelete(shop.id)} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#ef4444', fontSize: '13px' }}>
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}