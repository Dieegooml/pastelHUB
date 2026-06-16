import { useEffect, useState } from 'react';
import {
  Box, Flex, Text, Card, SimpleGrid, useToast, Progress
} from '@chakra-ui/react';
import { ordersService } from '../../services/ordersService';
import { STATUS_TRANSLATIONS, STATUS_COLORS } from './ownerConstants';
import PropTypes from 'prop-types';

export default function OwnerTabSummary({ selectedShop, setError, setSuccess }) {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (!selectedShop?.id) return;
    setSummaryLoading(true);
    ordersService.getSummary(selectedShop.id, 90)
      .then((res) => setSummary(res || null))
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [selectedShop]);

  return (
    <Box>
      {summaryLoading ? (
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
          {[1, 2, 3, 4].map(i => <Box key={i} h="100px" bg="warmGray.100" borderRadius="xl" />)}
        </SimpleGrid>
      ) : !summary || summary.totalOrders === 0 ? (
        <Box textAlign="center" py={16} color="warmGray.400">
          <Text fontSize="4xl" mb={3}>📊</Text>
          <Text fontSize="md">No hay datos de ventas para mostrar en los últimos 90 días</Text>
        </Box>
      ) : (
        <>
          <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4} mb={8}>
            {[
              { label: 'Ingresos totales', value: `S/ ${summary.totalRevenue.toFixed(2)}`, color: 'accent.500' },
              { label: 'Órdenes totales', value: summary.totalOrders, color: 'brand.700' },
              { label: 'Ticket promedio', value: `S/ ${summary.avgOrderValue.toFixed(2)}`, color: '#e65100' },
              { label: 'Hoy', value: `S/ ${summary.revenueToday.toFixed(2)}`, color: '#2196f3' },
              { label: 'Esta semana', value: `S/ ${summary.revenueThisWeek.toFixed(2)}`, color: '#7c3aed' },
              { label: 'Este mes', value: `S/ ${summary.revenueThisMonth.toFixed(2)}`, color: '#f59e0b' },
            ].map((card) => (
              <Card key={card.label} p={4} borderLeft="3px solid" borderLeftColor={card.color}>
                <Text fontSize="xs" color="warmGray.400" mb={1}>{card.label}</Text>
                <Text fontSize="xl" fontWeight={700} fontFamily="heading" color={card.color}>{card.value}</Text>
              </Card>
            ))}
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
            <Card p={5}>
              <Text fontWeight={600} fontSize="md" color="brand.700" mb={4}>Ventas diarias (últimos {summary.dailySales?.length || 0} días)</Text>
              {summary.dailySales?.length > 0 ? (
                <Flex align="flex-end" gap="3px" h="160px" pb={5} overflowX="auto">
                  {(() => {
                    const max = Math.max(...summary.dailySales.map((d) => d.revenue), 1);
                    return summary.dailySales.map((d, i) => (
                      <Flex key={i} direction="column" align="center" flexShrink={0} w="28px">
                        <Box
                          w="20px"
                          h={`${Math.max((d.revenue / max) * 140, 4)}px`}
                          bgGradient="linear(180deg, accent.500, #145e46)"
                          borderRadius="sm"
                          transition="height 0.3s"
                          title={`${d.date}: S/ ${d.revenue.toFixed(2)}`}
                          position="relative"
                        >
                          {d.revenue > 0 && (
                            <Text fontSize="2xs" position="absolute" bottom="calc(100% + 4px)" left="50%" transform="translateX(-50%)" whiteSpace="nowrap" color="warmGray.400">
                              S/{Math.round(d.revenue)}
                            </Text>
                          )}
                        </Box>
                        <Text fontSize="2xs" color="warmGray.400" mt={1} transform="rotate(-45deg)" transformOrigin="left center" whiteSpace="nowrap">
                          {d.date.slice(5)}
                        </Text>
                      </Flex>
                    ));
                  })()}
                </Flex>
              ) : (
                <Text textAlign="center" py={10} color="warmGray.400" fontSize="sm">Sin datos</Text>
              )}
            </Card>

            <Card p={5}>
              <Text fontWeight={600} fontSize="md" color="brand.700" mb={4}>Ingresos mensuales</Text>
              {summary.monthlyRevenue?.length > 0 ? (
                <Flex align="flex-end" gap={2} h="160px" pb={5}>
                  {(() => {
                    const max = Math.max(...summary.monthlyRevenue.map((m) => m.revenue), 1);
                    return summary.monthlyRevenue.map((m, i) => (
                      <Flex key={i} direction="column" align="center" flex={1}>
                        <Box
                          w="100%" maxW="50px"
                          h={`${Math.max((m.revenue / max) * 140, 4)}px`}
                          bgGradient="linear(180deg, #7c3aed, #5b21b6)"
                          borderRadius="sm"
                          transition="height 0.3s"
                          title={`${m.month}: S/ ${m.revenue.toFixed(2)}`}
                        />
                        <Text fontSize="2xs" color="warmGray.400" mt={1} whiteSpace="nowrap">{m.month}</Text>
                      </Flex>
                    ));
                  })()}
                </Flex>
              ) : (
                <Text textAlign="center" py={10} color="warmGray.400" fontSize="sm">Sin datos</Text>
              )}
            </Card>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
            <Card p={5}>
              <Text fontWeight={600} fontSize="md" color="brand.700" mb={4}>Órdenes por estado</Text>
              <Flex direction="column" gap={3}>
                {Object.entries(summary.ordersByStatus || {}).map(([status, count]) => {
                  const total = summary.totalOrders || 1;
                  const pct = ((count / total) * 100).toFixed(1);
                  const c = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#999' };
                  return (
                    <Box key={status}>
                      <Flex justify="space-between" fontSize="sm" mb={1}>
                        <Text color="warmGray.700">{STATUS_TRANSLATIONS[status] || status}</Text>
                        <Text color="warmGray.500">{count} ({pct}%)</Text>
                      </Flex>
                      <Progress value={parseFloat(pct)} size="sm" borderRadius="full" bg="warmGray.100"
                        sx={{ '& > div': { bg: c.color, borderRadius: 'full' } }} />
                    </Box>
                  );
                })}
              </Flex>
            </Card>

            <Card p={5}>
              <Text fontWeight={600} fontSize="md" color="brand.700" mb={4}>Productos más vendidos</Text>
              {summary.topProducts?.length > 0 ? (
                <Flex direction="column" gap={3}>
                  {(() => {
                    const maxQty = Math.max(...summary.topProducts.map((p) => p.quantity), 1);
                    return summary.topProducts.map((p, i) => (
                      <Box key={p.product_id || i}>
                        <Flex justify="space-between" align="center" mb={1}>
                          <Flex align="center" gap={2}>
                            <Text fontSize="xs" fontWeight={600} color="warmGray.400" w="16px">#{i + 1}</Text>
                            <Text fontSize="sm" color="warmGray.700">{p.name}</Text>
                          </Flex>
                          <Text fontSize="sm" fontWeight={600} color="accent.500">{p.quantity} vendidos</Text>
                        </Flex>
                        <Progress value={(p.quantity / maxQty) * 100} size="sm" borderRadius="full" bg="warmGray.100"
                          sx={{ '& > div': { bgGradient: 'linear(90deg, accent.500, #145e46)', borderRadius: 'full' } }} />
                      </Box>
                    ));
                  })()}
                </Flex>
              ) : (
                <Text textAlign="center" py={10} color="warmGray.400" fontSize="sm">Sin datos de productos</Text>
              )}
            </Card>
          </SimpleGrid>

          {summary.revenueByMethod && Object.keys(summary.revenueByMethod).length > 0 && (
            <Card p={5}>
              <Text fontWeight={600} fontSize="md" color="brand.700" mb={4}>Ingresos por método de pago</Text>
              <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
                {Object.entries(summary.revenueByMethod).map(([method, amount]) => (
                  <Box key={method} textAlign="center" p={4} bg="warmGray.50" borderRadius="lg">
                    <Text fontSize="xl" mb={1}>
                      {method === 'yape' ? '📱' : method === 'plin' ? '📱' : method === 'card' ? '💳' : method === 'cash' ? '💵' : '❓'}
                    </Text>
                    <Text fontSize="xs" color="warmGray.400" mb={1} textTransform="capitalize">{method}</Text>
                    <Text fontSize="md" fontWeight={700} fontFamily="heading" color="brand.700">S/ {amount.toFixed(2)}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}

OwnerTabSummary.propTypes = {
  selectedShop: PropTypes.object,
  setError: PropTypes.func,
  setSuccess: PropTypes.func,
};
