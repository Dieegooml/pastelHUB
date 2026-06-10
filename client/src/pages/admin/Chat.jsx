import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import AdminNav from './AdminNav';
import { chatService } from '../../services/chatService';
import { renderMarkdown } from '../../utils/markdown';
import { colors, font, pageStyle, cardStyle, btnSmallPrimary, btnDanger, badge } from '../../styles/theme';

export default function AdminChat() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { loadSessions(); }, [statusFilter]);

  async function loadSessions() {
    setLoading(true);
    try {
      const res = await chatService.getSessions(statusFilter === 'all' ? '' : statusFilter);
      setSessions(Array.isArray(res) ? res : res?.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  async function handleSelect(session) {
    setSelected(session);
    try {
      const res = await chatService.getSession(session.id);
      setMessages(res.messages || []);
    } catch (e) { setMessages([]); }
  }

  async function handleDelete(id) {
    try {
      await chatService.deleteSession(id);
      if (selected?.id === id) { setSelected(null); setMessages([]); }
      loadSessions();
    } catch (e) { alert('Error al eliminar'); }
  }

  return (
    <div style={pageStyle}>
      <Navbar />
      <AdminNav />
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: colors.text, fontFamily: font.heading, margin: '1.5rem 0 1rem' }}>
        💬 Chat Sessions
      </h1>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['all', 'active', 'closed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            ...badge(statusFilter === s ? colors.primary : '#f3f4f6', statusFilter === s ? '#fff' : colors.textSecondary),
            border: 'none', cursor: 'pointer',
          }}>{s === 'all' ? 'Todos' : s === 'active' ? 'Activos' : 'Cerrados'}</button>
        ))}
        <button onClick={loadSessions} style={{ ...btnSmallPrimary, marginLeft: 'auto' }}>🔄 Recargar</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '12px' }}>Sesiones ({sessions.length})</h2>
          {loading ? <div style={{ color: colors.textMuted, fontSize: '13px' }}>Cargando...</div> : sessions.length === 0 ? (
            <div style={{ color: colors.textMuted, fontSize: '13px' }}>No hay sesiones</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sessions.map(s => (
                <div key={s.id} onClick={() => handleSelect(s)} style={{
                  padding: '10px', borderRadius: '8px', cursor: 'pointer',
                  background: selected?.id === s.id ? colors.grayLight : 'transparent',
                  border: `1px solid ${selected?.id === s.id ? colors.accent : 'transparent'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ fontSize: '13px', flex: 1 }}>
                    <div style={{ fontWeight: 500, color: colors.text }}>{s.userId?.slice(0, 16) || 'Anónimo'}</div>
                    <div style={{ fontSize: '11px', color: colors.textMuted }}>{s.createdAt ? new Date(s.createdAt).toLocaleString() : ''}</div>
                    <div style={{ fontSize: '11px', color: colors.textMuted }}>Msgs: {s.messageCount || messages.length}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDelete(s.id); }} style={{ ...btnDanger, padding: '2px 8px', fontSize: '11px' }}>Eliminar</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={cardStyle}>
          {!selected ? (
            <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted, fontSize: '14px' }}>
              Selecciona una sesión para ver los mensajes
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted, fontSize: '14px' }}>
              Sin mensajes en esta sesión
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
              <div style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '8px' }}>
                Sesión: {selected.id?.slice(0, 12)}... · {messages.length} mensajes
              </div>
              {messages.map((msg, i) => (
                <div key={msg.id || i} style={{
                  display: 'flex', justifyContent: msg.senderRole === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px', borderRadius: '14px',
                    background: msg.senderRole === 'user' ? colors.accent : colors.grayBg,
                    color: msg.senderRole === 'user' ? '#fff' : colors.text,
                    fontSize: '13px', lineHeight: '1.5',
                    borderBottomRightRadius: msg.senderRole === 'user' ? '4px' : '14px',
                    borderBottomLeftRadius: msg.senderRole === 'user' ? '14px' : '4px',
                  }}>
                    {msg.senderRole === 'user' ? msg.message : (
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.message) }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


