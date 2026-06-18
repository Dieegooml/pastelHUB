import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Flex, Text, Button, Input, VStack, HStack, IconButton,
  Spinner, useDisclosure,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import websocketService from '../services/websocketService';
import { renderMarkdown } from '../utils/markdown';
import { PastelAvatar } from './UI';

const accentColor = '#1D9E75';

function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function ChatMessage({ msg, isUser }) {
  return (
    <Flex
      justify={isUser ? 'flex-end' : 'flex-start'}
      align="flex-end"
      gap="6px"
      animation="fadeInUp 0.25s ease both"
    >
      {!isUser && (
        <PastelAvatar name="P" size="xs" bg="accent.500" color="white" fontSize="10px" />
      )}
      <Box maxW="78%">
        <Box
          px="14px"
          py="10px"
          borderRadius="14px"
          borderBottomRightRadius={isUser ? '4px' : '14px'}
          borderBottomLeftRadius={isUser ? '14px' : '4px'}
          bg={isUser ? accentColor : 'white'}
          color={isUser ? 'white' : 'brand.800'}
          fontSize="13px"
          lineHeight="1.55"
          opacity={msg.failed ? 0.6 : 1}
          boxShadow={isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.06)'}
          border={isUser ? 'none' : '1px solid'}
          borderColor="brand.100"
        >
          {isUser ? (
            <Text>{msg.message}</Text>
          ) : (
            <Box className="chatbot-markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.message) }} />
          )}
          {msg.failed && (
            <Text fontSize="11px" color="rose.500" mt="4px">
              Error al enviar. Intenta de nuevo.
            </Text>
          )}
        </Box>
        {msg.createdAt && (
          <Text fontSize="10px" color="warmGray.400" mt="4px" textAlign={isUser ? 'right' : 'left'}>
            {formatTime(msg.createdAt)}
          </Text>
        )}
      </Box>
    </Flex>
  );
}

function TypingIndicator() {
  return (
    <Flex justify="flex-start" align="flex-end" gap="6px">
      <PastelAvatar name="P" size="xs" bg="accent.500" color="white" fontSize="10px" />
      <Box px="18px" py="14px" borderRadius="14px" borderBottomLeftRadius="4px" bg="white" boxShadow="0 1px 3px rgba(0,0,0,0.06)" border="1px solid" borderColor="brand.100">
        <HStack spacing="4px">
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              w="6px"
              h="6px"
              borderRadius="50%"
              bg={accentColor}
              animation="chatbotDot 1.2s ease-in-out infinite"
              sx={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </HStack>
      </Box>
    </Flex>
  );
}

export default function Chatbot() {
  const { user } = useAuth();
  const { isOpen, onToggle, onClose } = useDisclosure();
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
  const panelRef = useRef(null);
  const bubbleRef = useRef(null);

  const loadSessions = useCallback(async () => {
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
  }, [activeSessionId]);

  const loadMessages = useCallback(async (sessionId) => {
    try {
      const res = await chatService.getSession(sessionId);
      setMessages(res.messages || []);
    } catch (e) {
      console.error('Error loading messages:', e);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen && user) loadSessions();
  }, [isOpen, user, loadSessions]);

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
      if (isOpen && panelRef.current && !panelRef.current.contains(e.target) && bubbleRef.current && !bubbleRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
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

    return () => { unsub1?.(); unsub2?.(); };
  }, [user, activeSessionId]);

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!user) return null;

  return (
    <>
      <IconButton
        ref={bubbleRef}
        position="fixed"
        bottom="24px"
        right="24px"
        zIndex={9999}
        w="56px"
        h="56px"
        borderRadius="full"
        bg={`linear-gradient(135deg, ${accentColor}, #15805d)`}
        color="white"
        _hover={{ transform: 'scale(1.1)', boxShadow: '0 6px 28px rgba(29,158,117,0.5)' }}
        _active={{ transform: 'scale(0.95)' }}
        boxShadow="0 4px 20px rgba(29,158,117,0.4)"
        animation="chatbotPulse 2.5s ease-in-out infinite"
        onClick={onToggle}
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            ) : (
              <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>
            )}
          </svg>
        }
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      />

      {isOpen && (
        <Box
          ref={panelRef}
          position="fixed"
          bottom="92px"
          right="24px"
          zIndex={9999}
          w="380px"
          h="540px"
          bg="white"
          borderRadius="16px"
          boxShadow="0 12px 48px rgba(0,0,0,0.18)"
          border="1px solid"
          borderColor="brand.100"
          display="flex"
          flexDirection="column"
          overflow="hidden"
          animation="chatPanelIn 0.3s ease both"
          transformOrigin="bottom right"
          role="dialog"
          aria-label="Chat asistente PastelHub"
        >
          {/* Header */}
          <Flex
            p="14px 16px"
            bg={`linear-gradient(135deg, ${accentColor}, #15805d)`}
            color="white"
            flexShrink={0}
            align="center"
            justify="space-between"
          >
            <Flex align="center" gap="10px">
              <Box
                w="36px" h="36px" borderRadius="full"
                bg="rgba(255,255,255,0.2)"
                display="flex" alignItems="center" justifyContent="center"
                fontSize="16px" fontWeight={700} fontFamily="heading"
              >
                P
              </Box>
              <Box>
                <Text fontSize="14px" fontWeight={600} lineHeight="1.3">
                  Asistente PastelHub
                  <Box as="span" display="inline-block" w="8px" h="8px" borderRadius="full" bg="#4ade80" ml="6px" boxShadow="0 0 6px rgba(74,222,128,0.6)" />
                </Text>
                <Text fontSize="11px" opacity={0.8} mt="1px">En línea</Text>
              </Box>
            </Flex>
            <HStack spacing="4px">
              <IconButton
                size="xs"
                variant="ghost"
                color="white"
                _hover={{ bg: 'rgba(255,255,255,0.25)' }}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                }
                onClick={() => setShowHistory(!showHistory)}
                aria-label={showHistory ? 'Volver al chat' : 'Historial'}
              />
              <IconButton
                size="xs"
                variant="ghost"
                color="white"
                _hover={{ bg: 'rgba(255,255,255,0.25)' }}
                isLoading={creating}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                }
                onClick={handleNewSession}
                aria-label="Nueva conversación"
              />
            </HStack>
          </Flex>

          {showHistory ? (
            <Box flex={1} overflowY="auto" p="12px" sx={{ scrollbarWidth: 'thin', scrollbarColor: 'brand.100 transparent' }}>
              {sessions.length === 0 ? (
                <VStack py={12} spacing={3}>
                  <Text fontSize="36px" opacity={0.5}>📋</Text>
                  <Text fontSize="13px" color="warmGray.400">No hay sesiones anteriores</Text>
                </VStack>
              ) : (
                sessions.map(s => (
                  <Flex
                    key={s.id}
                    p="10px 12px"
                    borderRadius="10px"
                    cursor="pointer"
                    bg={s.id === activeSessionId ? `${accentColor}08` : 'transparent'}
                    border={s.id === activeSessionId ? `1px solid ${accentColor}` : '1px solid transparent'}
                    mb="6px"
                    align="center"
                    justify="space-between"
                    _hover={s.id !== activeSessionId ? { bg: 'warmGray.50' } : undefined}
                    onClick={() => handleSelectSession(s.id)}
                    transition="all 0.15s ease"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSelectSession(s.id); }}
                  >
                    <Box flex={1} minW={0}>
                      <Text fontSize="13px" fontWeight={500} noOfLines={1}>
                        {s.context || 'Chat ' + (s.createdAt?.slice(0, 10) || '')}
                      </Text>
                      <Text fontSize="11px" color="warmGray.400" mt="2px">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString('es-PE') : ''}
                      </Text>
                    </Box>
                    <IconButton
                      size="xs"
                      variant="ghost"
                      color="warmGray.400"
                      _hover={{ bg: 'rose.50', color: 'rose.500' }}
                      icon={<Text fontSize="14px">🗑️</Text>}
                      onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                      aria-label="Eliminar sesión"
                    />
                  </Flex>
                ))
              )}
            </Box>
          ) : (
            <>
              {/* Messages area */}
              <Box
                flex={1}
                overflowY="auto"
                p="12px 12px 4px"
                sx={{ scrollbarWidth: 'thin', scrollbarColor: 'brand.100 transparent' }}
              >
                {!activeSessionId ? (
                  <VStack py={12} spacing={4} textAlign="center">
                    <Box
                      w="64px" h="64px" borderRadius="full"
                      bg={`linear-gradient(135deg, ${accentColor}15, ${accentColor}08)`}
                      display="flex" alignItems="center" justifyContent="center"
                      fontSize="28px"
                    >🤖</Box>
                    <Text fontSize="15px" fontWeight={600} color="brand.700">¿Necesitas ayuda?</Text>
                    <Text fontSize="13px" color="warmGray.400" maxW="260px" lineHeight={1.5}>
                      Inicia una conversación con nuestro asistente virtual especializado en pastelería
                    </Text>
                    <Button
                      mt={2}
                      size="sm"
                      bg={`linear-gradient(135deg, ${accentColor}, #15805d)`}
                      color="white"
                      _hover={{ transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(29,158,117,0.3)' }}
                      boxShadow="0 4px 12px rgba(29,158,117,0.3)"
                      borderRadius="full"
                      isLoading={creating}
                      onClick={handleNewSession}
                    >
                      Nueva conversación
                    </Button>
                  </VStack>
                ) : messages.length === 0 ? (
                  <VStack py={12} spacing={2}>
                    <Text fontSize="32px" opacity={0.5}>⏳</Text>
                    <Text fontSize="13px" color="warmGray.400">Cargando mensajes...</Text>
                  </VStack>
                ) : (
                  messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      msg={msg}
                      isUser={msg.senderRole === 'user'}
                    />
                  ))
                )}

                {aiTyping && <Box mt={2}><TypingIndicator /></Box>}

                {loading && !aiTyping && (
                  <Flex justify="flex-start" mt={2}>
                    <PastelAvatar name="P" size="xs" bg="accent.500" color="white" fontSize="10px" />
                    <Box ml="6px" px="18px" py="12px" borderRadius="14px" borderBottomLeftRadius="4px" bg="white" boxShadow="0 1px 3px rgba(0,0,0,0.06)" border="1px solid" borderColor="brand.100">
                      <Text fontSize="12px" color="warmGray.400">Enviando...</Text>
                    </Box>
                  </Flex>
                )}

                {error && (
                  <Box p="8px 12px" borderRadius="8px" bg="rose.50" color="rose.600" fontSize="12px" textAlign="center" mt={2}>
                    {error}
                  </Box>
                )}

                <div ref={messagesEndRef} />
              </Box>

              {/* Input area */}
              {activeSessionId && (
                <Flex
                  p="12px"
                  borderTop="1px solid"
                  borderColor="brand.100"
                  bg="white"
                  flexShrink={0}
                  gap="8px"
                >
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    isDisabled={loading || aiTyping}
                    size="sm"
                    borderRadius="full"
                    borderColor="brand.200"
                    _focus={{ borderColor: accentColor, bg: 'white' }}
                    bg="warmGray.50"
                    fontSize="13px"
                  />
                  <IconButton
                    borderRadius="full"
                    w="42px"
                    h="42px"
                    minW="42px"
                    bg={!input.trim() || loading || aiTyping ? 'warmGray.100' : accentColor}
                    color={!input.trim() || loading || aiTyping ? 'warmGray.400' : 'white'}
                    _hover={input.trim() && !loading && !aiTyping ? { bg: '#15805d', transform: 'scale(1.05)' } : undefined}
                    _active={{ transform: 'scale(0.95)' }}
                    isDisabled={!input.trim() || loading || aiTyping}
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    }
                    onClick={handleSend}
                    aria-label="Enviar mensaje"
                  />
                </Flex>
              )}
            </>
          )}
        </Box>
      )}
    </>
  );
}
