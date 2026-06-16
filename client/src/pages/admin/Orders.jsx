import { useEffect, useState, Fragment } from 'react';
import {
  Box, Flex, Heading, Text, Button, Select, Table, Thead, Tbody, Tr, Th, Td,
  Tag, Alert, AlertIcon, useToast, Input, HStack, SimpleGrid
} from '@chakra-ui/react';
import AdminNav from './AdminNav';
import { PastelPageHeader, PastelCard, PastelStatusBadge, PastelEmptyState, PastelFilterBar, PastelSkeletonTable } from '../../components/UI';
import { ordersService } from '../../services/ordersService';
import { reviewsService } from '../../services/reviewsService';

const STATUSES = ['all', 'pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed'];

const STATUS_TRANSLATIONS = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'Preparando',
  on_the_way: 'En camino', delivered: 'Entregado', cancelled: 'Cancelado',
};

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [newStatus, setNewStatus] = useState({});
  const [newPaymentStatus, setNewPaymentStatus] = useState({});
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [replyForm, setReplyForm] = useState({});
  const [reviewMap, setReviewMap] = useState({});

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = filter === 'all'
        ? await ordersService.getAll()
        : await ordersService.getByStatus(filter);
      setOrders(data?.data || []);
    } catch (e) {
      console.error(e);
      setError('Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [filter]);

  const handleUpdateStatus = async (id) => {
    if (!newStatus[id]) return;
    try {
      await ordersService.updateStatus(id, newStatus[id]);
      setNewStatus((p) => ({ ...p, [id]: '' }));
      setSuccess('Estado actualizado');
      loadOrders();
    } catch (e) {
      console.error(e);
      setError('Error al actualizar estado');
    }
  };

  const handleUpdatePaymentStatus = async (id) => {
    if (!newPaymentStatus[id]) return;
    try {
      await ordersService.updatePaymentStatus(id, newPaymentStatus[id]);
      setNewPaymentStatus((p) => ({ ...p, [id]: '' }));
      setSuccess('Estado de pago actualizado');
      loadOrders();
    } catch (e) {
      console.error(e);
      setError('Error al actualizar estado de pago');
    }
  };

  const handleAddReview = async (id) => {
    const order = orders.find((o) => o.id === id);
    try {
      const created = await reviewsService.create({ orderId: id, shopId: order?.shop?.shop_id || '', rating: reviewForm.rating, comment: reviewForm.comment });
      setReviewForm({ rating: 5, comment: '' });
      setReviewMap((p) => ({ ...p, [id]: created }));
      setSuccess('Reseña agregada');
    } catch (e) {
      console.error(e);
      setError('Error al agregar reseña');
    }
  };

  const handleReplyReview = async (id) => {
    if (!replyForm[id]) return;
    const review = reviewMap[id];
    if (!review?.id) { setError('No se encontró la reseña para responder'); return; }
    try {
      const updated = await reviewsService.reply(review.id, replyForm[id]);
      setReplyForm((p) => ({ ...p, [id]: '' }));
      setReviewMap((p) => ({ ...p, [id]: { ...review, ...updated } }));
      setSuccess('Respuesta agregada');
    } catch (e) {
      console.error(e);
      setError('Error al responder reseña');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta orden?')) return;
    try { await ordersService.delete(id); setSuccess('Orden eliminada'); loadOrders(); }
    catch (e) { console.error(e); setError('Error al eliminar la orden'); }
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!reviewMap[id]) {
      try { const review = await reviewsService.getByOrder(id); setReviewMap((p) => ({ ...p, [id]: review })); }
      catch (e) { console.error(e); }
    }
  };

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filterOptions = STATUSES.map((s) => ({
    value: s,
    label: s === 'all' ? 'Todas' : STATUS_TRANSLATIONS[s],
  }));

  const paymentBadge = (ps) => {
    return <PastelStatusBadge status={ps} />;
  };

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <PastelPageHeader
        title="Órdenes"
        actions={
          <Tag bg="warmGray.100" color={orders.length > 0 ? 'brand.700' : 'warmGray.500'} borderRadius="full" fontSize="sm" fontWeight={500}>{orders.length}</Tag>
        }
      />
      <Box mb={4}><AdminNav /></Box>

      {success && <Alert status="success" mb={4} borderRadius="lg">{success}</Alert>}
      {error && <Alert status="error" mb={4} borderRadius="lg">{error}</Alert>}

      <PastelFilterBar options={filterOptions} active={filter} onChange={setFilter} />

      {loading ? (
        <PastelSkeletonTable rows={5} cols={8} />
      ) : (
        <PastelCard p={0} overflow="hidden">
          {orders.length === 0 ? (
            <PastelEmptyState
              icon="📋"
              title={filter === 'all' ? 'No hay órdenes que mostrar' : `No hay órdenes con estado "${STATUS_TRANSLATIONS[filter] || filter}"`}
              description={filter === 'all' ? 'Aún no se han registrado órdenes en el sistema' : 'Intenta cambiar el filtro para ver más resultados'}
            />
          ) : (
            <Box overflowX="auto">
              <Table variant="pastel">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th display={{ base: 'none', md: 'table-cell' }}>Fecha</Th>
                    <Th>Cliente</Th>
                    <Th display={{ base: 'none', md: 'table-cell' }}>Pastelería</Th>
                    <Th>Total</Th>
                    <Th>Estado</Th>
                    <Th display={{ base: 'none', md: 'table-cell' }}>Pago</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {orders.map((o) => (
                    <Fragment key={o.id}>
                      <Tr _hover={{ bg: 'warmGray.100' }} cursor="pointer" onClick={() => toggleExpand(o.id)}>
                        <Td fontFamily="mono" fontSize="sm">
                          {o.id?.slice(0, 8)}…
                          <Text as="span" cursor="pointer" ms={1} onClick={(e) => { e.stopPropagation(); handleCopy(o.id); }} title="Copiar ID">
                            📋
                            {copiedId === o.id && (
                              <Text as="span" bg="brand.700" color="white" px={1} py={0.5} borderRadius="sm" fontSize="2xs" ms={1} pos="absolute">
                                Copiado!
                              </Text>
                            )}
                          </Text>
                        </Td>
                        <Td display={{ base: 'none', md: 'table-cell' }} fontSize="sm" color="warmGray.500" title={o.created_at ? formatDate(o.created_at) : undefined}>
                          {formatDate(o.created_at)}
                        </Td>
                        <Td fontSize="sm">{o.customer?.name || (o.customer?.user_id ? `${o.customer.user_id.slice(0, 8)}…` : '—')}</Td>
                        <Td display={{ base: 'none', md: 'table-cell' }} fontSize="sm">{o.shop?.name || (o.shop?.shop_id ? `${o.shop.shop_id.slice(0, 8)}…` : '—')}</Td>
                        <Td fontSize="sm" fontWeight={600} color="brand.700">S/ {(o.totals?.total || 0).toFixed(2)}</Td>
                        <Td><PastelStatusBadge status={o.status} /></Td>
                        <Td display={{ base: 'none', md: 'table-cell' }}>{paymentBadge(o.payment?.status || 'pending')}</Td>
                        <Td onClick={(e) => e.stopPropagation()}>
                          <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDelete(o.id)}>Eliminar</Button>
                        </Td>
                      </Tr>
                      {expandedId === o.id && (
                        <Tr>
                          <Td colSpan={8} bg="warmGray.50" p={4}>
                            <Box borderTop="1px solid" borderColor="warmGray.200" pt={4}>
                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} fontSize="sm">
                                <Box lineHeight={2}>
                                  <Text><strong>Cliente:</strong> {o.customer?.name || '—'}</Text>
                                  <Text><strong>User ID:</strong> <Text as="code" fontSize="xs" color="warmGray.500">{o.customer?.user_id || '—'}</Text></Text>
                                  <Text><strong>Pastelería:</strong> {o.shop?.name || '—'}</Text>
                                  <Text><strong>Shop ID:</strong> <Text as="code" fontSize="xs" color="warmGray.500">{o.shop?.shop_id || '—'}</Text></Text>
                                </Box>
                                <Box lineHeight={2}>
                                  <Text><strong>Subtotal:</strong> S/ {(o.totals?.subtotal || 0).toFixed(2)}</Text>
                                  <Text><strong>Delivery:</strong> S/ {(o.totals?.delivery_fee || 0).toFixed(2)}</Text>
                                  <Text><strong>Total:</strong> <Text as="span" fontWeight={600} color="brand.700">S/ {(o.totals?.total || 0).toFixed(2)}</Text></Text>
                                  <Text><strong>Método pago:</strong> {o.payment?.method || '—'}</Text>
                                </Box>
                              </SimpleGrid>

                              {o.items?.length > 0 && (
                                <Box mt={3}>
                                  <Text fontWeight={600} fontSize="sm">Items:</Text>
                                  <HStack spacing={2} mt={1} flexWrap="wrap">
                                    {o.items.map((item, idx) => (
                                      <Tag key={idx} bg="white" borderRadius="lg" border="1px solid" borderColor="warmGray.200">
                                        <strong>{item.quantity}x</strong> {item.name} — S/ {(item.price_at_purchase || 0).toFixed(2)}
                                      </Tag>
                                    ))}
                                  </HStack>
                                </Box>
                              )}

                              {o.status_history?.length > 0 && (
                                <Box mt={3}>
                                  <Text fontWeight={600} fontSize="sm">Historial:</Text>
                                  <HStack spacing={1} mt={1} flexWrap="wrap">
                                    {o.status_history.map((s, idx) => (
                                      <Fragment key={idx}><PastelStatusBadge status={s} /></Fragment>
                                    ))}
                                  </HStack>
                                </Box>
                              )}

                              <HStack spacing={4} mt={4} align="flex-end" flexWrap="wrap">
                                <HStack spacing={2} align="flex-end">
                                  <Box>
                                    <Text fontSize="xs" color="warmGray.500">Estado</Text>
                                    <Select size="sm" value={newStatus[o.id] || ''} onChange={(e) => setNewStatus((p) => ({ ...p, [o.id]: e.target.value }))}>
                                      <option value="">—</option>
                                      {STATUSES.filter((s) => s !== 'all').map((s) => (
                                        <option key={s} value={s}>{STATUS_TRANSLATIONS[s]}</option>
                                      ))}
                                    </Select>
                                  </Box>
                                  <Button size="sm" colorScheme="brand" onClick={() => handleUpdateStatus(o.id)}>Actualizar</Button>
                                </HStack>
                                <HStack spacing={2} align="flex-end">
                                  <Box>
                                    <Text fontSize="xs" color="warmGray.500">Estado pago</Text>
                                    <Select size="sm" value={newPaymentStatus[o.id] || ''} onChange={(e) => setNewPaymentStatus((p) => ({ ...p, [o.id]: e.target.value }))}>
                                      <option value="">—</option>
                                      {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </Select>
                                  </Box>
                                  <Button size="sm" colorScheme="brand" onClick={() => handleUpdatePaymentStatus(o.id)}>Actualizar</Button>
                                </HStack>
                              </HStack>

                              {(() => {
                                const r = reviewMap[o.id];
                                if (r?.rating || r?.comment) {
                                  return (
                                    <Box mt={4} p={4} bg="white" borderRadius="lg" border="1px solid" borderColor="warmGray.200">
                                      <Text fontWeight={600} fontSize="sm">Reseña:</Text>
                                      <Text fontSize="sm" mt={1}>{'⭐'.repeat(r.rating)} {r.comment && `— ${r.comment}`}</Text>
                                      {r.ownerReply && <Text fontSize="sm" mt={1} color="warmGray.500"><strong>Respuesta:</strong> {r.ownerReply}</Text>}
                                      {!r.ownerReply && (
                                        <HStack spacing={2} mt={2} align="flex-end">
                                          <Box flex={1}>
                                            <Text fontSize="xs" color="warmGray.500">Responder</Text>
                                            <Input size="sm" value={replyForm[o.id] || ''} onChange={(e) => setReplyForm((p) => ({ ...p, [o.id]: e.target.value }))} placeholder="Escribe una respuesta..." />
                                          </Box>
                                          <Button size="sm" colorScheme="accent" onClick={() => handleReplyReview(o.id)}>Responder</Button>
                                        </HStack>
                                      )}
                                    </Box>
                                  );
                                }
                                if (!r && o.status === 'delivered') {
                                  return (
                                    <Box mt={4} p={4} bg="white" borderRadius="lg" border="1px solid" borderColor="warmGray.200">
                                      <Text fontWeight={600} fontSize="sm">Agregar reseña:</Text>
                                      <HStack spacing={3} mt={2} align="flex-end" flexWrap="wrap">
                                        <Box>
                                          <Text fontSize="xs" color="warmGray.500">Rating</Text>
                                          <Select size="sm" value={reviewForm.rating} onChange={(e) => setReviewForm((p) => ({ ...p, rating: Number(e.target.value) }))}>
                                            {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{'⭐'.repeat(r)}</option>)}
                                          </Select>
                                        </Box>
                                        <Box flex={1} minW="150px">
                                          <Text fontSize="xs" color="warmGray.500">Comentario</Text>
                                          <Input size="sm" value={reviewForm.comment} onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))} placeholder="Comentario..." />
                                        </Box>
                                        <Button size="sm" colorScheme="accent" onClick={() => handleAddReview(o.id)}>Agregar</Button>
                                      </HStack>
                                    </Box>
                                  );
                                }
                                return null;
                              })()}
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
