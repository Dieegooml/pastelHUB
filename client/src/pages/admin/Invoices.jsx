import { useEffect, useState } from 'react';
import {
  Box, Flex, Heading, Text, Button, Input, Select, Table, Thead, Tbody, Tr, Th, Td,
  Tag, Alert, AlertIcon, useToast, HStack
} from '@chakra-ui/react';
import AdminNav from './AdminNav';
import { PastelPageHeader, PastelCard, PastelStatusBadge, PastelEmptyState, PastelFilterBar, PastelSkeletonTable } from '../../components/UI';
import { invoicesService } from '../../services/invoicesService';

const STATUSES = ['all', 'issued', 'cancelled'];
const STATUS_TRANS = { issued: 'Emitida', cancelled: 'Anulada' };

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export default function Invoices() {
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newStatus, setNewStatus] = useState({});
  const [orderId, setOrderId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const HEADERS = ['Boleta', 'Fecha', 'Pastelería', 'Cliente', 'Total', 'Estado', 'Acciones'];

  const load = async () => {
    try {
      setLoading(true);
      const res = await invoicesService.getAll();
      let list = res?.data || [];
      if (filter !== 'all') list = list.filter((i) => i.status === filter);
      setInvoices(list);
    } catch (e) { setError('Error al cargar boletas'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleGenerate = async () => {
    if (!orderId.trim()) return;
    setGenerating(true);
    try {
      await invoicesService.generate(orderId.trim());
      setSuccess('Boleta generada correctamente');
      setOrderId('');
      load();
    } catch (e) { setError(e.response?.data?.error || 'Error al generar boleta'); } finally { setGenerating(false); }
  };

  const handleUpdateStatus = async (id) => {
    if (!newStatus[id]) return;
    try {
      await invoicesService.updateStatus(id, newStatus[id]);
      setNewStatus((p) => ({ ...p, [id]: '' }));
      setSuccess('Estado actualizado');
      load();
    } catch (e) { setError('Error al actualizar estado'); }
  };

  const handleDownload = async (id) => {
    setDownloading(id);
    try { await invoicesService.downloadPdf(id); }
    catch (err) { setError(err.message || 'Error al descargar PDF'); }
    finally { setDownloading(null); }
  };

  const filterOptions = STATUSES.map((s) => ({
    value: s,
    label: s === 'all' ? 'Todas' : STATUS_TRANS[s],
  }));

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <PastelPageHeader
        title="Boletas"
        actions={
          <Tag bg="warmGray.100" color="brand.700" borderRadius="full" fontSize="sm" fontWeight={500}>{invoices.length}</Tag>
        }
      />
      <Box mb={4}><AdminNav /></Box>

      {success && <Alert status="success" mb={4} borderRadius="lg">{success}</Alert>}
      {error && <Alert status="error" mb={4} borderRadius="lg">{error}</Alert>}

      <PastelCard p={4} mb={5} variant="bordered">
        <HStack spacing={3} align="flex-end" flexWrap="wrap">
          <Box>
            <Text fontSize="xs" color="warmGray.500" mb={1}>Order ID</Text>
            <Input size="sm" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Ingresa ID de orden" minW="200px" />
          </Box>
          <Button size="sm" colorScheme="accent" onClick={handleGenerate} isDisabled={generating || !orderId.trim()}>
            {generating ? 'Generando...' : 'Generar boleta'}
          </Button>
        </HStack>
      </PastelCard>

      <PastelFilterBar options={filterOptions} active={filter} onChange={setFilter} />

      {loading ? (
        <PastelSkeletonTable rows={5} cols={7} />
      ) : (
        <PastelCard p={0} overflow="hidden">
          {invoices.length === 0 ? (
            <PastelEmptyState icon="📄" title="No hay boletas que mostrar" />
          ) : (
            <Box overflowX="auto">
              <Table variant="pastel">
                <Thead>
                  <Tr>{HEADERS.map((h) => <Th key={h}>{h}</Th>)}</Tr>
                </Thead>
                <Tbody>
                  {invoices.map((inv) => (
                    <Tr key={inv.id}>
                      <Td fontFamily="mono" fontWeight={700} color="accent.500">{inv.invoiceNumber}</Td>
                      <Td fontSize="sm" color="warmGray.500">{formatDate(inv.issueDate)}</Td>
                      <Td fontSize="sm">{inv.shopName}</Td>
                      <Td fontSize="sm">{inv.customerName}</Td>
                      <Td fontSize="sm" fontWeight={600} color="brand.700">S/ {(inv.total || 0).toFixed(2)}</Td>
                      <Td><PastelStatusBadge status={inv.status} /></Td>
                      <Td>
                        <HStack spacing={2}>
                          {inv.status === 'issued' && (
                            <Button size="xs" colorScheme="accent" borderRadius="full"
                              onClick={() => handleDownload(inv.id)} isDisabled={downloading === inv.id}>
                              {downloading === inv.id ? '...' : 'PDF'}
                            </Button>
                          )}
                          <HStack spacing={1}>
                            <Select size="xs" w="80px" value={newStatus[inv.id] || ''} onChange={(e) => setNewStatus((p) => ({ ...p, [inv.id]: e.target.value }))}>
                              <option value="">—</option>
                              <option value="cancelled">Anular</option>
                            </Select>
                            <Button size="xs" colorScheme="red" borderRadius="full"
                              isDisabled={!newStatus[inv.id]} onClick={() => handleUpdateStatus(inv.id)}>OK</Button>
                          </HStack>
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
