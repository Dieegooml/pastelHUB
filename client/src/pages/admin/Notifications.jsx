import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import AdminNav from './AdminNav';
import { colors, font, inputStyle, textareaStyle, tableHeaderStyle, btnSmallPrimary, btnDanger, badge as badgeStyle } from '../../styles/theme';
import { notificationsService } from '../../services/notificationsService';

const stagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35, ease: 'easeOut' } }),
};

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ userId: '', title: '', message: '', type: 'info' });

  const load = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.getAll();
      setNotifs(data?.data || []);
    } catch { setError('Error al cargar notificaciones'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.message) { setError('Título y mensaje son obligatorios'); return; }
    try {
      if (form.userId) {
        await notificationsService.create({ userId: form.userId, title: form.title, message: form.message, type: form.type });
      } else {
        const allNotifs = await notificationsService.getAll().catch(() => []);
        const userIds = [...new Set((allNotifs?.data || []).map((n) => n.user_id).filter(Boolean))];
        if (userIds.length === 0) { setError('No hay usuarios para notificar'); return; }
        await notificationsService.createBulk({ user_ids: userIds, title: form.title, message: form.message, type: form.type });
      }
      setForm({ userId: '', title: '', message: '', type: 'info' });
      setSuccess('Notificación creada');
      load();
    } catch { setError('Error al crear notificación'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta notificación?')) return;
    try { await notificationsService.delete(id); setSuccess('Notificación eliminada'); load(); }
    catch { setError('Error al eliminar'); }
  };

  const handleMarkRead = async (id) => {
    try { await notificationsService.markAsRead(id); load(); }
    catch { setError('Error al marcar'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 2rem 2rem' }}>
        <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0, marginBottom: '24px' }}>Notificaciones</h2>
        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.2rem' }} />
        <div style={{ marginBottom: '16px' }}><AdminNav /></div>

        {success && <div style={{ background: colors.successBg, color: colors.success, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.success}` }}>{success}</div>}
        {error && <div style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</div>}

        <div style={{ background: colors.white, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: font.heading, fontSize: '16px', fontWeight: 600, color: colors.primary, margin: 0, marginBottom: '14px' }}>Crear notificación</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>User ID (opcional — vacío = broadcast)</label>
                <input style={{ ...inputStyle, height: '40px', fontSize: '13px' }} value={form.userId} onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))} placeholder="Dejar vacío para todos" />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>Tipo</label>
                <select style={{ ...inputStyle, height: '40px', fontSize: '13px' }} value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                  <option value="info">Info</option>
                  <option value="warning">Advertencia</option>
                  <option value="order">Orden</option>
                  <option value="promo">Promoción</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>Título</label>
              <input style={{ ...inputStyle, height: '40px', fontSize: '13px' }} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Título de la notificación" />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body, display: 'block', marginBottom: '4px' }}>Mensaje</label>
              <textarea style={{ ...inputStyle, height: 'auto', minHeight: '60px', padding: '10px 14px', fontSize: '13px', resize: 'vertical' }} value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} placeholder="Contenido de la notificación" />
            </div>
            <button onClick={handleCreate} style={btnSmallPrimary}>Crear notificación</button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map((i) => <div key={i} style={{ height: '48px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '8px', animation: 'shimmer 1.5s infinite' }} />)}
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" custom={1} style={{ background: colors.white, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #efefef' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#999', fontFamily: font.body, fontSize: '15px' }}>No hay notificaciones</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                      <th style={tableHeaderStyle}>ID</th>
                      <th style={tableHeaderStyle}>Usuario</th>
                      <th style={tableHeaderStyle}>Título</th>
                      <th style={tableHeaderStyle}>Tipo</th>
                      <th style={tableHeaderStyle}>Leída</th>
                      <th style={tableHeaderStyle}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifs.map((n, i) => (
                      <motion.tr
                        key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        style={{ borderTop: `1px solid ${colors.tableBorder}`, background: i % 2 === 0 ? colors.white : colors.tableStripe, transition: 'background 0.15s ease', opacity: n.read ? 0.6 : 1 }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f0ede8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? colors.white : colors.tableStripe; }}
                      >
                        <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: colors.textSecondary }}>{n.id?.slice(0, 8)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body, color: colors.textSecondary }}>{n.user_id?.slice(0, 8) || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={n.title || ''}>{n.title || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 500, fontFamily: font.body, background: n.type === 'warning' ? '#fff8e1' : n.type === 'order' ? '#e3f2fd' : '#f0f0f0', color: n.type === 'warning' ? '#f57f17' : n.type === 'order' ? '#1565c0' : '#666' }}>
                            {n.type || 'info'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body }}>{n.read ? '✅' : '⏳'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {!n.read && <button onClick={() => handleMarkRead(n.id)} style={{ padding: '4px 10px', borderRadius: '99px', border: `1px solid ${colors.border}`, background: colors.white, cursor: 'pointer', fontSize: '11px', fontWeight: 500, fontFamily: font.body, color: colors.textSecondary }}>Leído</button>}
                            <button onClick={() => handleDelete(n.id)} style={btnDanger}>Eliminar</button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
