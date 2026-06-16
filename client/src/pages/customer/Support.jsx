import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Flex, HStack, Text, Heading, Button, Badge, VStack,
  Table, Thead, Tbody, Tr, Th, Td,
} from '@chakra-ui/react';
import { PastelCard } from '../../components/UI';
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

const PRIORITY_COLORS = {
  low:    'green',
  medium: 'yellow',
  high:   'red',
};

const PRIORITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export default function Support() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isModerator = user?.roles?.includes('moderator') || user?.roles?.includes('admin');

  const load = async () => {
    try {
      setLoading(true);
      const res = await supportService.getTickets(statusFilter || undefined);
      setTickets(res?.data || []);
    } catch (e) { console.error(e); setError('Error al cargar tickets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleAssign = async (id) => {
    try {
      await supportService.assign(id);
      load();
    } catch (e) { console.error(e); setError('Error al asignar ticket'); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await supportService.updateStatus(id, newStatus);
      load();
    } catch (e) { console.error(e); setError('Error al cambiar estado'); }
  };

  const STATUS_FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'open', label: 'Abiertos' },
    { value: 'in_progress', label: 'En progreso' },
    { value: 'resolved', label: 'Resueltos' },
    { value: 'closed', label: 'Cerrados' },
  ];

  return (
    <Box maxW="1000px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <Flex align="center" justify="space-between" flexWrap="wrap" gap={4} mb={6}>
        <Box>
          <Heading as="h2" fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }} fontWeight={700} color="brand.700">
            {isModerator ? 'Tickets de soporte' : 'Mis tickets'}
          </Heading>
          <Text fontFamily="body" fontSize="xs" color="warmGray.500" mt={1}>
            {isModerator ? 'Administra los tickets de clientes y dueños' : 'Consulta y da seguimiento a tus solicitudes'}
          </Text>
        </Box>
        {!isModerator && (
          <Button variant="primary" onClick={() => navigate('/support/new')}>
            + Nuevo ticket
          </Button>
        )}
      </Flex>

      <Box h="3px" w="60px" bgGradient="linear(90deg, accent.500, brand.500)" borderRadius="full" mb={6} />

      {isModerator && (
        <HStack spacing={2} mb={5} flexWrap="wrap">
          {STATUS_FILTERS.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={statusFilter === s.value ? 'primary' : 'outline'}
              borderColor={statusFilter === s.value ? undefined : 'warmGray.300'}
              onClick={() => setStatusFilter(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </HStack>
      )}

      {error && (
        <Box bg="rose.50" color="rose.500" p={3} borderRadius="lg" mb={4} fontSize="sm" fontFamily="body" borderLeft="4px" borderLeftColor="rose.500">
          {error}
        </Box>
      )}

      {loading ? (
        <Box textAlign="center" py={12}>
          {[1, 2, 3].map((i) => (
            <Box key={i} h="48px" bg="warmGray.200" borderRadius="lg" mb={2} />
          ))}
        </Box>
      ) : tickets.length === 0 ? (
        <VStack py={16} spacing={3}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <Text color="warmGray.400" fontSize="sm" fontFamily="body">
            {isModerator ? 'No hay tickets' : 'No tienes tickets aún'}
          </Text>
          {!isModerator && (
            <Button variant="primary" onClick={() => navigate('/support/new')}>Crear mi primer ticket</Button>
          )}
        </VStack>
      ) : (
        <PastelCard variant="elevated" overflow="hidden">
          <Box overflowX="auto">
            <Table variant="pastel">
              <Thead>
                <Tr>
                  {isModerator && <Th>Usuario</Th>}
                  <Th>Asunto</Th>
                  <Th display={{ base: 'none', md: 'table-cell' }}>Prioridad</Th>
                  <Th>Estado</Th>
                  {isModerator && <Th display={{ base: 'none', md: 'table-cell' }}>Asignado</Th>}
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tickets.map((t) => {
                  return (
                    <Tr key={t.id}>
                      {isModerator && (
                        <Td>
                          <Text title={t.userId} fontSize="xs">{t.userId?.slice(0, 8)}…</Text>
                        </Td>
                      )}
                      <Td fontWeight={500} cursor="pointer" onClick={() => navigate(`/support/${t.id}`)}>
                        {t.subject}
                      </Td>
                      <Td display={{ base: 'none', md: 'table-cell' }}>
                        <Badge colorScheme={PRIORITY_COLORS[t.priority] || 'yellow'} variant="subtle" borderRadius="full" px={2} fontSize="2xs">
                          {PRIORITY_LABELS[t.priority] || t.priority}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={STATUS_COLORS[t.status] || 'yellow'} variant="subtle" borderRadius="full" px={2} fontSize="2xs">
                          {STATUS_TRANSLATIONS[t.status] || t.status}
                        </Badge>
                      </Td>
                      {isModerator && (
                        <Td display={{ base: 'none', md: 'table-cell' }}>
                          <Text fontSize="xs" color={t.assignedTo ? undefined : 'warmGray.400'}>
                            {t.assignedTo ? <span title={t.assignedTo}>{t.assignedTo.slice(0, 8)}…</span> : '—'}
                          </Text>
                        </Td>
                      )}
                      <Td>
                        <HStack spacing={2} flexWrap="wrap">
                          <Button size="xs" variant="outline" borderColor="warmGray.300" onClick={() => navigate(`/support/${t.id}`)}>
                            Ver
                          </Button>
                          {isModerator && (
                            <>
                              {!t.assignedTo && t.status === 'open' && (
                                <Button size="xs" variant="outline" colorScheme="blue" onClick={() => handleAssign(t.id)}>
                                  Asignarme
                                </Button>
                              )}
                              {t.status === 'open' && (
                                <Button size="xs" variant="outline" colorScheme="blue" onClick={() => handleStatusChange(t.id, 'in_progress')}>
                                  → Prog.
                                </Button>
                              )}
                              {(t.status === 'open' || t.status === 'in_progress') && (
                                <Button size="xs" variant="outline" colorScheme="green" onClick={() => handleStatusChange(t.id, 'resolved')}>
                                  Resolver
                                </Button>
                              )}
                              {(t.status === 'resolved' || t.status === 'closed') && (
                                <Button size="xs" variant="outline" colorScheme="yellow" onClick={() => handleStatusChange(t.id, 'open')}>
                                  Reabrir
                                </Button>
                              )}
                            </>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        </PastelCard>
      )}
    </Box>
  );
}
