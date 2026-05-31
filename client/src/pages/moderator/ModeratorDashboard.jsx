import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { colors, font } from '../../styles/theme';
import { supportService } from '../../services/supportService';
import { reportsService } from '../../services/reportsService';
import { reviewsService } from '../../services/reviewsService';
import ModeratorNav from './ModeratorNav';

const cardStyle = {
  padding: '20px',
  borderRadius: '12px',
  border: `1px solid ${colors.border}`,
  cursor: 'pointer',
  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
  flex: '1 1 180px',
  background: colors.white,
};

const stagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' } }),
};

export default function ModeratorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    openTickets: 0,
    inProgressTickets: 0,
    totalTickets: 0,
    openReports: 0,
    totalReports: 0,
    pendingReviews: 0,
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
      } catch {}
    })();
  }, []);

  const cards = [
    { label: 'Tickets abiertos', value: stats.openTickets, path: '/support?status=open', color: '#f59e0b' },
    { label: 'En progreso', value: stats.inProgressTickets, path: '/support?status=in_progress', color: '#3b82f6' },
    { label: 'Reportes abiertos', value: stats.openReports, path: '/admin/reports', color: '#ef4444' },
    { label: 'Reseñas pendientes', value: stats.pendingReviews, path: '/admin/reviews?status=pending', color: '#8b5cf6' },
    { label: 'Total tickets', value: stats.totalTickets, path: '/support', color: colors.primary },
    { label: 'Total reportes', value: stats.totalReports, path: '/admin/reports', color: '#6b7280' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontFamily: font.heading, fontSize: '24px', marginBottom: 4, color: colors.text }}>
        Panel de Moderador
      </h1>
      <p style={{ fontFamily: font.body, fontSize: '14px', color: colors.textSecondary, marginBottom: 24 }}>
        Gestión de tickets de soporte y moderación de contenido
      </p>

      <ModeratorNav />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        custom={0}
        style={{ marginTop: 24 }}
      >
        <h2 style={{ fontFamily: font.heading, fontSize: '18px', marginBottom: 16, color: colors.text }}>
          Resumen
        </h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              variants={stagger}
              custom={i + 1}
              style={cardStyle}
              onClick={() => navigate(card.path)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: font.heading, color: card.color }}>
                {card.value}
              </div>
              <div style={{ fontSize: '14px', color: colors.textSecondary, fontFamily: font.body, marginTop: 4 }}>
                {card.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
