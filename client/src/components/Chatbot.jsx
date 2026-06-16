import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import websocketService from '../services/websocketService';
import Tooltip from './Tooltip';
import { colors, font } from '../styles/theme';
import { renderMarkdown } from '../utils/markdown';

const styles = {
  bubble: {
    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
    width: '56px', height: '56px', borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.accent}, #15805d)`,
    color: '#fff', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(29,158,117,0.4)',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    animation: 'chatbotPulse 2.5s ease-in-out infinite',
  },
  panel: {
    position: 'fixed', bottom: '92px', right: '24px', zIndex: 9999,
    width: '380px', height: '540px',
    background: colors.white, borderRadius: '16px',
    boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
    border: `1px solid ${colors.border}`,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', fontFamily: font.body,
    animation: 'chatPanelIn 0.3s ease both',
    transformOrigin: 'bottom right',
  },
  header: {
    padding: '14px 16px',
    background: `linear-gradient(135deg, ${colors.accent}, #15805d)`,
    color: '#fff', flexShrink: 0,
  },
  headerTop: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headerInfo: {
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  aiAvatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px', fontWeight: 700, fontFamily: font.heading,
    color: '#fff', flexShrink: 0,
  },
  statusDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: '#4ade80', display: 'inline-block',
    boxShadow: '0 0 6px rgba(74,222,128,0.6)',
    marginLeft: '6px',
  },
  headerActions: {
    display: 'flex', gap: '4px',
  },
  headerBtn: {
    padding: '5px 10px', borderRadius: '8px', border: 'none',
    background: 'rgba(255,255,255,0.15)',
    color: '#fff', fontSize: '12px', cursor: 'pointer',
    fontWeight: 500, fontFamily: font.body,
    transition: 'background 0.2s ease',
    display: 'flex', alignItems: 'center', gap: '4px',
  },
  messagesArea: {
    flex: 1, overflowY: 'auto', padding: '12px 12px 4px',
    display: 'flex', flexDirection: 'column', gap: '8px',
    scrollbarWidth: 'thin',
    scrollbarColor: `${colors.border} transparent`,
  },
  msgRow: (isUser) => ({
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    alignItems: 'flex-end',
    gap: '6px',
    animation: 'fadeInUp 0.25s ease both',
  }),
  msgAvatar: {
    width: '26px', height: '26px', borderRadius: '50%',
    background: colors.grayBg, color: colors.textSecondary,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: 600, fontFamily: font.body,
    flexShrink: 0,
  },
  msgBubble: (isUser, failed) => ({
    maxWidth: '78%',
    padding: '10px 14px',
    borderRadius: '14px',
    background: isUser ? colors.accent : colors.white,
    color: isUser ? '#fff' : colors.text,
    fontSize: '13px', lineHeight: '1.55',
    borderBottomRightRadius: isUser ? '4px' : '14px',
    borderBottomLeftRadius: isUser ? '14px' : '4px',
    opacity: failed ? 0.6 : 1,
    boxShadow: isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
    border: isUser ? 'none' : `1px solid ${colors.border}`,
  }),
  msgTime: {
    fontSize: '10px', color: colors.textMuted,
    marginTop: '4px', textAlign: 'right',
  },
  inputArea: {
    padding: '12px 12px', borderTop: `1px solid ${colors.border}`,
    display: 'flex', gap: '8px', background: colors.white,
    flexShrink: 0,
  },
  input: {
    flex: 1, height: '42px', padding: '0 14px', borderRadius: '99px',
    border: `1.5px solid ${colors.border}`, outline: 'none',
    fontSize: '13px', fontFamily: font.body, color: colors.text,
    background: colors.grayLight,
    transition: 'border-color 0.2s ease, background 0.2s ease',
  },
  sendBtn: (disabled) => ({
    width: '42px', height: '42px', borderRadius: '50%', border: 'none',
    background: disabled ? colors.grayBg : colors.accent,
    color: disabled ? colors.textMuted : '#fff',
    fontSize: '16px', cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease', flexShrink: 0,
  }),
  emptyState: {
    textAlign: 'center', padding: '48px 20px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '12px',
  },
  emptyIcon: {
    width: '64px', height: '64px', borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.accent}15, ${colors.accent}08)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '28px', marginBottom: '4px',
  },
  historyItem: (active) => ({
    padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
    background: active ? `${colors.accent}08` : 'transparent',
    border: `1px solid ${active ? colors.accent : 'transparent'}`,
    marginBottom: '6px', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', transition: 'all 0.15s ease',
  }),
  errorBar: {
    padding: '8px 12px', borderRadius: '8px',
    background: colors.errorBg, color: colors.error,
    fontSize: '12px', textAlign: 'center',
  },
};

function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function userInitial(email) {
  if (!email) return '?';
  return email[0].toUpperCase();
}

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
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const wsCleanups = useRef([]);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) loadSessions();
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen, activeSessionId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && isOpen) {
        const bubble = document.getElementById('chatbot-bubble');
        if (bubble && !bubble.contains(e.target)) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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

  return (
    <>
      <button
        id="chatbot-bubble"
        onClick={() => setIsOpen(!isOpen)}
        style={styles.bubble}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(29,158,117,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,158,117,0.4)'; }}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isOpen ? (
            <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
          ) : (
            <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>
          )}
        </svg>
      </button>

      {isOpen && (
        <div ref={panelRef} style={styles.panel}>
          <div style={styles.header}>
            <div style={styles.headerTop}>
              <div style={styles.headerInfo}>
                <div style={styles.aiAvatar}>P</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.3 }}>
                    Asistente PastelHub
                    <span style={styles.statusDot} />
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '1px' }}>En línea</div>
                </div>
              </div>
              <div style={styles.headerActions}>
                <Tooltip text={showHistory ? 'Volver al chat' : 'Historial'}>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    style={styles.headerBtn}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {showHistory ? 'Chat' : 'Historial'}
                  </button>
                </Tooltip>
                <Tooltip text="Nueva conversación">
                  <button
                    onClick={handleNewSession}
                    disabled={creating}
                    style={styles.headerBtn}
                    onMouseEnter={e => { if (!creating) e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Nuevo
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>

          {showHistory ? (
            <div style={{ ...styles.messagesArea, padding: '12px' }}>
              {sessions.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '36px', opacity: 0.5 }}>📋</div>
                  <div style={{ fontSize: '13px', color: colors.textMuted }}>No hay sesiones anteriores</div>
                </div>
              ) : (
                sessions.map(s => (
                  <div key={s.id} style={styles.historyItem(s.id === activeSessionId)}
                    onMouseEnter={e => { if (s.id !== activeSessionId) e.currentTarget.style.background = colors.grayLight; }}
                    onMouseLeave={e => { if (s.id !== activeSessionId) e.currentTarget.style.background = 'transparent'; }}
                    onClick={() => handleSelectSession(s.id)}
                  >
                    <div style={{ fontSize: '13px', color: colors.text, flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.context || 'Chat ' + (s.createdAt?.slice(0, 10) || '')}
                      </div>
                      <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '2px' }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString('es-PE') : ''}
                      </div>
                    </div>
                    <Tooltip text="Eliminar">
                      <button onClick={e => { e.stopPropagation(); handleDeleteSession(s.id); }} style={{
                        padding: '4px 6px', borderRadius: '6px', border: 'none',
                        background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: '14px',
                        transition: 'all 0.15s ease', lineHeight: '1',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = colors.errorBg; e.currentTarget.style.color = colors.error; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.textMuted; }}
                      >
                        🗑️
                      </button>
                    </Tooltip>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              <div style={styles.messagesArea}>
                {!activeSessionId ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>🤖</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: colors.text }}>
                      ¿Necesitas ayuda?
                    </div>
                    <div style={{ fontSize: '13px', color: colors.textMuted, maxWidth: '260px', lineHeight: 1.5 }}>
                      Inicia una conversación con nuestro asistente virtual especializado en pastelería
                    </div>
                    <button onClick={handleNewSession} disabled={creating} style={{
                      marginTop: '8px', padding: '10px 28px', borderRadius: '99px', border: 'none',
                      background: `linear-gradient(135deg, ${colors.accent}, #15805d)`,
                      color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                      fontFamily: font.body, transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(29,158,117,0.3)',
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      {creating ? 'Creando...' : 'Nueva conversación'}
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={{ fontSize: '32px', opacity: 0.5 }}>⏳</div>
                    <div style={{ fontSize: '13px', color: colors.textMuted }}>Cargando mensajes...</div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} style={styles.msgRow(msg.senderRole === 'user')}>
                      {msg.senderRole === 'ai' && (
                        <div style={styles.msgAvatar}>P</div>
                      )}
                      <div>
                        <div style={styles.msgBubble(msg.senderRole === 'user', msg.failed)}>
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
                        {msg.createdAt && (
                          <div style={styles.msgTime}>{formatTime(msg.createdAt)}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {aiTyping && (
                  <div style={styles.msgRow(false)}>
                    <div style={styles.msgAvatar}>P</div>
                    <div style={{
                      ...styles.msgBubble(false, false),
                      padding: '14px 18px',
                    }}>
                      <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.accent, animation: 'chatbotDot 1.2s ease-in-out infinite', animationDelay: '0s' }} />
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.accent, animation: 'chatbotDot 1.2s ease-in-out infinite', animationDelay: '0.2s' }} />
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.accent, animation: 'chatbotDot 1.2s ease-in-out infinite', animationDelay: '0.4s' }} />
                      </span>
                    </div>
                  </div>
                )}

                {loading && !aiTyping && (
                  <div style={styles.msgRow(false)}>
                    <div style={styles.msgAvatar}>P</div>
                    <div style={{
                      ...styles.msgBubble(false, false),
                      padding: '12px 18px', color: colors.textMuted, fontSize: '12px',
                    }}>
                      Enviando...
                    </div>
                  </div>
                )}

                {error && <div style={styles.errorBar}>{error}</div>}

                <div ref={messagesEndRef} />
              </div>

              {activeSessionId && (
                <div style={styles.inputArea}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Escribe un mensaje..."
                    disabled={loading || aiTyping}
                    style={{
                      ...styles.input,
                      borderColor: inputFocused ? colors.accent : colors.border,
                      background: inputFocused ? colors.white : colors.grayLight,
                    }}
                  />
                  <Tooltip text="Enviar mensaje">
                    <button
                      onClick={handleSend}
                      disabled={loading || aiTyping || !input.trim()}
                      style={styles.sendBtn(loading || aiTyping || !input.trim())}
                      onMouseEnter={e => {
                        if (!loading && !aiTyping && input.trim()) {
                          e.currentTarget.style.background = '#15805d';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = loading || aiTyping || !input.trim() ? colors.grayBg : colors.accent;
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </button>
                  </Tooltip>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
