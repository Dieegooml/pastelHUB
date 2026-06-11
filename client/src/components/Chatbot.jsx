import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import websocketService from '../services/websocketService';
import { colors, font } from '../styles/theme';
import { renderMarkdown } from '../utils/markdown';

export default function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const wsCleanups = useRef([]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  useEffect(() => {
    if (isOpen && user) loadSessions();
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, activeSessionId]);

  useEffect(() => {
    wsCleanups.current.forEach(fn => fn());
    wsCleanups.current = [];

    if (!user) return;

    const unsub1 = websocketService.onMessage((data) => {
      if (!activeSessionId) return;
      if (data.userMessage) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === data.userMessage.id);
          if (exists) return prev;
          return [...prev.filter(m => !m.id.startsWith('temp-')), data.userMessage];
        });
      }
      if (data.aiMessage) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === data.aiMessage.id);
          if (exists) return prev;
          return [...prev, data.aiMessage];
        });
        setAiTyping(false);
        setLoading(false);
      }
    });

    const unsub2 = websocketService.onTyping((data) => {
      if (data.sessionId === activeSessionId) {
        setAiTyping(data.isTyping);
      }
    });

    wsCleanups.current = [unsub1, unsub2];

    return () => {
      wsCleanups.current.forEach(fn => fn());
    };
  }, [user, activeSessionId]);

  async function loadSessions() {
    try {
      const res = await chatService.getSessions('active');
      const list = Array.isArray(res) ? res : res?.data || [];
      setSessions(list);
      if (list.length > 0 && !activeSessionId) {
        setActiveSessionId(list[0].id);
        loadMessages(list[0].id);
      } else if (list.length === 0) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (e) {
      console.error('Error loading sessions:', e);
    }
  }

  async function loadMessages(sessionId) {
    try {
      const res = await chatService.getSession(sessionId);
      setMessages(res.messages || []);
    } catch (e) {
      console.error('Error loading messages:', e);
      setMessages([]);
    }
  }

  async function handleNewSession() {
    setCreating(true);
    setError('');
    try {
      const res = await chatService.createSession();
      const newSession = { id: res.id, ...res };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(res.id);
      setMessages([{
        id: res.welcomeMessage?.id || 'welcome',
        senderRole: 'ai',
        message: res.welcomeMessage?.message || '¡Hola! ¿En qué puedo ayudarte?',
      }]);
      setShowHistory(false);
    } catch (e) {
      setError('Error al crear sesión');
    } finally {
      setCreating(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || !activeSessionId) return;

    setInput('');
    setLoading(true);
    setError('');

    const tempId = `temp-${Date.now()}`;
    const tempUserMsg = { id: tempId, senderRole: 'user', message: text };
    setMessages(prev => [...prev, tempUserMsg]);

    const sent = websocketService.sendMessage(activeSessionId, text);
    if (sent) {
      setAiTyping(true);
    } else {
      try {
        const res = await chatService.sendMessage(activeSessionId, text);
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempId),
          { id: res.userMessage?.id || tempId, senderRole: 'user', message: text },
          { id: res.aiMessage?.id || `ai-${Date.now()}`, senderRole: 'ai', message: res.aiMessage?.message || '' },
        ]);
      } catch (e) {
        setError(e.message || 'Error al enviar mensaje');
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, failed: true } : m
        ));
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleSelectSession(sessionId) {
    setActiveSessionId(sessionId);
    setMessages([]);
    setShowHistory(false);
    setAiTyping(false);
    setError('');
    await loadMessages(sessionId);
  }

  async function handleDeleteSession(sessionId) {
    try {
      await chatService.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
          loadMessages(remaining[0].id);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
    } catch (e) {
      setError('Error al eliminar sesión');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!user) return null;

  const bubbleStyle = {
    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
    width: '56px', height: '56px', borderRadius: '50%',
    background: colors.accent, color: '#fff', border: 'none',
    fontSize: '24px', cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(29,158,117,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
  };

  const panelStyle = {
    position: 'fixed', bottom: '92px', right: '24px', zIndex: 9999,
    width: '360px', height: '520px',
    background: colors.white, borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    border: `1px solid ${colors.border}`,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', fontFamily: font.body,
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={bubbleStyle}
        onMouseEnter={e => e.target.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        aria-label="Chatbot"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div style={panelStyle}>
          <div style={{
            padding: '16px', borderBottom: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: colors.accent, color: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>Asistente PastelHub</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setShowHistory(!showHistory)} style={{
                padding: '4px 8px', borderRadius: '6px', border: 'none',
                background: 'rgba(255,255,255,0.2)', color: '#fff',
                fontSize: '12px', cursor: 'pointer',
              }}>
                {showHistory ? 'Chat' : 'Historial'}
              </button>
              <button onClick={handleNewSession} disabled={creating} style={{
                padding: '4px 8px', borderRadius: '6px', border: 'none',
                background: 'rgba(255,255,255,0.2)', color: '#fff',
                fontSize: '16px', cursor: 'pointer', lineHeight: '1',
              }}>
                +
              </button>
            </div>
          </div>

          {showHistory ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', color: colors.textMuted, fontSize: '13px', padding: '24px 0' }}>
                  No hay sesiones anteriores
                </div>
              ) : (
                sessions.map(s => (
                  <div key={s.id} onClick={() => handleSelectSession(s.id)} style={{
                    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                    background: s.id === activeSessionId ? colors.grayLight : 'transparent',
                    border: `1px solid ${s.id === activeSessionId ? colors.accent : 'transparent'}`,
                    marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ fontSize: '13px', color: colors.text, flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{s.context || 'Chat ' + s.createdAt?.slice(0, 10)}</div>
                      <div style={{ fontSize: '11px', color: colors.textMuted }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleDeleteSession(s.id); }} style={{
                      padding: '2px 6px', borderRadius: '4px', border: 'none',
                      background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: '14px',
                    }}>🗑️</button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {!activeSessionId ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🤖</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>
                      ¿Necesitas ayuda?
                    </div>
                    <div style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '16px' }}>
                      Inicia una conversación con nuestro asistente virtual
                    </div>
                    <button onClick={handleNewSession} disabled={creating} style={{
                      padding: '10px 24px', borderRadius: '99px', border: 'none',
                      background: colors.accent, color: '#fff', cursor: 'pointer',
                      fontSize: '14px', fontWeight: 600, fontFamily: font.body,
                    }}>
                      {creating ? 'Creando...' : 'Nueva conversación'}
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted, fontSize: '13px' }}>
                    Cargando mensajes...
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} style={{
                      display: 'flex', justifyContent: msg.senderRole === 'user' ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        maxWidth: '80%', padding: '10px 14px', borderRadius: '14px',
                        background: msg.senderRole === 'user' ? colors.accent : colors.grayBg,
                        color: msg.senderRole === 'user' ? '#fff' : colors.text,
                        fontSize: '13px', lineHeight: '1.5',
                        borderBottomRightRadius: msg.senderRole === 'user' ? '4px' : '14px',
                        borderBottomLeftRadius: msg.senderRole === 'user' ? '14px' : '4px',
                        opacity: msg.failed ? 0.6 : 1,
                      }}>
                        {msg.senderRole === 'ai' ? (
                          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.message) }} />
                        ) : (
                          <span>{msg.message}</span>
                        )}
                        {msg.failed && (
                          <div style={{ fontSize: '11px', color: colors.error, marginTop: '4px' }}>
                            Error al enviar. Intenta de nuevo.
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {aiTyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '10px 14px', borderRadius: '14px',
                      background: colors.grayBg, color: colors.text, fontSize: '13px',
                      borderBottomLeftRadius: '4px',
                    }}>
                      <span style={{ opacity: 0.6 }}>Escribiendo</span>
                      <span style={{ animation: 'dots 1.5s infinite', marginLeft: '4px' }}>
                        <span style={{ animationDelay: '0s' }}>.</span>
                        <span style={{ animationDelay: '0.3s' }}>.</span>
                        <span style={{ animationDelay: '0.6s' }}>.</span>
                      </span>
                    </div>
                  </div>
                )}

                {loading && !aiTyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '10px 14px', borderRadius: '14px',
                      background: colors.grayBg, color: colors.text, fontSize: '13px',
                      borderBottomLeftRadius: '4px',
                    }}>
                      <span style={{ opacity: 0.6 }}>Enviando...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{
                    padding: '8px 12px', borderRadius: '8px', background: colors.errorBg,
                    color: colors.error, fontSize: '12px', textAlign: 'center',
                  }}>
                    {error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {activeSessionId && (
                <div style={{
                  padding: '12px', borderTop: `1px solid ${colors.border}`,
                  display: 'flex', gap: '8px',
                }}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    disabled={loading || aiTyping}
                    style={{
                      flex: 1, height: '40px', padding: '0 12px', borderRadius: '99px',
                      border: `1.5px solid ${colors.border}`, outline: 'none',
                      fontSize: '13px', fontFamily: font.body, color: colors.text,
                      background: colors.white,
                    }}
                  />
                  <button onClick={handleSend} disabled={loading || aiTyping || !input.trim()} style={{
                    width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                    background: loading || aiTyping || !input.trim() ? colors.grayBg : colors.accent,
                    color: loading || aiTyping || !input.trim() ? colors.textMuted : '#fff',
                    fontSize: '16px', cursor: loading || aiTyping || !input.trim() ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}>
                    ➤
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
