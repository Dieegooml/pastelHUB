import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { shopsService } from '../../services/shopsService';
import { usersService } from '../../services/usersService';
import Navbar from '../../components/Navbar';
import AdminNav from './AdminNav';
import { useIsMobile } from '../../styles/useIsMobile';
import {
  colors, font, pageStyle, cardStyle, inputStyle, selectStyle,
  textareaStyle, btnPrimary, btnDanger, btnGhost, btnSmallPrimary,
  tableHeaderStyle, labelStyle, badge,
} from '../../styles/theme';

const emptyForm = {
  shopName: '', description: '', ownerId: '',
  address: '', city: '', phone: '', email: '',
  logoUrl: '', bannerUrl: '',
  approvalStatus: 'pending',
};

const STATUS_CONFIG = {
  approved:  { bg: '#e1f5ee', color: '#1D9E75' },
  pending:   { bg: '#fff8e1', color: '#f59e0b' },
  rejected:  { bg: '#fee2e2', color: '#ef4444' },
  suspended: { bg: '#f3f4f6', color: '#6b7280' },
};

const TH = ['Nombre', 'Ciudad', 'Estado', 'Acciones'];
const TH_MOBILE = ['Nombre', 'Estado', ''];

const stagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' } }),
};

function ImagePreview({ url, alt }) {
  if (!url) return null;
  return (
    <div style={{
      width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden',
      border: `1px solid ${colors.border}`, flexShrink: 0,
      background: colors.bgBeige, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img src={url} alt={alt || ''}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </div>
  );
}

export default function Shops() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);
  const [shops, setShops] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const ownerOptions = users.filter((u) => u.roles?.includes('owner'));

  useEffect(() => {
    const load = async () => {
      try {
        const data = await usersService.getAll();
        setUsers(Array.isArray(data) ? data : []);
      } catch {} finally { setLoadingUsers(false); }
    };
    load();
  }, []);

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
    setSuccess('');
    try {
      if (editingId) {
        await shopsService.update(editingId, form);
        setEditingId(null);
      } else {
        await shopsService.create(form);
      }
      setForm(emptyForm);
      setSuccess(editingId ? 'Pastelería actualizada correctamente' : 'Pastelería creada correctamente');
      loadShops();
    } catch {
      setError('Error al guardar la pastelería');
    }
  };

  const handleEdit = (shop) => {
    setEditingId(shop.id);
    setForm({
      shopName:       shop.shopName          || '',
      description:    shop.shopDescription   || shop.description || '',
      ownerId:        shop.ownerId           || '',
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
    setError('');
    setSuccess('');
    try {
      await shopsService.delete(id);
      setSuccess('Pastelería eliminada correctamente');
      loadShops();
    } catch {
      setError('Error al eliminar la pastelería');
    }
  };

  const handleCancel = () => { setEditingId(null); setForm(emptyForm); };

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
          <h2 style={{ fontFamily: font.heading, fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: colors.primary, margin: 0 }}>
            Pastelerías
          </h2>
          <span style={{
            background: colors.white, color: colors.textSecondary, padding: '2px 12px',
            borderRadius: '99px', fontSize: '13px', fontWeight: 500, fontFamily: font.body,
            border: `1px solid ${colors.border}`,
          }}>
            {shops.length}
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
            {editingId ? 'Editar pastelería' : 'Nueva pastelería'}
          </h3>
          <div style={sectionDivider} />

          <form onSubmit={handleSubmit}>
            {/* Basic info */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelStyle}>Nombre de la pastelería *</label>
                <input style={inputStyle} name="shopName" value={form.shopName} onChange={handleChange} required placeholder="Ej: Dulce Tentación" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelStyle}>Propietario *</label>
                <select
                  style={{ ...selectStyle, color: form.ownerId ? colors.text : '#aaa' }}
                  name="ownerId" value={form.ownerId} onChange={handleChange} required
                >
                  <option value="">{loadingUsers ? 'Cargando usuarios...' : 'Selecciona un dueño'}</option>
                  {ownerOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email} {u.email ? `(${u.email})` : ''}
                    </option>
                  ))}
                  {!loadingUsers && ownerOptions.length === 0 && (
                    <option value="" disabled>No hay usuarios con rol owner</option>
                  )}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: isMobile ? '1' : '1 / -1' }}>
                <label style={labelStyle}>Descripción</label>
                <textarea style={textareaStyle} name="description" value={form.description} onChange={handleChange} placeholder="Describe tu pastelería..." />
              </div>
            </div>

            <div style={sectionDivider} />

            {/* Location */}
            <p style={{ fontSize: '13px', fontWeight: 600, color: colors.primary, fontFamily: font.body, margin: '0 0 10px' }}>Ubicación</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelStyle}>Dirección</label>
                <input style={inputStyle} name="address" value={form.address} onChange={handleChange} placeholder="Av. Principal 123" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelStyle}>Ciudad</label>
                <input style={inputStyle} name="city" value={form.city} onChange={handleChange} placeholder="Lima" />
              </div>
            </div>

            <div style={sectionDivider} />

            {/* Contact */}
            <p style={{ fontSize: '13px', fontWeight: 600, color: colors.primary, fontFamily: font.body, margin: '0 0 10px' }}>Contacto</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelStyle}>Teléfono</label>
                <input style={inputStyle} name="phone" value={form.phone} onChange={handleChange} placeholder="+51 999 999 999" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" name="email" value={form.email} onChange={handleChange} placeholder="contacto@ejemplo.com" />
              </div>
            </div>

            <div style={sectionDivider} />

            {/* Media */}
            <p style={{ fontSize: '13px', fontWeight: 600, color: colors.primary, fontFamily: font.body, margin: '0 0 10px' }}>Imágenes</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Logo (URL)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <input style={inputStyle} name="logoUrl" value={form.logoUrl} onChange={handleChange} placeholder="https://..." />
                  </div>
                  <ImagePreview url={form.logoUrl} alt="Logo" />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Banner (URL)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <input style={inputStyle} name="bannerUrl" value={form.bannerUrl} onChange={handleChange} placeholder="https://..." />
                  </div>
                  <ImagePreview url={form.bannerUrl} alt="Banner" />
                </div>
              </div>
            </div>

            <div style={sectionDivider} />

            {/* Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '280px' }}>
              <label style={labelStyle}>Estado de aprobación</label>
              <select style={selectStyle} name="approvalStatus" value={form.approvalStatus} onChange={handleChange}>
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
              <button type="submit" style={btnPrimary}
                onMouseEnter={(e) => e.target.style.background = colors.accent}
                onMouseLeave={(e) => e.target.style.background = colors.primary}
              >
                {editingId ? 'Guardar cambios' : 'Crear pastelería'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} style={btnGhost}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </motion.div>

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
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                <thead>
                  <tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                    {(isMobile ? TH_MOBILE : TH).map(h => (
                      <th key={h} style={tableHeaderStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shops.length === 0 ? (
                    <tr>
                      <td colSpan={isMobile ? 3 : 4} style={{ padding: '3rem', textAlign: 'center', color: colors.textMuted, fontFamily: font.body }}>
                        No hay pastelerías registradas aún
                      </td>
                    </tr>
                  ) : (
                    shops.map((shop, i) => {
                      const sc = STATUS_CONFIG[shop.approvalStatus] || STATUS_CONFIG.pending;
                      return (
                        <motion.tr
                          key={shop.id}
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
                            <div style={{ fontWeight: 500, fontFamily: font.body }}>{shop.shopName}</div>
                            {!isMobile && shop.shopDescription && (
                              <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '2px', fontFamily: font.body }}>
                                {shop.shopDescription.slice(0, 50)}{shop.shopDescription.length > 50 ? '…' : ''}
                              </div>
                            )}
                            {isMobile && (
                              <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '2px' }}>
                                {shop.city || '—'} {shop.phone ? `· ${shop.phone}` : ''}
                              </div>
                            )}
                          </td>
                          {!isMobile && (
                            <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body }}>{shop.city || '—'}</td>
                          )}
                          <td style={{ padding: '12px 16px' }}>
                            <span style={badge(sc.bg, sc.color)}>
                              {shop.approvalStatus || 'pending'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button onClick={() => handleEdit(shop)} style={btnGhost}>Editar</button>
                              <button onClick={() => navigate(`/admin/shops/${shop.id}/products`)} style={btnSmallPrimary}
                                onMouseEnter={(e) => e.target.style.background = colors.accent}
                                onMouseLeave={(e) => e.target.style.background = colors.primary}
                              >Productos</button>
                              <button onClick={() => handleDelete(shop.id)} style={btnDanger}>Eliminar</button>
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
