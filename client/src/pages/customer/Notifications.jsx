import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Flex, HStack, VStack, Text, Heading, Button, Card, Badge, Spinner,
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import { notificationsService } from '../../services/notificationsService';
import websocketService from '../../services/websocketService';

const TYPE_LABELS = {
  order_update: '🛵 Estado de orden',
  new_review: '⭐ Nueva reseña',
  shop_approved: '✅ Pastelería aprobada',
  shop_rejected: '❌ Pastelería rechazada',
  shop_suspended: '🚫 Pastelería suspendida',
  report_resolved: '📋 Reporte resuelto',
  new_order: '🆕 Nueva orden',
  payment_confirmed: '💳 Pago confirmado',
};

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    /* audio not supported */
  }
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [newNotifIds, setNewNotifIds] = useState(new Set());
  const toastTimer = useRef(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await notificationsService.getByUser(user.uid);
      const list = Array.isArray(res) ? res : res?.data || [];
      setNotifs(list);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const unsub = websocketService.onNewNotification((data) => {
      setNotifs(prev => {
        const exists = prev.some(n => n.id === data.id);
        if (exists) return prev;
        return [data, ...prev];
      });
      setNewNotifIds(prev => new Set(prev).add(data.id));
      playNotificationSound();
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setNewNotifIds(new Set()), 4000);
    });
    return () => {
      unsub();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [user]);

  const handleMarkRead = async (id) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) { console.error(e); }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead(user.uid);
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await notificationsService.delete(id);
      setNotifs((prev) => prev.filter((n) => n.id !== id));
    } finally { setDeleting(null); }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <Box maxW="700px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading as="h2" fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }} fontWeight={700} color="brand.700">
            Notificaciones
          </Heading>
          <Box h="3px" w="60px" bgGradient="linear(90deg, accent.500, brand.500)" borderRadius="full" mt={3} />
        </Box>
        {notifs.some((n) => !n.isRead) && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
            Marcar todas como leídas
          </Button>
        )}
      </Flex>

      {loading ? (
        <VStack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Box key={i} h="64px" w="full" bg="warmGray.200" borderRadius="lg" />
          ))}
        </VStack>
      ) : notifs.length === 0 ? (
        <Box textAlign="center" py={16} color="warmGray.500" fontFamily="body">
          <Text fontSize="40px" mb={3}>🔔</Text>
          <Text fontSize="sm">No tienes notificaciones</Text>
        </Box>
      ) : (
        <VStack spacing={2}>
          {notifs.map((n) => (
            <Card
              key={n.id}
              variant="elevated"
              p={3.5}
              w="full"
              borderLeft={n.isRead ? '1px' : '3px'}
              borderLeftColor={n.isRead ? 'warmGray.200' : 'accent.500'}
              bg={n.isRead ? 'white' : 'green.50'}
            >
              <Flex justify="space-between" align="flex-start">
                <Box flex={1} cursor="pointer" onClick={() => handleMarkRead(n.id)}>
                  <HStack spacing={2} mb={1} flexWrap="wrap">
                    <Text fontSize="xs" fontWeight={600} color="warmGray.800">
                      {TYPE_LABELS[n.type] || n.type}
                    </Text>
                    {!n.isRead && (
                      <Badge colorScheme="accent" variant="subtle" borderRadius="full" px={2} fontSize="2xs">
                        Nueva
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="xs" color="warmGray.500" lineHeight={1.5}>{n.message}</Text>
                  <Text fontSize="2xs" color="warmGray.400" mt={1} display="inline-block">
                    {formatDate(n.createdAt)}
                  </Text>
                </Box>
                <Button
                  size="xs"
                  variant="danger"
                  ml={3}
                  flexShrink={0}
                  onClick={() => handleDelete(n.id)}
                  isLoading={deleting === n.id}
                  loadingText="..."
                >
                  Eliminar
                </Button>
              </Flex>
            </Card>
          ))}
        </VStack>
      )}
    </Box>
  );
}
