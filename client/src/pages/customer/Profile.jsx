import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { colors, font, inputStyle, btnPrimary, btnDanger, btnGhost, btnSmallPrimary, btnSmallSecondary, badge as badgeStyle, labelStyle, animFadeIn } from '../../styles/theme';
import { usersService } from '../../services/usersService';
import ImageUploader from '../../components/ImageUploader';

const ROLE_COLORS = {
  admin: { bg: '#fee2e2', color: '#ef4444' },
  moderator: { bg: '#e3f2fd', color: '#2196f3' },
  owner: { bg: '#fff3e0', color: '#e65100' },
  customer: { bg: '#e8f5e9', color: '#2e7d32' },
};

function AddressForm({ initial, onSave, onCancel }) {
  const [street, setStreet] = useState(initial?.street || '');
  const [city, setCity] = useState(initial?.city || '');
  const [isDefault, setIsDefault] = useState(initial?.is_default || false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!street || !city) return;
    setSaving(true);
    try {
      await onSave({ street, city, is_default: isDefault });
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: colors.grayLight, borderRadius: '10px', padding: '16px', marginTop: '8px' }}>
      <label style={labelStyle}>Calle / Dirección</label>
      <input style={{ ...inputStyle, height: '40px', fontSize: '13px', marginBottom: '10px' }} value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Av. Principal 123" />
      <label style={labelStyle}>Ciudad</label>
      <input style={{ ...inputStyle, height: '40px', fontSize: '13px', marginBottom: '10px' }} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lima" />
      <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
        Dirección por defecto
      </label>
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button onClick={handleSubmit} disabled={saving || !street || !city} style={{ ...btnSmallPrimary, opacity: saving || !street || !city ? 0.6 : 1 }}>{saving ? '...' : 'Guardar'}</button>
        <button onClick={onCancel} style={btnSmallSecondary}>Cancelar</button>
      </div>
    </div>
  );
}

function SkeletonBlock({ height, width, mb }) {
  return (
    <div style={{
      height: height || '16px', width: width || '100%',
      background: '#e0e0e0', borderRadius: '6px', marginBottom: mb || '12px',
      animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%',
      backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    }} />
  );
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState({ name: false, phone: false });

  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const loadProfile = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const u = await usersService.getById(user.uid);
      if (u) {
        setFullName(u.full_name || '');
        setPhone(u.phone || '');
        setPhotoUrl(u.photo_url || '');
        setAddresses(u.addresses || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSaveName = async () => {
    if (!user?.uid || !fullName.trim()) return;
    setSaving((s) => ({ ...s, name: true }));
    setError('');
    setSuccess('');
    try {
      await usersService.update(user.uid, { full_name: fullName.trim() });
      setSuccess('Nombre actualizado');
      await refreshUser();
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al actualizar nombre');
    } finally { setSaving((s) => ({ ...s, name: false })); }
  };

  const handleSavePhone = async () => {
    if (!user?.uid) return;
    setSaving((s) => ({ ...s, phone: true }));
    setError('');
    setSuccess('');
    try {
      await usersService.update(user.uid, { phone });
      setSuccess('Teléfono actualizado');
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al actualizar teléfono');
    } finally { setSaving((s) => ({ ...s, phone: false })); }
  };

  const handlePhotoUpload = async (url) => {
    setPhotoUrl(url);
    if (!url) {
      try {
        await usersService.update(user.uid, { photo_url: '' });
      } catch (e) { console.error(e); }
      return;
    }
    setError('');
    setSuccess('');
    try {
      await usersService.update(user.uid, { photo_url: url });
      setSuccess('Foto de perfil actualizada');
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al actualizar foto');
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await updatePassword(auth.currentUser, newPassword);
      setNewPassword('');
      setSuccess('Contraseña actualizada');
    } catch (e) { console.error(e);
      setError('Error al actualizar contraseña. Puede que necesites volver a iniciar sesión.');
    }
  };

  const handleAddAddress = async (data) => {
    try {
      await usersService.addAddress(user.uid, data);
      setShowAddressForm(false);
      await loadProfile();
      setSuccess('Dirección agregada');
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al agregar dirección');
    }
  };

  const handleUpdateAddress = async (data) => {
    try {
      await usersService.updateAddress(user.uid, editingAddress.address_id, data);
      setEditingAddress(null);
      await loadProfile();
      setSuccess('Dirección actualizada');
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al actualizar dirección');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('¿Eliminar esta dirección?')) return;
    try {
      await usersService.deleteAddress(user.uid, addressId);
      await loadProfile();
      setSuccess('Dirección eliminada');
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al eliminar dirección');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <div
        style={{ ...animFadeIn, maxWidth: '600px', margin: '0 auto', padding: '40px 2rem 2rem' }}
      >
        <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0, marginBottom: '24px' }}>Mi Perfil</h2>
        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.5rem' }} />

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: colors.white, borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#e0e0e0', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <SkeletonBlock height="18px" width="50%" mb="8px" />
                  <SkeletonBlock height="13px" width="35%" mb="0" />
                </div>
              </div>
              <SkeletonBlock height="80px" mb="12px" />
              <div style={{ display: 'flex', gap: '6px' }}>
                <SkeletonBlock height="22px" width="80px" mb="0" />
                <SkeletonBlock height="22px" width="60px" mb="0" />
              </div>
            </div>
            <div style={{ background: colors.white, borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <SkeletonBlock height="16px" width="40%" mb="16px" />
              <SkeletonBlock height="42px" mb="14px" />
              <SkeletonBlock height="42px" mb="0" />
            </div>
            <div style={{ background: colors.white, borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <SkeletonBlock height="16px" width="30%" mb="16px" />
              <SkeletonBlock height="14px" width="80%" mb="0" />
            </div>
          </div>
        ) : (
          <>
        {error && <div style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</div>}
        {success && <div style={{ background: colors.successBg, color: colors.success, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.success}` }}>{success}</div>}

        {/* ── Avatar / Identidad ── */}
        <div style={{ background: colors.white, borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Foto de perfil"
                style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  objectFit: 'cover', border: `2px solid ${colors.border}`,
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: colors.primary, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', fontWeight: 700, fontFamily: font.heading,
                flexShrink: 0,
              }}>
                {user?.email?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: font.body, color: colors.text }}>{fullName || user?.displayName || 'Sin nombre'}</div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: font.body }}>{user?.email}</div>
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <ImageUploader
              folder="profiles"
              currentImageUrl={photoUrl}
              onUploadComplete={handlePhotoUpload}
              label="Foto de perfil"
              aspectRatio="1/1"
            />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {user?.roles?.map((role) => {
              const rc = ROLE_COLORS[role] || { bg: '#f0f0f0', color: '#666' };
              return (
                <span key={role} style={badgeStyle(rc.bg, rc.color)}>
                  {role === 'admin' ? 'Administrador' : role === 'moderator' ? 'Moderador' : role === 'owner' ? 'Dueño' : 'Cliente'}
                </span>
              );
            })}
          </div>
        </div>

        {/* ── Información personal ── */}
        <div style={{ background: colors.white, borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: font.heading, fontSize: '16px', fontWeight: 600, color: colors.primary, margin: 0, marginBottom: '16px' }}>Información personal</h3>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Nombre completo</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ ...inputStyle, height: '42px', fontSize: '13px', flex: 1 }} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" />
              <button onClick={handleSaveName} disabled={saving.name || !fullName.trim()} style={{ ...btnPrimary, padding: '0 20px', fontSize: '13px', opacity: saving.name ? 0.7 : 1 }}>
                {saving.name ? '...' : 'Guardar'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Teléfono</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ ...inputStyle, height: '42px', fontSize: '13px', flex: 1 }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="999 999 999" />
              <button onClick={handleSavePhone} disabled={saving.phone} style={{ ...btnPrimary, padding: '0 20px', fontSize: '13px', opacity: saving.phone ? 0.7 : 1 }}>
                {saving.phone ? '...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mis Direcciones ── */}
        <div style={{ background: colors.white, borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: font.heading, fontSize: '16px', fontWeight: 600, color: colors.primary, margin: 0 }}>Mis Direcciones</h3>
            {!showAddressForm && !editingAddress && (
              <button onClick={() => setShowAddressForm(true)} style={btnSmallPrimary}>+ Agregar</button>
            )}
          </div>

          {showAddressForm && (
            <AddressForm onSave={handleAddAddress} onCancel={() => setShowAddressForm(false)} />
          )}

          {addresses.length === 0 && !showAddressForm && (
            <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textSecondary, margin: 0 }}>No tienes direcciones registradas.</p>
          )}

          {addresses.map((addr) => (
            <div key={addr.address_id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '12px 0', borderBottom: '1px solid #f0f0f0',
            }}>
              {editingAddress?.address_id === addr.address_id ? (
                <div style={{ flex: 1 }}>
                  <AddressForm initial={addr} onSave={handleUpdateAddress} onCancel={() => setEditingAddress(null)} />
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ fontFamily: font.body, fontSize: '14px', color: colors.text, fontWeight: 500 }}>{addr.street}</div>
                    <div style={{ fontFamily: font.body, fontSize: '12px', color: colors.textSecondary }}>{addr.city}</div>
                    {addr.is_default && (
                      <span style={{ ...badgeStyle('#e8f5e9', '#2e7d32'), marginTop: '4px', display: 'inline-block' }}>Por defecto</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => setEditingAddress(addr)} style={btnGhost}>Editar</button>
                    <button onClick={() => handleDeleteAddress(addr.address_id)} style={btnDanger}>Eliminar</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* ── Seguridad ── */}
        <div style={{ background: colors.white, borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: font.heading, fontSize: '16px', fontWeight: 600, color: colors.primary, margin: 0, marginBottom: '16px' }}>Seguridad</h3>
          <div>
            <label style={labelStyle}>Nueva contraseña</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ ...inputStyle, height: '42px', fontSize: '13px', flex: 1 }} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••" />
              <button onClick={handleUpdatePassword} style={{ ...btnPrimary, padding: '0 20px', fontSize: '13px' }}>Actualizar</button>
            </div>
          </div>
        </div>

        {user?.roles?.includes('owner') && (
          <div style={{ background: colors.white, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef' }}>
            <h3 style={{ fontFamily: font.heading, fontSize: '16px', fontWeight: 600, color: colors.primary, margin: 0, marginBottom: '8px' }}>Dueño de pastelería</h3>
            <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textSecondary, margin: '0 0 12px' }}>Administra tus pastelerías, productos y órdenes desde el panel de dueño.</p>
            <button onClick={() => navigate('/owner')} style={btnPrimary}>Ir al panel de dueño</button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
