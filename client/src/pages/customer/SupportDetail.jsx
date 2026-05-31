import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { supportService } from '../../services/supportService';
import { colors, font, textareaStyle, btnPrimary, btnSmallPrimary, badge as badgeStyle } from '../../styles/theme';
import { useIsMobile } from '../../styles/useIsMobile';

const STATUS_COLORS = {
  open:         { bg: '#fff8e1', color: '#f59e0b' },
  in_progress:  { bg: '#e3f2fd', color: '#2196f3' },
  resolved:     { bg: '#e1f5ee', color: '#1D9E75' },
  closed:       { bg: '#f5f5f5', color: '#999' },
};

const STATUS_TRANSLATIONS = {
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const SENDER_LABELS = {
  customer: 'Cliente',
  owner: 'Dueño',
  moderator: 'Moderador',
  admin: 'Admin',
};

const SENDER_COLORS = {
  customer:  { bg: '#e8f5e9', color: '#2e7d32' },
  owner:     { bg: '#fff8e1', color: '#e65100' },
  moderator: { bg: '#e3f2fd', color: '#1565c0' },
  admin:     { bg: '#fce4ec', color: '#c62828' },
};

export default function SupportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);
  const messagesEndRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const isModerator = user?.roles?.includes('moderator') || user?.roles?.includes('admin');

  useEffect(() => {
    const load = async () => {
      try {
        const [t, msgs] = await Promise.all([
          supportService.getTicket(id),
          supportService.getMessages(id),
        ]);
        setTicket(t);
        setMessages(msgs?.data || []);
      } catch (e) { console.error(e); setError('Error al cargar ticket'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await supportService.sendMessage(id, newMessage.trim());
      const msgs = await supportService.getMessages(id);
      setMessages(msgs?.data || []);
      setNewMessage('');
    } catch (e) { console.error(e); setError('Error al enviar mensaje'); }
    finally { setSending(false); }
  };

  const handleStatus = async (newStatus) => {
    try {
      await supportService.updateStatus(id, newStatus);
      setTicket((prev) => ({ ...prev, status: newStatus }));
    } catch (e) { console.error(e); setError('Error al cambiar estado del ticket'); }
  };

  const handleAssign = async () => {
    try {
      await supportService.assign(id);
      const t = await supportService.getTicket(id);
      setTicket(t);
    } catch (e) { console.error(e); setError('Error al asignar ticket'); }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          {[1, 2, 3].map((i) => <div key={i} style={{ height: '48px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '8px', marginBottom: '8px', animation: 'shimmer 1.5s infinite' }} />)}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '3rem', color: '#999', fontFamily: font.body }}>Ticket no encontrado</div>
      </div>
    );
  }

  const sc = STATUS_COLORS[ticket.status] || STATUS_COLORS.open;

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
        style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '1rem' : '40px 2rem 2rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button onClick={() => navigate('/support')} style={{ padding: '6px 12px', borderRadius: '99px', border: `1px solid ${colors.border}`, cursor: 'pointer', fontSize: '13px', fontFamily: font.body, background: colors.white }}>← Volver</button>
          <h2 style={{ fontFamily: font.heading, fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: colors.primary, margin: 0, flex: 1 }}>{ticket.subject}</h2>
          <span style={badgeStyle(sc.bg, sc.color)}>{STATUS_TRANSLATIONS[ticket.status] || ticket.status}</span>
        </div>

        <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textMuted, marginBottom: '24px' }}>
          {isModerator && ticket.userId ? `Creado por ${ticket.userId.slice(0, 8)}…` : ''}
          {ticket.createdAt ? ` — ${new Date(ticket.createdAt).toLocaleString('es-PE')}` : ''}
        </p>

        {isModerator && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {ticket.status === 'open' && !ticket.assignedTo && (
              <button onClick={handleAssign} style={{ padding: '6px 16px', borderRadius: '99px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: font.body, background: '#e3f2fd', color: '#1565c0', fontWeight: 600 }}>Asignarme</button>
            )}
            {ticket.status === 'open' && (
              <button onClick={() => handleStatus('in_progress')} style={{ padding: '6px 16px', borderRadius: '99px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: font.body, background: '#e3f2fd', color: '#1565c0', fontWeight: 600 }}>Marcar en progreso</button>
            )}
            {ticket.status === 'open' || ticket.status === 'in_progress' ? (
              <button onClick={() => handleStatus('resolved')} style={{ padding: '6px 16px', borderRadius: '99px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: font.body, background: '#e1f5ee', color: '#1D9E75', fontWeight: 600 }}>Resolver</button>
            ) : null}
            {(ticket.status === 'resolved' || ticket.status === 'closed') && (
              <button onClick={() => handleStatus('open')} style={{ padding: '6px 16px', borderRadius: '99px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: font.body, background: '#fff8e1', color: '#f59e0b', fontWeight: 600 }}>Reabrir ticket</button>
            )}
          </div>
        )}

        {error && (
          <div style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</div>
        )}

        <div style={{ background: colors.white, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', marginBottom: '16px' }}>
          <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', fontFamily: font.body, fontSize: '14px' }}>No hay mensajes aún</p>
            ) : (
              messages.map((m, i) => {
                const isMe = m.senderId === user?.uid;
                const sc2 = SENDER_COLORS[m.senderRole] || SENDER_COLORS.customer;
                const showDate = i === 0 || new Date(m.createdAt).toDateString() !== new Date(messages[i - 1]?.createdAt).toDateString();
                return (
                  <div key={m.id}>
                    {showDate && (
                      <div style={{ textAlign: 'center', fontSize: '11px', color: '#bbb', fontFamily: font.body, marginBottom: '8px' }}>
                        {new Date(m.createdAt).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '99px', background: sc2.bg, color: sc2.color, fontWeight: 600, fontFamily: font.body }}>
                          {SENDER_LABELS[m.senderRole] || m.senderRole}
                        </span>
                        <span style={{ fontSize: '11px', color: '#bbb', fontFamily: font.body }}>
                          {new Date(m.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{
                        maxWidth: '80%', padding: '10px 14px', borderRadius: '12px',
                        background: isMe ? colors.primary : colors.grayLight,
                        color: isMe ? '#fff' : colors.text,
                        fontSize: '14px', fontFamily: font.body, lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}>
                        {m.message}
                      </div>
                    </motion.div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
          <div style={{ background: colors.white, borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <textarea style={{ ...textareaStyle, minHeight: '60px', flex: 1, fontSize: '14px', resize: 'none' }}
                value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe tu mensaje..." onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <button onClick={handleSend} disabled={sending || !newMessage.trim()}
                style={{ ...btnSmallPrimary, height: '40px', whiteSpace: 'nowrap', opacity: sending || !newMessage.trim() ? 0.7 : 1 }}
              >{sending ? '...' : 'Enviar'}</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
