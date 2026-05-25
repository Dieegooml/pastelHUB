import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { colors, font, inputStyle, btnPrimary, btnDanger, badge as badgeStyle } from '../../styles/theme';
import { usersService } from '../../services/usersService';

const ROLE_COLORS = {
  admin: { bg: '#fee2e2', color: '#ef4444' },
  moderator: { bg: '#e3f2fd', color: '#2196f3' },
  owner: { bg: '#fff3e0', color: '#e65100' },
  customer: { bg: '#e8f5e9', color: '#2e7d32' },
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      usersService.getById(user.uid).then((u) => {
        if (u?.phone) setPhone(u.phone);
      }).catch(() => {});
    }
  }, [user]);

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      await updatePassword(auth.currentUser, newPassword);
      setNewPassword('');
      setSuccess('Contraseña actualizada');
    } catch {
      setError('Error al actualizar contraseña. Puede que necesites volver a iniciar sesión.');
    }
  };

  const handleUpdatePhone = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await usersService.update(user.uid, { phone });
      setSuccess('Teléfono actualizado');
      await refreshUser();
    } catch {
      setError('Error al actualizar teléfono');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 2rem 2rem' }}
      >
        <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0, marginBottom: '24px' }}>Mi Perfil</h2>
        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.5rem' }} />

        {error && <div style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</div>}
        {success && <div style={{ background: colors.successBg, color: colors.success, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.success}` }}>{success}</div>}

        <div style={{ background: colors.white, borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: colors.primary, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', fontWeight: 700, fontFamily: font.heading,
            }}>
              {user?.email?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: font.body, color: colors.text }}>{user?.displayName || 'Sin nombre'}</div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: font.body }}>{user?.email}</div>
            </div>
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

        <div style={{ background: colors.white, borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: font.heading, fontSize: '16px', fontWeight: 600, color: colors.primary, margin: 0, marginBottom: '16px' }}>Información</h3>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>Teléfono</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ ...inputStyle, height: '42px', fontSize: '13px', flex: 1 }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="999 999 999" />
              <button onClick={handleUpdatePhone} disabled={saving} style={{ ...btnPrimary, padding: '0 20px', fontSize: '13px', opacity: saving ? 0.7 : 1 }}>
                {saving ? '...' : 'Guardar'}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>Nueva contraseña</label>
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
      </motion.div>
    </div>
  );
}
