import { useEffect, useState } from 'react';
import { useIsMobile } from '../../styles/useIsMobile';
import { usersService } from '../../services/usersService';
import Navbar from '../../components/Navbar';
import ModeratorNav from './ModeratorNav';
import { colors, font, btnPrimary, btnGhost, cardStyle, tableHeaderStyle, animFadeIn, animFadeInLeft } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['admin', 'moderator', 'owner', 'customer'];

const ROLE_BADGES = {
  admin:     { bg: '#fee2e2', color: '#ef4444' },
  moderator: { bg: '#e3f2fd', color: '#2196f3' },
  owner:     { bg: '#fff8e1', color: '#f59e0b' },
  customer:  { bg: '#e1f5ee', color: '#1D9E75' },
};

export default function ModeratorUsers() {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editRoles, setEditRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isMobile = useIsMobile(768);
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('admin');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getAll();
      setUsers(data?.data || []);
    } catch (e) {
      console.error(e);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleRoleToggle = (role) => {
    if (role === 'admin' && !isAdmin) return;
    const current = editRoles;
    const updated = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    setEditRoles(updated.length ? updated : ['customer']);
  };

  const handleEdit = (u) => {
    setEditingId(u.id);
    setEditRoles(u.roles || ['customer']);
    setSuccess('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveRoles = async () => {
    setError('');
    setSuccess('');
    try {
      await usersService.update(editingId, { roles: editRoles });
      setEditingId(null);
      setSuccess('Roles actualizados correctamente');
      loadUsers();
    } catch (e) {
      console.error(e);
      setError('Error al actualizar roles');
    }
  };

  const handleCancel = () => { setEditingId(null); setEditRoles([]); };

  const sectionDivider = { height: '1px', background: colors.border, margin: '1.2rem 0' };

  const headers = isMobile ? ['Nombre', 'Roles', ''] : ['Nombre', 'Email', 'Roles', 'Estado', 'Acciones'];

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <div style={{ ...animFadeIn, maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '1rem' : '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: font.heading, fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: colors.primary, margin: 0 }}>
            Usuarios
          </h2>
          <span style={{
            background: colors.white, color: colors.textSecondary, padding: '2px 12px',
            borderRadius: '99px', fontSize: '13px', fontWeight: 500, fontFamily: font.body,
            border: `1px solid ${colors.border}`,
          }}>
            {users.length}
          </span>
        </div>

        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.2rem' }} />

        <ModeratorNav />

        {success && (
          <div style={{ ...animFadeInLeft,
            background: colors.successBg, color: colors.success, padding: '12px 16px',
            borderRadius: '10px', marginTop: '1rem', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body,
            borderLeft: `4px solid ${colors.success}`,
          }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ ...animFadeInLeft,
            background: colors.errorBg, color: colors.error, padding: '12px 16px',
            borderRadius: '10px', marginTop: '1rem', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body,
            borderLeft: `4px solid ${colors.error}`,
          }}>
            {error}
          </div>
        )}

        {editingId && (
          <div style={{ ...cardStyle, marginTop: '1rem' }}>
            <h3 style={{ fontFamily: font.heading, fontSize: '18px', fontWeight: 700, color: colors.primary, margin: '0 0 0.5rem' }}>
              Editar roles
            </h3>
            <div style={sectionDivider} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontFamily: font.body, fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>Roles</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {ROLES.map((role) => {
                  const rb = ROLE_BADGES[role];
                  const selected = editRoles.includes(role);
                  const isAdminRole = role === 'admin';
                  const disabled = isAdminRole && !isAdmin;
                  return (
                    <label key={role} style={{
                      display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      padding: '7px 16px', borderRadius: '99px',
                      background: selected ? rb.bg : colors.bgBeige,
                      border: `1.5px solid ${selected ? rb.color : colors.border}`,
                      opacity: disabled ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                    }}
                    title={disabled ? 'Solo admins pueden asignar este rol' : role}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={disabled}
                        onChange={() => handleRoleToggle(role)}
                        style={{ accentColor: colors.accent, margin: 0 }}
                      />
                      {role}
                    </label>
                  );
                })}
              </div>
              {!isAdmin && (
                <p style={{ fontSize: '12px', color: colors.textMuted, fontFamily: font.body, margin: '8px 0 0' }}>
                  No puedes asignar el rol <strong>admin</strong>.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.2rem' }}>
              <button onClick={handleSaveRoles} style={btnPrimary}
                onMouseEnter={(e) => e.target.style.background = colors.accent}
                onMouseLeave={(e) => e.target.style.background = colors.primary}
              >
                Guardar roles
              </button>
              <button type="button" onClick={handleCancel} style={btnGhost}>
                Cancelar
              </button>
            </div>
          </div>
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
          <div style={{ ...cardStyle, marginTop: '1rem', padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                    {headers.map((h) => (
                      <th key={h} style={tableHeaderStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={isMobile ? 3 : 5} style={{ padding: '3rem', textAlign: 'center', color: colors.textMuted, fontFamily: font.body }}>
                        No hay usuarios registrados
                      </td>
                    </tr>
                  ) : (
                    users.map((u, i) => (
                      <tr key={u.id}
                        style={{
                          borderTop: `1px solid ${colors.tableBorder}`,
                          background: i % 2 === 0 ? colors.white : colors.tableStripe,
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => { if (i % 2 === 0) e.currentTarget.style.background = '#f5f5f5'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? colors.white : colors.tableStripe; }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 500, fontFamily: font.body }}>
                          {u.full_name || '—'}
                        </td>
                        {!isMobile && <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body }}>{u.email || '—'}</td>}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {(u.roles || []).map((r) => {
                              const rb = ROLE_BADGES[r] || ROLE_BADGES.customer;
                              return (
                                <span key={r} style={{
                                  padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 500,
                                  background: rb.bg, color: rb.color, fontFamily: font.body,
                                }}>
                                  {r}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        {!isMobile && (
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '4px 12px', borderRadius: '99px',
                              fontSize: '12px', fontWeight: 500, fontFamily: font.body,
                              background: u.isActive !== false ? colors.successBg : colors.errorBg,
                              color: u.isActive !== false ? colors.success : colors.error,
                            }}>
                              {u.isActive !== false ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        )}
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => handleEdit(u)} style={btnGhost}>Editar roles</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
