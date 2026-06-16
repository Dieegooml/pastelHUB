import { useEffect, useState } from 'react';
import {
  Box, Flex, Heading, Text, Button, Input, Select, Textarea,
  Table, Thead, Tbody, Tr, Th, Td, Tag, Alert, AlertIcon,
  useToast, Stack, HStack, SimpleGrid
} from '@chakra-ui/react';
import AdminNav from './AdminNav';
import { PastelPageHeader, PastelCard, PastelEmptyState, PastelSkeletonTable } from '../../components/UI';
import { notificationsService } from '../../services/notificationsService';
import { usersService } from '../../services/usersService';

export default function Notifications() {
  const toast = useToast();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ userId: '', title: '', message: '', type: 'info' });

  const load = async () => {
    try { setLoading(true); const data = await notificationsService.getAll(); setNotifs(data?.data || []); }
    catch (e) { console.error(e); setError('Error al cargar notificaciones'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.message) { setError('Título y mensaje son obligatorios'); return; }
    try {
      if (form.userId) {
        await notificationsService.create({ userId: form.userId, title: form.title, message: form.message, type: form.type });
      } else {
        const allUsers = await usersService.getAll().catch(() => ({}));
        const userIds = (allUsers?.data || []).map((u) => u.id).filter(Boolean);
        if (userIds.length === 0) { setError('No hay usuarios para notificar'); return; }
        await notificationsService.createBulk({ user_ids: userIds, title: form.title, message: form.message, type: form.type });
      }
      setForm({ userId: '', title: '', message: '', type: 'info' });
      setSuccess('Notificación creada');
      load();
    } catch (e) { console.error(e); setError('Error al crear notificación'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta notificación?')) return;
    try { await notificationsService.delete(id); setSuccess('Notificación eliminada'); load(); }
    catch (e) { console.error(e); setError('Error al eliminar'); }
  };

  const handleMarkRead = async (id) => {
    try { await notificationsService.markAsRead(id); load(); }
    catch (e) { console.error(e); setError('Error al marcar'); }
  };

  const typeBadge = (type) => {
    const map = { warning: { bg: '#fff8e1', color: '#f57f17' }, order: { bg: '#e3f2fd', color: '#1565c0' } };
    const c = map[type] || { bg: '#f0f0f0', color: '#666' };
    return <Tag bg={c.bg} color={c.color} borderRadius="full" fontSize="xs" fontWeight={500}>{type || 'info'}</Tag>;
  };

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <PastelPageHeader title="Notificaciones" />
      <Box mb={4}><AdminNav /></Box>

      {success && <Alert status="success" mb={4} borderRadius="lg">{success}</Alert>}
      {error && <Alert status="error" mb={4} borderRadius="lg">{error}</Alert>}

      <PastelCard title="Crear notificación" variant="elevated" mb={6}>
        <Stack spacing={3}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <Text fontSize="xs" color="warmGray.500" mb={1}>User ID (opcional — vacío = broadcast)</Text>
              <Input size="sm" value={form.userId} onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))} placeholder="Dejar vacío para todos" />
            </Box>
            <Box>
              <Text fontSize="xs" color="warmGray.500" mb={1}>Tipo</Text>
              <Select size="sm" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                <option value="info">Info</option>
                <option value="warning">Advertencia</option>
                <option value="order">Orden</option>
                <option value="promo">Promoción</option>
              </Select>
            </Box>
          </SimpleGrid>
          <Box>
            <Text fontSize="xs" color="warmGray.500" mb={1}>Título</Text>
            <Input size="sm" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Título de la notificación" />
          </Box>
          <Box>
            <Text fontSize="xs" color="warmGray.500" mb={1}>Mensaje</Text>
            <Textarea size="sm" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} placeholder="Contenido de la notificación" minH="60px" />
          </Box>
          <Button colorScheme="brand" alignSelf="flex-start" onClick={handleCreate}>Crear notificación</Button>
        </Stack>
      </PastelCard>

      {loading ? (
        <PastelSkeletonTable rows={5} cols={6} />
      ) : (
        <PastelCard p={0} overflow="hidden">
          {notifs.length === 0 ? (
            <PastelEmptyState icon="🔔" title="No hay notificaciones" />
          ) : (
            <Box overflowX="auto">
              <Table variant="pastel">
                <Thead>
                  <Tr><Th>ID</Th><Th>Usuario</Th><Th>Título</Th><Th>Tipo</Th><Th>Leída</Th><Th>Acciones</Th></Tr>
                </Thead>
                <Tbody>
                  {notifs.map((n) => (
                    <Tr key={n.id} opacity={n.read ? 0.6 : 1} _hover={{ bg: 'warmGray.100' }}>
                      <Td fontFamily="mono" fontSize="xs" color="warmGray.500">{n.id?.slice(0, 8)}</Td>
                      <Td fontSize="sm" color="warmGray.500">{n.user_id?.slice(0, 8) || '—'}</Td>
                      <Td fontSize="sm" maxW="200px" isTruncated title={n.title || ''}>{n.title || '—'}</Td>
                      <Td>{typeBadge(n.type)}</Td>
                      <Td fontSize="sm">{n.read ? '✅' : '⏳'}</Td>
                      <Td>
                        <HStack spacing={2}>
                          {!n.read && (
                            <Button size="xs" variant="outline" borderRadius="full" onClick={() => handleMarkRead(n.id)}>Leído</Button>
                          )}
                          <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDelete(n.id)}>Eliminar</Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </PastelCard>
      )}
    </Box>
  );
}
