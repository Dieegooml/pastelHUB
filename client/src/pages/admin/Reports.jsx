import { useEffect, useState, Fragment } from 'react';
import {
  Box, Flex, Heading, Text, Button, Select, Table, Thead, Tbody, Tr, Th, Td,
  Tag, Alert, AlertIcon, useToast, HStack, SimpleGrid
} from '@chakra-ui/react';
import AdminNav from './AdminNav';
import ModeratorNav from '../moderator/ModeratorNav';
import { PastelPageHeader, PastelCard, PastelStatusBadge, PastelEmptyState, PastelFilterBar, PastelSkeletonTable } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { reportsService } from '../../services/reportsService';

const STATUSES = ['all', 'open', 'resolved', 'dismissed'];
const STATUS_TRANSLATIONS = { open: 'Abierto', resolved: 'Resuelto', dismissed: 'Descartado' };

export default function Reports() {
  const { user } = useAuth();
  const toast = useToast();
  const isPureModerator = user?.roles?.includes('moderator') && !user?.roles?.includes('admin');
  const isMod = user?.roles?.includes('moderator') || user?.roles?.includes('admin');
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selected, setSelected] = useState({});
  const [detail, setDetail] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = statusFilter === 'all'
        ? await reportsService.getAll()
        : await reportsService.getByStatus(statusFilter);
      setReports(data?.data || []);
    } catch (e) { console.error(e); setError('Error al cargar reportes'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleStatus = async (id, status) => {
    try { await reportsService.updateStatus(id, status); setSuccess(`Reporte ${STATUS_TRANSLATIONS[status]?.toLowerCase() || status}`); load(); }
    catch (e) { console.error(e); setError('Error al actualizar'); }
  };

  const handleAssign = async (id) => {
    if (!selected[id]) return;
    try { await reportsService.assignModerator(id, selected[id]); setSuccess('Moderador asignado'); setSelected((p) => ({ ...p, [id]: '' })); load(); }
    catch (e) { console.error(e); setError('Error al asignar moderador'); }
  };

  const handleAssignSelf = async (id) => {
    if (!user?.uid) return;
    try { await reportsService.assignModerator(id, user.uid); setSuccess('Reporte asignado a ti'); load(); }
    catch (e) { console.error(e); setError('Error al asignar'); }
  };

  const filterOptions = STATUSES.map((s) => ({
    value: s,
    label: s === 'all' ? 'Todos' : STATUS_TRANSLATIONS[s],
  }));

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <PastelPageHeader title="Reportes" />
      <Box mb={4}>{isPureModerator ? <ModeratorNav /> : <AdminNav />}</Box>

      {success && <Alert status="success" mb={4} borderRadius="lg">{success}</Alert>}
      {error && <Alert status="error" mb={4} borderRadius="lg">{error}</Alert>}

      <PastelFilterBar options={filterOptions} active={statusFilter} onChange={setStatusFilter} />

      {loading ? (
        <PastelSkeletonTable rows={5} cols={6} />
      ) : (
        <PastelCard p={0} overflow="hidden">
          {reports.length === 0 ? (
            <PastelEmptyState icon="🚩" title="No hay reportes que mostrar" />
          ) : (
            <Box overflowX="auto">
              <Table variant="pastel">
                <Thead>
                  <Tr><Th>ID</Th><Th>Tipo</Th><Th>Usuario</Th><Th>Motivo</Th><Th>Estado</Th><Th>Acciones</Th></Tr>
                </Thead>
                <Tbody>
                  {reports.map((r) => (
                    <Fragment key={r.id}>
                      <Tr _hover={{ bg: 'warmGray.100' }} cursor="pointer" onClick={() => setDetail(detail === r.id ? null : r.id)}>
                        <Td fontFamily="mono" fontSize="xs" color="warmGray.500">{r.id?.slice(0, 8)}</Td>
                        <Td fontSize="sm">{r.targetType || '—'}</Td>
                        <Td fontSize="sm" color="warmGray.500">{r.reportedBy?.slice(0, 8) || '—'}</Td>
                        <Td fontSize="sm" color="warmGray.500" maxW="200px" isTruncated title={r.reason || ''}>{r.reason || '—'}</Td>
                        <Td><PastelStatusBadge status={r.status} /></Td>
                        <Td onClick={(e) => e.stopPropagation()}>
                          <HStack spacing={1} flexWrap="wrap" align="center">
                            {r.status === 'open' && (
                              <>
                                <Button size="xs" colorScheme="green" variant="ghost" bg="#e8f5e9" color="#2e7d32" borderRadius="full" onClick={() => handleStatus(r.id, 'resolved')}>Resolver</Button>
                                <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleStatus(r.id, 'dismissed')}>Descartar</Button>
                                {isMod && (
                                  <Button size="xs" bg="brand.500" color="white" borderRadius="full" _hover={{ bg: 'brand.600' }} onClick={() => handleAssignSelf(r.id)}>Asignarme</Button>
                                )}
                              </>
                            )}
                            {r.status === 'resolved' && (
                              <Text fontSize="xs" color="warmGray.400">{r.assignedTo ? `Mod: ${r.assignedTo.slice(0, 8)}` : 'Sin asignar'}</Text>
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                      {detail === r.id && (
                        <Tr>
                          <Td colSpan={6} bg="warmGray.50" p={4}>
                            <Box borderTop="1px solid" borderColor="warmGray.200" pt={3}>
                              <SimpleGrid columns={2} spacing={4} fontSize="sm">
                                <Box><Text fontWeight={600} color="warmGray.500">ID completo:</Text><Text fontFamily="mono" fontSize="xs" wordBreak="break-all">{r.id}</Text></Box>
                                <Box><Text fontWeight={600} color="warmGray.500">Reportado por:</Text><Text fontFamily="mono" fontSize="xs" wordBreak="break-all">{r.reportedBy}</Text></Box>
                                <Box><Text fontWeight={600} color="warmGray.500">Target ID:</Text><Text fontFamily="mono" fontSize="xs" wordBreak="break-all">{r.targetId}</Text></Box>
                                <Box><Text fontWeight={600} color="warmGray.500">Creado:</Text><Text>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</Text></Box>
                                {r.assignedTo && (
                                  <Box><Text fontWeight={600} color="warmGray.500">Moderador asignado:</Text><Text fontFamily="mono" fontSize="xs" wordBreak="break-all">{r.assignedTo}</Text></Box>
                                )}
                                {r.resolvedAt && (
                                  <Box><Text fontWeight={600} color="warmGray.500">Resuelto en:</Text><Text>{new Date(r.resolvedAt).toLocaleString()}</Text></Box>
                                )}
                              </SimpleGrid>
                              <Box mt={4}>
                                <Text fontWeight={600} color="warmGray.500" fontSize="sm">Motivo completo:</Text>
                                <Box bg="white" p={3} borderRadius="lg" border="1px solid" borderColor="warmGray.200" mt={1} lineHeight={1.6} fontSize="sm">
                                  {r.reason}
                                </Box>
                              </Box>
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
