import { useEffect, useState, Fragment } from 'react';
import {
  Box, Flex, Heading, Text, Button, Table, Thead, Tbody, Tr, Th, Td,
  Tag, Alert, AlertIcon, Input, useToast, HStack
} from '@chakra-ui/react';
import AdminNav from './AdminNav';
import ModeratorNav from '../moderator/ModeratorNav';
import { PastelPageHeader, PastelCard, PastelStatusBadge, PastelEmptyState, PastelFilterBar, PastelSkeletonTable } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { reviewsService } from '../../services/reviewsService';

const STATUSES = ['all', 'pending', 'approved', 'rejected'];
const STATUS_TRANSLATIONS = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' };

export default function Reviews() {
  const { user } = useAuth();
  const toast = useToast();
  const isPureModerator = user?.roles?.includes('moderator') && !user?.roles?.includes('admin');
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = filter === 'all'
        ? await reviewsService.getAll()
        : await reviewsService.getByStatus(filter);
      setReviews(data?.data || []);
    } catch (e) {
      console.error(e);
      setError('Error al cargar reseñas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, [filter]);

  const handleModerate = async (id, status) => {
    try { await reviewsService.moderate(id, status); setSuccess(`Reseña ${status === 'approved' ? 'aprobada' : 'rechazada'}`); loadReviews(); }
    catch (e) { console.error(e); setError('Error al moderar la reseña'); }
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    try { await reviewsService.reply(id, replyText.trim()); setReplyText(''); setSuccess('Respuesta enviada'); loadReviews(); }
    catch (e) { console.error(e); setError('Error al responder la reseña'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta reseña? Se recalculará el rating de la pastelería.')) return;
    try { await reviewsService.delete(id); setSuccess('Reseña eliminada'); loadReviews(); }
    catch (e) { console.error(e); setError('Error al eliminar la reseña'); }
  };

  const idLabel = (raw) => {
    if (!raw) return '—';
    return raw.slice(0, 8) + '…';
  };

  const filterOptions = STATUSES.map((s) => ({
    value: s,
    label: s === 'all' ? 'Todas' : STATUS_TRANSLATIONS[s],
  }));

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <PastelPageHeader
        title="Reseñas"
        actions={
          <Tag bg="warmGray.100" color={reviews.length > 0 ? 'brand.700' : 'warmGray.500'} borderRadius="full" fontSize="sm" fontWeight={500}>{reviews.length}</Tag>
        }
      />
      <Box mb={4}>{isPureModerator ? <ModeratorNav /> : <AdminNav />}</Box>

      {success && <Alert status="success" mb={4} borderRadius="lg">{success}</Alert>}
      {error && <Alert status="error" mb={4} borderRadius="lg">{error}</Alert>}

      <PastelFilterBar options={filterOptions} active={filter} onChange={setFilter} />

      {loading ? (
        <PastelSkeletonTable rows={5} cols={7} />
      ) : (
        <PastelCard p={0} overflow="hidden">
          {reviews.length === 0 ? (
            <PastelEmptyState
              icon="⭐"
              title={filter === 'all' ? 'No hay reseñas que mostrar' : `No hay reseñas con estado "${STATUS_TRANSLATIONS[filter]}"`}
            />
          ) : (
            <Box overflowX="auto">
              <Table variant="pastel">
                <Thead>
                  <Tr>
                    <Th>Cliente</Th>
                    <Th display={{ base: 'none', md: 'table-cell' }}>Pastelería</Th>
                    <Th>Rating</Th>
                    <Th display={{ base: 'none', md: 'table-cell' }}>Comentario</Th>
                    <Th>Estado</Th>
                    <Th display={{ base: 'none', md: 'table-cell' }}>Respuesta</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {reviews.map((r) => (
                    <Fragment key={r.id}>
                      <Tr _hover={{ bg: 'warmGray.100' }}>
                        <Td fontSize="sm">{idLabel(r.customerId)}</Td>
                        <Td display={{ base: 'none', md: 'table-cell' }} fontSize="sm">{idLabel(r.shopId)}</Td>
                        <Td fontSize="sm">{'⭐'.repeat(r.rating)}</Td>
                        <Td display={{ base: 'none', md: 'table-cell' }} fontSize="sm" maxW="200px" isTruncated title={r.comment || undefined}>
                          {r.comment || <Text as="span" color="warmGray.400">Sin datos</Text>}
                        </Td>
                        <Td><PastelStatusBadge status={r.status} /></Td>
                        <Td display={{ base: 'none', md: 'table-cell' }} fontSize="sm" color={r.ownerReply ? 'warmGray.500' : 'warmGray.400'}>
                          {r.ownerReply ? r.ownerReply.slice(0, 30) + (r.ownerReply.length > 30 ? '…' : '') : 'Sin datos'}
                        </Td>
                        <Td>
                          <HStack spacing={1} flexWrap="wrap">
                            <Button size="xs" colorScheme="green" variant="ghost" bg="#e1f5ee" color="#1D9E75" borderRadius="full" onClick={() => handleModerate(r.id, 'approved')}>Aprobar</Button>
                            <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleModerate(r.id, 'rejected')}>Rechazar</Button>
                            {!isPureModerator && (
                              <Button size="xs" variant="ghost" onClick={() => handleDelete(r.id)}>Eliminar</Button>
                            )}
                            {!isPureModerator && (
                              <Button size="xs" variant="ghost" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                                {expandedId === r.id ? '▲' : '▼'} Responder
                              </Button>
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                      {expandedId === r.id && (
                        <Tr>
                          <Td colSpan={7} bg="warmGray.50" p={4}>
                            <Box borderTop="1px solid" borderColor="warmGray.200" pt={3}>
                              <Text fontSize="sm" mb={2}><strong>Comentario:</strong> {r.comment || 'Sin datos'}</Text>
                              {r.ownerReply && <Text fontSize="sm" mb={2} color="warmGray.500"><strong>Respuesta actual:</strong> {r.ownerReply}</Text>}
                              <HStack spacing={3} align="flex-end">
                                <Box flex={1}>
                                  <Text fontSize="xs" color="warmGray.500">Responder al cliente</Text>
                                  <Input size="sm" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={r.ownerReply ? 'Actualizar respuesta...' : 'Escribe una respuesta...'} />
                                </Box>
                                <Button size="sm" colorScheme="accent" onClick={() => handleReply(r.id)}>
                                  {r.ownerReply ? 'Actualizar' : 'Responder'}
                                </Button>
                              </HStack>
                            </Box>
                          </Td>
                        </Tr>
                      )}
                    </Fragment>
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
