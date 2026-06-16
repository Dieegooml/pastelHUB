import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Flex, HStack, VStack, Text, Heading, Button, Textarea, Divider,
} from '@chakra-ui/react';
import { ordersService } from '../../services/ordersService';
import { reviewsService } from '../../services/reviewsService';
import { paymentsService } from '../../services/paymentsService';
import {
  PastelPageHeader, PastelCard, PastelDataCard, PastelStatusBadge,
  PastelSkeletonPage, PastelErrorState,
} from '../../components/UI';

const STATUS_TRANSLATIONS = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'Preparando',
  on_the_way: 'En camino', delivered: 'Entregado', cancelled: 'Cancelado',
};

const STATUS_COLORS = {
  pending: 'yellow',
  confirmed: 'green',
  preparing: 'blue',
  on_the_way: 'orange',
  delivered: 'green',
  cancelled: 'red',
};

const STATUS_ICONS = {
  pending: '⏳', confirmed: '✅', preparing: '👨‍🍳',
  on_the_way: '🚚', delivered: '📦', cancelled: '❌',
};

const ORDERED_STATUSES = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered'];

const PAYMENT_METHOD_LABELS = {
  card: '💳 Tarjeta', cash: '💵 Efectivo', yape: '📱 Yape', plin: '📱 Plin',
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [review, setReview] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await ordersService.getById(id);
        setOrder(data);
        const rev = await reviewsService.getByOrder(id).catch(() => null);
        if (rev) setReview(rev);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleSubmitReview = async () => {
    setSubmitting(true);
    setReviewError('');
    try {
      const created = await reviewsService.create({ orderId: id, shopId: order.shop?.shop_id, rating: reviewRating, comment: reviewComment });
      setReviewSuccess('¡Reseña enviada!');
      setReviewComment('');
      if (created?.id) setReview(created);
    } catch (e) {
      console.error(e);
      setReviewError('Error al enviar la reseña');
    } finally { setSubmitting(false); }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Estás seguro de cancelar esta orden?')) return;
    setCancelling(true);
    try {
      await ordersService.cancelOrder(id);
      const data = await ordersService.getById(id);
      setOrder(data);
    } catch (e) {
      console.error(e);
      setReviewError('Error al cancelar la orden');
    } finally { setCancelling(false); }
  };

  if (loading) {
    return (
      <Box maxW="700px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
        <PastelSkeletonPage cards={4} />
      </Box>
    );
  }

  if (!order) {
    return (
      <PastelErrorState
        title="Orden no encontrada"
        message="No pudimos encontrar la orden solicitada"
        onBack={() => navigate('/my-orders')}
      />
    );
  }

  const currentIdx = ORDERED_STATUSES.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <Box maxW="700px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <PastelPageHeader
        title={`Orden #${order.id?.slice(0, 8)}`}
        description={order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('es-PE') : new Date(order.createdAt).toLocaleString('es-PE')}
        icon="📋"
        breadcrumbs={[{ label: 'Mis órdenes', href: '/my-orders' }]}
        actions={
          <HStack spacing={2}>
            <PastelStatusBadge status={order.status} />
            {order.status === 'pending' && (
              <Button size="xs" variant="danger" onClick={handleCancel} isLoading={cancelling} loadingText="...">
                Cancelar
              </Button>
            )}
          </HStack>
        }
      />

      {!isCancelled && (
        <PastelCard variant="elevated">
          <HStack spacing={0} w="full">
            {ORDERED_STATUSES.map((s, idx) => (
              <Flex key={s} align="center" flex={1}>
                <Flex
                  w="32px" h="32px" borderRadius="full"
                  align="center" justify="center"
                  fontSize="sm" fontWeight={700}
                  bg={idx <= currentIdx ? `${STATUS_COLORS[s]}.100` : 'warmGray.100'}
                  color={idx <= currentIdx ? `${STATUS_COLORS[s]}.600` : 'warmGray.300'}
                  border="2px"
                  borderColor={idx <= currentIdx ? `${STATUS_COLORS[s]}.600` : 'warmGray.200'}
                  flexShrink={0}
                >
                  {idx + 1}
                </Flex>
                <Text ml={2} fontSize="xs" fontWeight={600} color={idx <= currentIdx ? 'warmGray.800' : 'warmGray.400'} whiteSpace="nowrap">
                  {STATUS_TRANSLATIONS[s]}
                </Text>
                {idx < ORDERED_STATUSES.length - 1 && (
                  <Box flex={1} h="2px" mx={2} bg={idx < currentIdx ? `${STATUS_COLORS[s]}.600` : 'warmGray.200'} />
                )}
              </Flex>
            ))}
          </HStack>
        </PastelCard>
      )}

      <Flex gap={4} mb={6} flexDir={{ base: 'column', md: 'row' }}>
        <PastelDataCard title="Pastelería" icon="🏪" data={{ 'Nombre': order.shop?.name || '—' }} flex={1} />
        <PastelDataCard title="Contacto" icon="📞" data={{
          'Nombre': order.customer?.name || '—',
          'Email': order.customer?.email || '',
          'Teléfono': order.customer?.phone || '',
        }} flex={1} />
      </Flex>

      {order.payment?.method && (
        <PastelDataCard title="Pago" icon="💳" mb={4} data={{
          'Método': PAYMENT_METHOD_LABELS[order.payment.method] || order.payment.method,
          'Estado': order.payment.status === 'paid' ? 'Pagado' : order.payment.status === 'failed' ? 'Fallido' : order.payment.status === 'refunded' ? 'Reembolsado' : 'Pendiente',
          ...(order.payment.transaction_ref ? { 'Ref': order.payment.transaction_ref } : {}),
        }} columns={2} />
      )}

      <PastelCard title="Productos" variant="elevated">
        <VStack spacing={2.5} align="stretch">
          {order.items?.map((item, i) => (
            <Flex key={i} justify="space-between" align="center">
              <Text fontSize="sm" fontFamily="body" color="warmGray.800">
                <Box as="strong">{item.quantity}x</Box> {item.name}
              </Text>
              <Text fontSize="sm" fontWeight={600} fontFamily="body" color="brand.700">
                S/ {(item.price_at_purchase * item.quantity).toFixed(2)}
              </Text>
            </Flex>
          ))}
        </VStack>
        <Divider my={4} borderColor="warmGray.200" />
        <Flex justify="space-between" fontSize="xs" fontFamily="body" mb={1}>
          <Text color="warmGray.500">Subtotal</Text>
          <Text color="warmGray.500">S/ {(order.totals?.subtotal || 0).toFixed(2)}</Text>
        </Flex>
        <Flex justify="space-between" fontSize="xs" fontFamily="body" mb={1}>
          <Text color="warmGray.500">Delivery</Text>
          <Text color="warmGray.500">S/ {(order.totals?.delivery_fee || 0).toFixed(2)}</Text>
        </Flex>
        <Flex justify="space-between" fontSize="xl" fontWeight={700} fontFamily="heading" color="brand.700" mt={2} pt={3} borderTop="1px" borderColor="warmGray.200">
          <Text>Total</Text>
          <Text>S/ {(order.totals?.total || 0).toFixed(2)}</Text>
        </Flex>
      </PastelCard>

      {order.status_history?.length > 0 && (
        <PastelCard title="Historial" variant="elevated">
          <HStack spacing={2} flexWrap="wrap">
            {order.status_history.map((s, i) => (
              <PastelStatusBadge key={i} status={s} />
            ))}
          </HStack>
        </PastelCard>
      )}

      {review?.rating !== undefined && (
        <PastelCard title="Tu reseña" variant="elevated">
          <Text fontSize="2xl" mb={2}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Box as="span" key={star} color={star <= review.rating ? 'yellow.400' : 'warmGray.200'} mr={0.5}>★</Box>
            ))}
          </Text>
          {review.comment && <Text fontFamily="body" fontSize="sm" color="warmGray.800" lineHeight={1.6}>{review.comment}</Text>}
          {review.reply_text && (
            <Box mt={3} p={3} bg="warmGray.100" borderRadius="lg" borderLeft="3px" borderLeftColor="accent.500">
              <Text fontSize="xs" fontWeight={600} color="accent.600" fontFamily="body" mb={1}>Respuesta del dueño:</Text>
              <Text fontFamily="body" fontSize="xs" color="warmGray.800">{review.reply_text}</Text>
            </Box>
          )}
        </PastelCard>
      )}

      {order.status === 'delivered' && (!review?.rating || review.rating === 0) && (
        <PastelCard title={review?.rating === 0 ? 'Editar reseña' : 'Calificar esta orden'} variant="elevated">
          {reviewError && (
            <Text color="rose.500" fontSize="xs" fontFamily="body" mb={2}>{reviewError}</Text>
          )}
          {reviewSuccess && (
            <Text color="green.600" fontSize="xs" fontFamily="body" mb={2}>{reviewSuccess}</Text>
          )}
          <Box mb={3}>
            <Text fontSize="xs" color="warmGray.500" fontFamily="body" display="block" mb={1.5}>Puntuación</Text>
            <HStack spacing={1}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="unstyled"
                  fontSize="28px"
                  color={star <= reviewRating ? 'yellow.400' : 'warmGray.200'}
                  cursor="pointer"
                  minW="auto"
                  h="auto"
                  p={0}
                  _hover={{ transform: 'scale(1.2)' }}
                  onClick={() => setReviewRating(star)}
                >
                  ★
                </Button>
              ))}
            </HStack>
          </Box>
          <Box mb={3}>
            <Text fontSize="xs" color="warmGray.500" fontFamily="body" display="block" mb={1.5}>Comentario (opcional)</Text>
            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              fontSize="xs"
              minH="80px"
              resize="vertical"
              placeholder="Cuenta tu experiencia..."
            />
          </Box>
          <Button
            variant="primary"
            onClick={handleSubmitReview}
            isLoading={submitting}
            loadingText="Enviando..."
          >
            Enviar reseña
          </Button>
        </PastelCard>
      )}
    </Box>
  );
}
