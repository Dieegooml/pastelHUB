import { useEffect, useState } from 'react';
import {
  Box, Flex, Text, Button, Select, Table, Thead, Tbody, Tr, Th, Td,
  Tag, useToast, Card, HStack
} from '@chakra-ui/react';
import { ordersService } from '../../services/ordersService';
import { STATUS_TRANSLATIONS, STATUS_COLORS, ALL_STATUSES } from './ownerConstants';
import PropTypes from 'prop-types';

export default function OwnerTabOrders({ selectedShop, setError, setSuccess }) {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [statusUpdate, setStatusUpdate] = useState({});

  useEffect(() => {
    if (!selectedShop?.id) return;
    ordersService.getByShop(selectedShop.id).then((data) => setOrders(data?.data || [])).catch((e) => console.error(e));
  }, [selectedShop]);

  const handleOrderStatus = async (id) => {
    if (!statusUpdate[id]) return;
    try {
      await ordersService.updateStatus(id, statusUpdate[id]);
      setStatusUpdate((p) => ({ ...p, [id]: '' }));
      setSuccess('Estado actualizado');
      const data = await ordersService.getByShop(selectedShop.id);
      setOrders(data?.data || []);
    } catch (e) { console.error(e); setError('Error al actualizar estado'); }
  };

  const statusBadge = (key) => {
    const c = STATUS_COLORS[key] || STATUS_COLORS.pending;
    return <Tag bg={c.bg} color={c.color} borderRadius="full" fontSize="xs" fontWeight={500}>{STATUS_TRANSLATIONS[key] || key}</Tag>;
  };

  return (
    <Card p={0} overflow="hidden">
      {orders.length === 0 ? (
        <Box textAlign="center" py={10} color="warmGray.400" fontSize="sm">No hay órdenes para esta pastelería</Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="pastel">
            <Thead>
              <Tr><Th>Orden</Th><Th>Cliente</Th><Th>Total</Th><Th>Estado</Th><Th>Actualizar</Th></Tr>
            </Thead>
            <Tbody>
              {orders.map((o) => (
                <Tr key={o.id} _hover={{ bg: 'warmGray.100' }}>
                  <Td fontFamily="mono" fontSize="xs" color="warmGray.500">{o.id?.slice(0, 8)}</Td>
                  <Td fontSize="sm">{o.customer?.name || '—'}</Td>
                  <Td fontSize="sm" fontWeight={600} color="brand.700">S/ {(o.totals?.total || 0).toFixed(2)}</Td>
                  <Td>{statusBadge(o.status)}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <Select size="sm" w="120px" value={statusUpdate[o.id] || ''} onChange={(e) => setStatusUpdate((s) => ({ ...s, [o.id]: e.target.value }))}>
                        <option value="">—</option>
                        {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_TRANSLATIONS[s]}</option>)}
                      </Select>
                      <Button size="xs" colorScheme="brand" onClick={() => handleOrderStatus(o.id)}>OK</Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Card>
  );
}

OwnerTabOrders.propTypes = {
  selectedShop: PropTypes.object,
  setError: PropTypes.func,
  setSuccess: PropTypes.func,
};
