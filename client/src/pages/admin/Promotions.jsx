import { useEffect, useState } from 'react';
import {
  Box, Heading, Text, Button, Table, Thead, Tbody, Tr, Th, Td,
  Tag, Alert, AlertIcon, useToast, HStack
} from '@chakra-ui/react';
import AdminNav from './AdminNav';
import { PastelPageHeader, PastelCard, PastelStatusBadge, PastelEmptyState, PastelSkeletonTable } from '../../components/UI';
import { promotionsService } from '../../services/promotionsService';

const TYPES = { discount: 'Descuento', combo: 'Combo', bogo: '2x1' };
const TYPE_COLORS = {
  discount: { bg: '#fff8e1', color: '#f59e0b' },
  combo: { bg: '#e3f2fd', color: '#2196f3' },
  bogo: { bg: '#e8f5e9', color: '#2e7d32' },
};

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d.slice(0, 10);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
};

export default function Promotions() {
  const toast = useToast();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try { setLoading(true); const data = await promotionsService.getAll(); setPromotions(data?.data || []); }
    catch (e) { console.error(e); setError('Error al cargar promociones'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id) => {
    try { await promotionsService.toggle(id); setSuccess('Estado cambiado'); load(); }
    catch (e) { console.error(e); setError('Error al cambiar estado'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    try { await promotionsService.delete(id); setSuccess('Promoción eliminada'); load(); }
    catch (e) { console.error(e); setError('Error al eliminar'); }
  };

  const typeBadge = (type) => {
    const c = TYPE_COLORS[type] || { bg: '#f0f0f0', color: '#666' };
    return <Tag bg={c.bg} color={c.color} borderRadius="full" fontSize="xs" fontWeight={500}>{TYPES[type] || type}</Tag>;
  };

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <PastelPageHeader title="Promociones" />
      <Box mb={4}><AdminNav /></Box>

      {success && <Alert status="success" mb={4} borderRadius="lg">{success}</Alert>}
      {error && <Alert status="error" mb={4} borderRadius="lg">{error}</Alert>}

      {loading ? (
        <PastelSkeletonTable rows={5} cols={7} />
      ) : (
        <PastelCard p={0} overflow="hidden">
          {promotions.length === 0 ? (
            <PastelEmptyState icon="🎉" title="No hay promociones registradas" />
          ) : (
            <Box overflowX="auto">
              <Table variant="pastel">
                <Thead>
                  <Tr><Th>Nombre</Th><Th>Pastelería</Th><Th>Tipo</Th><Th>Estado</Th><Th>Inicio</Th><Th>Fin</Th><Th>Acciones</Th></Tr>
                </Thead>
                <Tbody>
                  {promotions.map((p) => (
                    <Tr key={p.id} _hover={{ bg: 'warmGray.100' }}>
                      <Td fontWeight={600} color="brand.700">{p.name || '—'}</Td>
                      <Td fontFamily="mono" fontSize="xs" color="warmGray.500">{p.shop_id?.slice(0, 8) || '—'}</Td>
                      <Td>{typeBadge(p.type)}</Td>
                      <Td><PastelStatusBadge status={p.is_active ? 'active' : 'inactive'} /></Td>
                      <Td fontSize="sm" color="warmGray.500">{formatDate(p.start_date)}</Td>
                      <Td fontSize="sm" color="warmGray.500">{formatDate(p.end_date)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button size="xs" variant="ghost"
                            bg={p.is_active ? '#fff8e1' : '#e8f5e9'}
                            color={p.is_active ? '#f59e0b' : '#2e7d32'}
                            borderRadius="full"
                            _hover={{ opacity: 0.8 }}
                            onClick={() => handleToggle(p.id)}
                          >
                            {p.is_active ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDelete(p.id)}>Eliminar</Button>
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
