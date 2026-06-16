import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Flex, Heading, Text, Card, SimpleGrid, useToast
} from '@chakra-ui/react';
import ModeratorNav from './ModeratorNav';
import { supportService } from '../../services/supportService';
import { reportsService } from '../../services/reportsService';
import { reviewsService } from '../../services/reviewsService';

export default function ModeratorDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [stats, setStats] = useState({
    openTickets: 0, inProgressTickets: 0, totalTickets: 0,
    openReports: 0, totalReports: 0, pendingReviews: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const [ticketRes, reportRes, reviewRes] = await Promise.all([
          supportService.getTickets(),
          reportsService.getAll().catch(() => ({ data: [] })),
          reviewsService.getByStatus('pending').catch(() => ({ data: [] })),
        ]);
        const tickets = ticketRes.data || [];
        const reports = reportRes.data || [];
        const reviews = reviewRes.data || [];
        setStats({
          openTickets: tickets.filter(t => t.status === 'open').length,
          inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
          totalTickets: tickets.length,
          openReports: reports.filter(r => r.status === 'open').length,
          totalReports: reports.length,
          pendingReviews: reviews.length,
        });
      } catch (e) { console.error('Failed to load moderator stats:', e); }
    })();
  }, []);

  const cards = [
    { label: 'Tickets abiertos', value: stats.openTickets, path: '/support?status=open', color: '#f59e0b' },
    { label: 'En progreso', value: stats.inProgressTickets, path: '/support?status=in_progress', color: '#3b82f6' },
    { label: 'Reportes abiertos', value: stats.openReports, path: '/admin/reports', color: '#ef4444' },
    { label: 'Reseñas pendientes', value: stats.pendingReviews, path: '/admin/reviews?status=pending', color: '#8b5cf6' },
    { label: 'Total tickets', value: stats.totalTickets, path: '/support', color: '#1D9E75' },
    { label: 'Total reportes', value: stats.totalReports, path: '/admin/reports', color: '#6b7280' },
  ];

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <Heading fontSize="2xl" fontWeight={700} color="brand.700" mb={1}>Panel de Moderador</Heading>
      <Text fontSize="sm" color="warmGray.500" mb={6}>Gestión de tickets de soporte y moderación de contenido</Text>

      <ModeratorNav />

      <Box mt={6}>
        <Heading fontSize="lg" fontWeight={600} color="brand.700" mb={4}>Resumen</Heading>
        <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4}>
          {cards.map((card) => (
            <Card
              key={card.label}
              variant="interactive"
              p={5}
              cursor="pointer"
              onClick={() => navigate(card.path)}
              _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
              transition="all 0.2s"
            >
              <Text fontSize="3xl" fontWeight={700} fontFamily="heading" color={card.color}>
                {card.value}
              </Text>
              <Text fontSize="sm" color="warmGray.500" mt={1}>{card.label}</Text>
            </Card>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
}
