import { useState, useEffect } from 'react';
import {
  Box, Flex, Heading, Text, Button, Card, useToast, HStack,
  SimpleGrid, Spinner, Badge
} from '@chakra-ui/react';
import AdminNav from './AdminNav';
import { chatService } from '../../services/chatService';
import { renderMarkdown } from '../../utils/markdown';

export default function AdminChat() {
  const toast = useToast();
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
    } catch (e) { toast({ title: 'Error al eliminar', status: 'error', duration: 3000, isClosable: true }); }
  }

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <AdminNav />
      <Heading fontSize="xl" fontWeight={700} color="brand.700" my={6}>
        💬 Chat Sessions
      </Heading>

      <HStack spacing={3} mb={4} justify="space-between" flexWrap="wrap">
        <HStack spacing={2}>
          {['all', 'active', 'closed'].map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? 'solid' : 'outline'}
              bg={statusFilter === s ? 'brand.500' : 'transparent'}
              color={statusFilter === s ? 'white' : 'warmGray.600'}
              borderRadius="full" onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'Todos' : s === 'active' ? 'Activos' : 'Cerrados'}
            </Button>
          ))}
        </HStack>
        <Button size="sm" colorScheme="brand" onClick={loadSessions}>🔄 Recargar</Button>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card p={4} maxH="600px" overflowY="auto">
          <Heading fontSize="sm" fontWeight={600} mb={3}>Sesiones ({sessions.length})</Heading>
          {loading ? (
            <Spinner size="sm" />
          ) : sessions.length === 0 ? (
            <Text color="warmGray.400" fontSize="sm">No hay sesiones</Text>
          ) : (
            <Flex direction="column" gap={2}>
              {sessions.map(s => (
                <Flex key={s.id} p={3} borderRadius="lg" cursor="pointer"
                  bg={selected?.id === s.id ? 'warmGray.100' : 'transparent'}
                  border="1px solid"
                  borderColor={selected?.id === s.id ? 'accent.500' : 'transparent'}
                  justify="space-between" align="center"
                  onClick={() => handleSelect(s)}
                  _hover={{ bg: 'warmGray.50' }}
                >
                  <Box flex={1}>
                    <Text fontWeight={500} fontSize="sm">{s.userId?.slice(0, 16) || 'Anónimo'}</Text>
                    <Text fontSize="xs" color="warmGray.400">{s.createdAt ? new Date(s.createdAt).toLocaleString() : ''}</Text>
                    <Text fontSize="xs" color="warmGray.400">Msgs: {s.messageCount || messages.length}</Text>
                  </Box>
                  <Button size="xs" variant="ghost" colorScheme="red" onClick={e => { e.stopPropagation(); handleDelete(s.id); }}>Eliminar</Button>
                </Flex>
              ))}
            </Flex>
          )}
        </Card>

        <Card p={4} gridColumn={{ md: '2 / 4' }} maxH="600px" overflowY="auto">
          {!selected ? (
            <Text textAlign="center" py={10} color="warmGray.400" fontSize="sm">Selecciona una sesión para ver los mensajes</Text>
          ) : messages.length === 0 ? (
            <Text textAlign="center" py={10} color="warmGray.400" fontSize="sm">Sin mensajes en esta sesión</Text>
          ) : (
            <Box>
              <Text fontSize="xs" color="warmGray.400" mb={2}>
                Sesión: {selected.id?.slice(0, 12)}... · {messages.length} mensajes
              </Text>
              <Flex direction="column" gap={3}>
                {messages.map((msg, i) => (
                  <Flex key={msg.id || i} justify={msg.senderRole === 'user' ? 'flex-end' : 'flex-start'}>
                    <Box
                      maxW="75%"
                      p={3}
                      borderRadius="xl"
                      bg={msg.senderRole === 'user' ? 'accent.500' : 'warmGray.100'}
                      color={msg.senderRole === 'user' ? 'white' : 'warmGray.800'}
                      fontSize="sm"
                      lineHeight={1.5}
                      borderBottomRightRadius={msg.senderRole === 'user' ? 'sm' : 'xl'}
                      borderBottomLeftRadius={msg.senderRole === 'user' ? 'xl' : 'sm'}
                    >
                      {msg.senderRole === 'user' ? msg.message : (
                        <Box dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.message) }} />
                      )}
                    </Box>
                  </Flex>
                ))}
              </Flex>
            </Box>
          )}
        </Card>
      </SimpleGrid>
    </Box>
  );
}
