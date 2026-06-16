import { useEffect, useState } from 'react';
import {
  Box, Flex, Text, Button, Select, Card, HStack, Tag, Table, Thead, Tbody, Tr, Th, Td, useToast
} from '@chakra-ui/react';
import { ordersService } from '../../services/ordersService';
import { invoicesService } from '../../services/invoicesService';
import { formatDate, STATUS_TRANSLATIONS } from './ownerConstants';
import PropTypes from 'prop-types';

export default function OwnerTabBoletas({ selectedShop, setError, setSuccess }) {
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!selectedShop?.id) return;
    setInvoicesLoading(true);
    invoicesService.getByShop(selectedShop.id)
      .then((res) => setInvoices(Array.isArray(res) ? res : res?.data || []))
      .catch((e) => console.error(e))
      .finally(() => setInvoicesLoading(false));
  }, [selectedShop]);

  const filteredInvoices = statusFilter ? invoices.filter((inv) => inv.status === statusFilter) : invoices;

  const handleDownload = async (invoice) => {
    try {
      const blob = await invoicesService.download(invoice.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boleta-${invoice.invoice_number || invoice.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError('Error al descargar boleta');
    }
  };

  const handleRegenerate = async (invoice) => {
    try {
      await invoicesService.regenerate(invoice.id);
      const res = await invoicesService.getByShop(selectedShop.id);
      setInvoices(Array.isArray(res) ? res : res?.data || []);
      setSuccess('Boleta regenerada');
    } catch (e) {
      console.error(e);
      setError('Error al regenerar boleta');
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="sm" color="warmGray.400">{filteredInvoices.length} boletas</Text>
        <Select size="sm" w="200px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todas</option>
          <option value="paid">Pagadas</option>
          <option value="pending">Pendientes</option>
          <option value="cancelled">Anuladas</option>
        </Select>
      </Flex>

      {invoicesLoading ? (
        <Card p={10}><Text textAlign="center" color="warmGray.400">Cargando boletas...</Text></Card>
      ) : filteredInvoices.length === 0 ? (
        <Card p={10}>
          <Text textAlign="center" color="warmGray.400" fontSize="sm">
            {statusFilter ? 'No hay boletas con ese estado.' : 'No hay boletas generadas todavía.'}
          </Text>
        </Card>
      ) : (
        <Card p={0} overflow="hidden">
          <Box overflowX="auto">
            <Table variant="pastel">
              <Thead>
                <Tr>
                  <Th># Boleta</Th>
                  <Th>Orden</Th>
                  <Th>Cliente</Th>
                  <Th>Total</Th>
                  <Th>Estado</Th>
                  <Th>Fecha</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredInvoices.map((inv) => (
                  <Tr key={inv.id} _hover={{ bg: 'warmGray.100' }}>
                    <Td fontSize="sm" fontWeight={600} fontFamily="heading" color="brand.700">
                      {inv.invoice_number || inv.id.slice(0, 8)}
                    </Td>
                    <Td fontSize="sm">{inv.order_id?.slice(0, 8) || `#${inv.order_number || '—'}`}</Td>
                    <Td fontSize="sm">{inv.customer_name || '—'}</Td>
                    <Td fontSize="sm" fontWeight={600} color="accent.500">S/ {(inv.total || 0).toFixed(2)}</Td>
                    <Td fontSize="sm">
                      <Tag bg={inv.status === 'paid' ? '#d1fae5' : inv.status === 'pending' ? '#fef3c7' : '#fee2e2'}
                        color={inv.status === 'paid' ? '#1D9E75' : inv.status === 'pending' ? '#d97706' : '#ef4444'} borderRadius="full" fontSize="xs" fontWeight={500}>
                        {STATUS_TRANSLATIONS[inv.status] || inv.status}
                      </Tag>
                    </Td>
                    <Td fontSize="sm" color="warmGray.500">{inv.date ? formatDate(inv.date) : formatDate(inv.created_at)}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button size="xs" variant="ghost" onClick={() => handleDownload(inv)}>Descargar</Button>
                        <Button size="xs" variant="ghost" onClick={() => handleRegenerate(inv)}>Regenerar</Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Card>
      )}
    </Box>
  );
}

OwnerTabBoletas.propTypes = {
  selectedShop: PropTypes.object,
  setError: PropTypes.func,
  setSuccess: PropTypes.func,
};
