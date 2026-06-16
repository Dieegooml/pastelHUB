import { useEffect, useState } from 'react';
import {
  Box, Heading, Text, Button, Select, Table, Thead, Tbody, Tr, Th, Td,
  Tag, Alert, AlertIcon, useToast, HStack
} from '@chakra-ui/react';
import AdminNav from './AdminNav';
import { PastelPageHeader, PastelCard, PastelStatusBadge, PastelEmptyState, PastelSkeletonTable } from '../../components/UI';
import { paymentsService } from '../../services/paymentsService';

const STATUS_TRANSLATIONS = { pending: 'Pendiente', paid: 'Pagado', refunded: 'Reembolsado', failed: 'Fallido' };

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function Payments() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusUpdate, setStatusUpdate] = useState({});

  const load = async () => {
    try { setLoading(true); const data = await paymentsService.getAll(); setPayments(data?.data || []); }
    catch (e) { console.error(e); setError('Error al cargar pagos'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id) => {
    if (!statusUpdate[id]) return;
    try {
      await paymentsService.updateStatus(id, statusUpdate[id], '');
      setStatusUpdate((p) => ({ ...p, [id]: '' }));
      setSuccess('Estado de pago actualizado');
      load();
    } catch (e) { console.error(e); setError('Error al actualizar'); }
  };

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <PastelPageHeader title="Pagos" />
      <Box mb={4}><AdminNav /></Box>

      {success && <Alert status="success" mb={4} borderRadius="lg">{success}</Alert>}
      {error && <Alert status="error" mb={4} borderRadius="lg">{error}</Alert>}

      {loading ? (
        <PastelSkeletonTable rows={5} cols={7} />
      ) : (
        <PastelCard p={0} overflow="hidden">
          {payments.length === 0 ? (
            <PastelEmptyState icon="💳" title="No hay pagos registrados" />
          ) : (
            <Box overflowX="auto">
              <Table variant="pastel">
                <Thead>
                  <Tr><Th>ID</Th><Th>Orden</Th><Th>Monto</Th><Th>Método</Th><Th>Estado</Th><Th>Fecha</Th><Th>Acciones</Th></Tr>
                </Thead>
                <Tbody>
                  {payments.map((p) => (
                    <Tr key={p.id} _hover={{ bg: 'warmGray.100' }}>
                      <Td fontFamily="mono" fontSize="xs" color="warmGray.500">{p.id?.slice(0, 8)}</Td>
                      <Td fontFamily="mono" fontSize="xs" color="warmGray.500">{p.orderId?.slice(0, 8) || '—'}</Td>
                      <Td fontSize="sm" fontWeight={600} color="brand.700">S/ {(p.amount || 0).toFixed(2)}</Td>
                      <Td fontSize="sm" color="warmGray.500">{p.paymentMethod || '—'}</Td>
                      <Td><PastelStatusBadge status={p.paymentStatus} /></Td>
                      <Td fontSize="sm" color="warmGray.500">{formatDate(p.createdAt)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Select size="sm" w="100px" value={statusUpdate[p.id] || ''} onChange={(e) => setStatusUpdate((s) => ({ ...s, [p.id]: e.target.value }))}>
                            <option value="">—</option>
                            {Object.keys(STATUS_TRANSLATIONS).map((s) => (
                              <option key={s} value={s}>{STATUS_TRANSLATIONS[s]}</option>
                            ))}
                          </Select>
                          <Button size="xs" colorScheme="brand" onClick={() => handleStatus(p.id)}>OK</Button>
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
