import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Flex, HStack, VStack, Text, Heading, Button, Card, Badge, Textarea, Spinner,
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import { supportService } from '../../services/supportService';

const STATUS_COLORS = {
  open:         'yellow',
  in_progress:  'blue',
  resolved:     'green',
  closed:       'gray',
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
  customer:  'green',
  owner:     'orange',
  moderator: 'blue',
  admin:     'red',
};

export default function SupportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
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
      <Box maxW="800px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
        <VStack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Box key={i} h="48px" w="full" bg="warmGray.200" borderRadius="lg" />
          ))}
        </VStack>
      </Box>
    );
  }

  if (!ticket) {
    return (
      <Box maxW="800px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }} textAlign="center" color="warmGray.400" fontFamily="body">
        <Text>Ticket no encontrado</Text>
      </Box>
    );
  }

  const sc = STATUS_COLORS[ticket.status] || 'yellow';

  return (
    <Box maxW="800px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <HStack spacing={3} mb={2}>
        <Button
          variant="outline"
          borderColor="warmGray.300"
          size="sm"
          onClick={() => navigate('/support')}
          leftIcon={<Box as="span">←</Box>}
        >
          Volver
        </Button>
        <Heading as="h2" fontFamily="heading" fontSize={{ base: 'xl', md: '2xl' }} fontWeight={700} color="brand.700" flex={1}>
          {ticket.subject}
        </Heading>
        <Badge colorScheme={sc} variant="subtle" px={3} py={1} borderRadius="full" fontSize="xs">
          {STATUS_TRANSLATIONS[ticket.status] || ticket.status}
        </Badge>
      </HStack>

      <Text fontFamily="body" fontSize="xs" color="warmGray.500" mb={6}>
        {isModerator && ticket.userId ? `Creado por ${ticket.userId.slice(0, 8)}…` : ''}
        {ticket.createdAt ? ` — ${new Date(ticket.createdAt).toLocaleString('es-PE')}` : ''}
      </Text>

      {isModerator && (
        <HStack spacing={2} mb={5} flexWrap="wrap">
          {ticket.status === 'open' && !ticket.assignedTo && (
            <Button size="xs" variant="outline" colorScheme="blue" fontWeight={600} onClick={handleAssign}>
              Asignarme
            </Button>
          )}
          {ticket.status === 'open' && (
            <Button size="xs" variant="outline" colorScheme="blue" fontWeight={600} onClick={() => handleStatus('in_progress')}>
              Marcar en progreso
            </Button>
          )}
          {(ticket.status === 'open' || ticket.status === 'in_progress') && (
            <Button size="xs" variant="outline" colorScheme="green" fontWeight={600} onClick={() => handleStatus('resolved')}>
              Resolver
            </Button>
          )}
          {(ticket.status === 'resolved' || ticket.status === 'closed') && (
            <Button size="xs" variant="outline" colorScheme="yellow" fontWeight={600} onClick={() => handleStatus('open')}>
              Reabrir ticket
            </Button>
          )}
        </HStack>
      )}

      {error && (
        <Box bg="rose.50" color="rose.500" p={3} borderRadius="lg" mb={4} fontSize="sm" fontFamily="body" borderLeft="4px" borderLeftColor="rose.500">
          {error}
        </Box>
      )}

      <Card variant="elevated" mb={4}>
        <Box p={5} maxH="400px" overflowY="auto">
          <VStack spacing={3} align="stretch">
            {messages.length === 0 ? (
              <Text textAlign="center" color="warmGray.400" fontFamily="body" fontSize="sm">
                No hay mensajes aún
              </Text>
            ) : (
              messages.map((m, i) => {
                const isMe = m.senderId === user?.uid;
                const sc2 = SENDER_COLORS[m.senderRole] || 'green';
                const showDate = i === 0 || new Date(m.createdAt).toDateString() !== new Date(messages[i - 1]?.createdAt).toDateString();
                return (
                  <Box key={m.id}>
                    {showDate && (
                      <Text textAlign="center" fontSize="2xs" color="warmGray.300" fontFamily="body" mb={2}>
                        {new Date(m.createdAt).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                    )}
                    <Flex direction="column" align={isMe ? 'flex-end' : 'flex-start'}>
                      <HStack spacing={1.5} mb={1}>
                        <Badge colorScheme={sc2} variant="subtle" borderRadius="full" px={2} fontSize="2xs" fontWeight={600}>
                          {SENDER_LABELS[m.senderRole] || m.senderRole}
                        </Badge>
                        <Text fontSize="2xs" color="warmGray.300" fontFamily="body">
                          {new Date(m.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </HStack>
                      <Box
                        maxW="80%"
                        px={3.5}
                        py={2.5}
                        borderRadius="lg"
                        bg={isMe ? 'brand.700' : 'warmGray.100'}
                        color={isMe ? '#fff' : 'warmGray.800'}
                        fontSize="sm"
                        fontFamily="body"
                        lineHeight={1.6}
                        whiteSpace="pre-wrap"
                      >
                        {m.message}
                      </Box>
                    </Flex>
                  </Box>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </VStack>
        </Box>
      </Card>

      {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
        <Card variant="elevated" p={4}>
          <HStack spacing={2} align="flex-end">
            <Textarea
              fontSize="sm"
              minH="60px"
              flex={1}
              resize="none"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <Button
              variant="primary"
              size="md"
              h="40px"
              whiteSpace="nowrap"
              onClick={handleSend}
              isLoading={sending}
              isDisabled={!newMessage.trim()}
              loadingText="..."
            >
              Enviar
            </Button>
          </HStack>
        </Card>
      )}
    </Box>
  );
}
