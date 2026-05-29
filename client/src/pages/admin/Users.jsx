import { useEffect, useState, Fragment } from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '../../styles/useIsMobile';
import { usersService } from '../../services/usersService';
import Navbar from '../../components/Navbar';
import AdminNav from './AdminNav';
import { colors, font, inputStyle, btnPrimary, btnDanger, btnGhost, btnSmallPrimary, btnSmallSecondary, cardStyle, tableHeaderStyle, labelStyle } from '../../styles/theme';

const ROLES = ['admin', 'moderator', 'owner', 'customer'];

const emptyForm = {
  name: '', email: '', password: '', phone: '', roles: ['customer'],
};

const emptyAddress = { street: '', city: '', is_default: false };

const smallInput = { ...inputStyle, height: '36px' };

const ROLE_BADGES = {
  admin:     { bg: '#fee2e2', color: '#ef4444' },
  moderator: { bg: '#e3f2fd', color: '#2196f3' },
  owner:     { bg: '#fff8e1', color: '#f59e0b' },
  customer:  { bg: '#e1f5ee', color: '#1D9E75' },
};

const stagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' } }),
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isMobile = useIsMobile(768);

  const [expandedUser, setExpandedUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddrId, setEditingAddrId] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getAll();
      setUsers(data?.data || []);
    } catch {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRoleToggle = (role) => {
    const current = form.roles;
    const updated = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    setForm({ ...form, roles: updated.length ? updated : ['customer'] });
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await usersService.update(editingId, {
          full_name: form.name,
          phone: form.phone,
          roles: form.roles,
        });
        setEditingId(null);
      } else {
        await usersService.create(form);
      }
      setForm(emptyForm);
      setSuccess(editingId ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
      loadUsers();
    } catch {
      setError('Error al guardar el usuario');
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.full_name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      roles: user.roles || ['customer'],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario? También se eliminará de Firebase Auth.')) return;
    setError('');
    setSuccess('');
    try {
      await usersService.delete(id);
      setSuccess('Usuario eliminado correctamente');
      loadUsers();
    } catch {
      setError('Error al eliminar el usuario');
    }
  };

  const handleCancel = () => { setEditingId(null); setForm(emptyForm); };

  const handleToggleStatus = async (id, current) => {
    try {
      await usersService.updateStatus(id, !current);
      setSuccess(`Usuario ${current ? 'desactivado' : 'activado'}`);
      loadUsers();
    } catch {
      setError('Error al cambiar estado');
    }
  };

  const handleExpandUser = async (user) => {
    if (expandedUser === user.id) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(user.id);
    try {
      const data = await usersService.getAddresses(user.id);
      setAddresses(Array.isArray(data) ? data : []);
    } catch {
      setAddresses([]);
    }
  };

  const handleAddrChange = (e) => setAddressForm({ ...addressForm, [e.target.name]: e.target.value });

  const handleAddrSubmit = async () => {
    if (!addressForm.street || !addressForm.city) return;
    try {
      if (editingAddrId) {
        await usersService.updateAddress(expandedUser, editingAddrId, addressForm);
      } else {
        await usersService.addAddress(expandedUser, addressForm);
      }
      setAddressForm(emptyAddress);
      setEditingAddrId(null);
      const data = await usersService.getAddresses(expandedUser);
      setAddresses(Array.isArray(data) ? data : []);
    } catch {
      setError('Error al guardar dirección');
    }
  };

  const handleEditAddr = (addr) => {
    setEditingAddrId(addr.address_id);
    setAddressForm({ street: addr.street, city: addr.city, is_default: addr.is_default });
  };

  const handleDeleteAddr = async (addrId) => {
    if (!confirm('¿Eliminar esta dirección?')) return;
    try {
      await usersService.deleteAddress(expandedUser, addrId);
      const data = await usersService.getAddresses(expandedUser);
      setAddresses(Array.isArray(data) ? data : []);
    } catch {
      setError('Error al eliminar dirección');
    }
  };

  const headers = isMobile ? ['Nombre', 'Roles', ''] : ['Nombre', 'Email', 'UID', 'Roles', 'Estado', 'Acciones'];

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
            {editingId ? 'Editar usuario' : 'Nuevo usuario'}
          </h3>
          <div style={sectionDivider} />

          <div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: isMobile ? '1' : '1 / 2' }}>
                <label style={labelStyle}>Nombre completo *</label>
                <input style={inputStyle} name="name" value={form.name} onChange={handleChange} required={!editingId} placeholder="Juan Pérez" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: isMobile ? '1' : '2 / 3' }}>
                <label style={labelStyle}>Correo electrónico *</label>
                <input style={inputStyle} type="email" name="email" value={form.email} onChange={handleChange} required={!editingId} disabled={!!editingId} placeholder="correo@ejemplo.com" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: isMobile ? '1' : '1 / 2' }}>
                <label style={labelStyle}>{editingId ? 'Contraseña (dejar vacío)' : 'Contraseña *'}</label>
                <input style={inputStyle} type="password" name="password" value={form.password} onChange={handleChange} required={!editingId} placeholder={editingId ? '••••••••' : 'Mínimo 8 caracteres'} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: isMobile ? '1' : '2 / 3' }}>
                <label style={labelStyle}>Teléfono</label>
                <input style={inputStyle} name="phone" value={form.phone} onChange={handleChange} placeholder="+51 999 999 999" />
              </div>
            </div>

            <div style={sectionDivider} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={labelStyle}>Roles</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {ROLES.map((role) => {
                  const rb = ROLE_BADGES[role];
                  const selected = form.roles.includes(role);
                  return (
                    <label key={role} style={{
                      display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px',
                      cursor: 'pointer', padding: '7px 16px', borderRadius: '99px',
                      background: selected ? rb.bg : colors.bgBeige,
                      border: `1.5px solid ${selected ? rb.color : colors.border}`,
                      transition: 'all 0.2s ease',
                    }}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => handleRoleToggle(role)}
                        style={{ accentColor: colors.accent, margin: 0 }}
                      />
                      {role}
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.2rem' }}>
              <button onClick={handleSubmit} style={btnPrimary}
                onMouseEnter={(e) => e.target.style.background = colors.accent}
                onMouseLeave={(e) => e.target.style.background = colors.primary}
              >
                {editingId ? 'Guardar cambios' : 'Crear usuario'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} style={btnGhost}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
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
                      <td colSpan={isMobile ? 3 : 6} style={{ padding: '3rem', textAlign: 'center', color: colors.textMuted, fontFamily: font.body }}>
                        No hay usuarios registrados
                      </td>
                    </tr>
                  ) : (
                    users.map((u, i) => (
                      <Fragment key={u.id}>
                        <motion.tr
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
                            <div style={{ fontWeight: 500, cursor: 'pointer', fontFamily: font.body }}
                              onClick={() => handleExpandUser(u)}>
                              {u.full_name || '—'}
                              <span style={{ fontSize: '11px', color: colors.textMuted, marginLeft: '6px' }}>
                                {expandedUser === u.id ? '▲' : '▼'}
                              </span>
                            </div>
                          </td>
                          {!isMobile && <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body }}>{u.email || '—'}</td>}
                          {!isMobile && (
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#888', userSelect: 'all', cursor: 'pointer' }}
                                onClick={() => { navigator.clipboard.writeText(u.id); setSuccess('UID copiado'); }}
                                title="Click para copiar"
                              >
                                {u.id ? `${u.id.slice(0, 12)}...` : '—'}
                              </span>
                            </td>
                          )}
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
                              <span
                                onClick={() => handleToggleStatus(u.id, u.isActive !== false)}
                                style={{
                                  cursor: 'pointer', padding: '4px 12px', borderRadius: '99px',
                                  fontSize: '12px', fontWeight: 500, fontFamily: font.body,
                                  background: u.isActive !== false ? colors.successBg : colors.errorBg,
                                  color: u.isActive !== false ? colors.success : colors.error,
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                {u.isActive !== false ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                          )}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleEdit(u)} style={btnGhost}>Editar</button>
                              <button onClick={() => handleDelete(u.id)} style={btnDanger}>Eliminar</button>
                            </div>
                          </td>
                        </motion.tr>
                        {expandedUser === u.id && (
                          <tr key={`${u.id}-addr`}>
                            <td colSpan={isMobile ? 3 : 6} style={{ padding: '0 16px 16px', background: colors.grayLight }}>
                              <div style={{ borderTop: `1px solid ${colors.tableBorder}`, paddingTop: '16px' }}>
                                <h4 style={{ fontFamily: font.heading, fontSize: '15px', color: colors.primary, margin: '0 0 12px' }}>
                                  Direcciones
                                </h4>

                                <div style={{ display: 'flex', gap: '8px', alignItems: 'end', flexWrap: 'wrap', marginBottom: '12px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: isMobile ? '100%' : 'auto' }}>
                                    <label style={{ ...labelStyle, fontSize: '11px' }}>Calle *</label>
                                    <input style={{ ...smallInput, width: isMobile ? '100%' : '180px' }} name="street" value={addressForm.street} onChange={handleAddrChange} placeholder="Av. Principal 123" />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: isMobile ? '100%' : 'auto' }}>
                                    <label style={{ ...labelStyle, fontSize: '11px' }}>Ciudad *</label>
                                    <input style={{ ...smallInput, width: isMobile ? '100%' : '120px' }} name="city" value={addressForm.city} onChange={handleAddrChange} placeholder="Lima" />
                                  </div>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer', fontFamily: font.body }}>
                                    <input type="checkbox" checked={addressForm.is_default} onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })} style={{ accentColor: colors.accent }} />
                                    Default
                                  </label>
                                  <button onClick={handleAddrSubmit} style={btnSmallPrimary}
                                    onMouseEnter={(e) => e.target.style.background = colors.accent}
                                    onMouseLeave={(e) => e.target.style.background = colors.primary}
                                  >
                                    {editingAddrId ? 'Actualizar' : 'Agregar'}
                                  </button>
                                  {editingAddrId && (
                                    <button onClick={() => { setEditingAddrId(null); setAddressForm(emptyAddress); }} style={btnSmallSecondary}>
                                      Cancelar
                                    </button>
                                  )}
                                </div>

                                {addresses.length === 0 ? (
                                  <p style={{ color: colors.textMuted, fontSize: '13px', fontFamily: font.body }}>Sin direcciones registradas</p>
                                ) : (
                                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                                        <th style={{ ...tableHeaderStyle, padding: '8px 12px' }}>Calle</th>
                                        <th style={{ ...tableHeaderStyle, padding: '8px 12px' }}>Ciudad</th>
                                        <th style={{ ...tableHeaderStyle, padding: '8px 12px' }}>Default</th>
                                        <th style={{ ...tableHeaderStyle, padding: '8px 12px' }}>Acciones</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {addresses.map((a) => (
                                        <tr key={a.address_id} style={{ borderTop: `1px solid ${colors.tableBorder}` }}>
                                          <td style={{ padding: '8px 12px', fontSize: '13px', fontFamily: font.body }}>{a.street}</td>
                                          <td style={{ padding: '8px 12px', fontSize: '13px', fontFamily: font.body }}>{a.city}</td>
                                          <td style={{ padding: '8px 12px', fontSize: '13px', fontFamily: font.body }}>{a.is_default ? '✅' : '—'}</td>
                                          <td style={{ padding: '8px 12px' }}>
                                          <div style={{ display: 'flex', gap: '6px' }}>
                                              <button onClick={() => handleEditAddr(a)} style={btnGhost}>Editar</button>
                                              <button onClick={() => handleDeleteAddr(a.address_id)} style={btnDanger}>Eliminar</button>
                                          </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
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
