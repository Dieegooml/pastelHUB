import { useEffect, useState, Fragment } from 'react';
import {
  Box, Flex, Heading, Text, Button, Table, Thead, Tbody, Tr, Th, Td,
  Tag, Spinner, Alert, AlertIcon, useToast
} from '@chakra-ui/react';
import AdminNav from './AdminNav';
import { PastelPageHeader, PastelCard, PastelEmptyState, PastelSkeletonTable } from '../../components/UI';
import { customersService } from '../../services/customersService';

export default function Customers() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expanded, setExpanded] = useState({});
  const [addresses, setAddresses] = useState({});
  const [addrLoading, setAddrLoading] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const data = await customersService.getAll();
      setCustomers(data?.data || []);
    } catch (e) { console.error(e); setError('Error al cargar clientes'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = async (id) => {
    if (expanded[id]) { setExpanded((p) => ({ ...p, [id]: false })); return; }
    setExpanded((p) => ({ ...p, [id]: true }));
    if (!addresses[id]) {
      setAddrLoading((p) => ({ ...p, [id]: true }));
      try {
        const data = await customersService.getById(id);
        const addr = await customersService.getAddresses(id).catch(() => []);
        setAddresses((p) => ({ ...p, [id]: { customer: data, addresses: Array.isArray(addr) ? addr : [] } }));
      } catch (e) { console.error(e); } finally { setAddrLoading((p) => ({ ...p, [id]: false })); }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try { await customersService.delete(id); setSuccess('Cliente eliminado'); load(); }
    catch (e) { console.error(e); setError('Error al eliminar'); }
  };

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <PastelPageHeader title="Clientes" />
      <Box mb={4}><AdminNav /></Box>

      {success && <Alert status="success" mb={4} borderRadius="lg">{success}</Alert>}
      {error && <Alert status="error" mb={4} borderRadius="lg">{error}</Alert>}

      {loading ? (
        <PastelSkeletonTable rows={5} cols={5} />
      ) : (
        <PastelCard p={0} overflow="hidden">
          {customers.length === 0 ? (
            <PastelEmptyState icon="👤" title="No hay clientes registrados" />
          ) : (
            <Box overflowX="auto">
              <Table variant="pastel">
                <Thead>
                  <Tr>
                    <Th>ID</Th><Th>Nombre</Th><Th>Email</Th><Th>Teléfono</Th><Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {customers.map((c) => (
                    <Fragment key={c.id}>
                      <Tr _hover={{ bg: 'warmGray.100' }} cursor="pointer" onClick={() => toggleExpand(c.id)}>
                        <Td fontFamily="mono" fontSize="xs" color="warmGray.500">{c.id?.slice(0, 8)}</Td>
                        <Td fontSize="sm">{c.name || '—'}</Td>
                        <Td fontSize="sm" color="warmGray.500">{c.email || '—'}</Td>
                        <Td fontSize="sm">{c.phone || '—'}</Td>
                        <Td onClick={(e) => e.stopPropagation()}>
                          <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDelete(c.id)}>Eliminar</Button>
                        </Td>
                      </Tr>
                      {expanded[c.id] && (
                        <Tr>
                          <Td colSpan={5} bg="warmGray.50" p={4}>
                            {addrLoading[c.id] ? (
                              <Spinner size="sm" />
                            ) : addresses[c.id] ? (
                              <Box>
                                <Text fontSize="sm" mb={2}>
                                  <strong>Email:</strong> {addresses[c.id].customer?.email || '—'}<br />
                                  <strong>Teléfono:</strong> {addresses[c.id].customer?.phone || '—'}<br />
                                  <strong>Default Address ID:</strong> {addresses[c.id].customer?.defaultAddressId || '—'}
                                </Text>
                                {addresses[c.id].addresses?.length > 0 && (
                                  <Box>
                                    <Text fontSize="sm" fontWeight={600} color="brand.700" mb={1}>
                                      Direcciones ({addresses[c.id].addresses.length})
                                    </Text>
                                    {addresses[c.id].addresses.map((a) => (
                                      <Text key={a.id} fontSize="sm" color="warmGray.500" mb={1} pl={3} borderLeft="2px solid" borderLeftColor="accent.500">
                                        {a.street}, {a.city}{a.district ? `, ${a.district}` : ''}{a.reference ? ` — ${a.reference}` : ''}{a.isDefault ? ' ★' : ''}
                                      </Text>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            ) : null}
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
