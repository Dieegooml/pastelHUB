import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, font } from '../../styles/theme';
import { supportService } from '../../services/supportService';
import ModeratorNav from './ModeratorNav';

const cardStyle = {
  padding: '20px',
  borderRadius: '12px',
  border: `1px solid ${colors.border}`,
  cursor: 'pointer',
  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
  flex: '1 1 200px',
};

export default function ModeratorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ open: 0, inProgress: 0, total: 0 });

  useEffect(() => {
    (async () => {
      try {
        const res = await supportService.getTickets();
        const tickets = res.data || [];
        setStats({
          open: tickets.filter(t => t.status === 'open').length,
          inProgress: tickets.filter(t => t.status === 'in_progress').length,
          total: tickets.length,
        });
      } catch { }
    })();
  }, []);

  const cards = [
    { label: 'Tickets abiertos', value: stats.open, path: '/support?status=open', color: '#f59e0b' },
    { label: 'En progreso', value: stats.inProgress, path: '/support?status=in_progress', color: '#3b82f6' },
    { label: 'Total tickets', value: stats.total, path: '/support', color: colors.primary },
    { label: 'Reseñas pendientes', value: '→', path: '/admin/reviews?status=pending', color: '#8b5cf6' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontFamily: font.title, fontSize: '24px', marginBottom: 4, color: colors.textPrimary }}>
        Panel de Moderador
      </h1>
      <p style={{ fontFamily: font.body, fontSize: '14px', color: colors.textSecondary, marginBottom: 24 }}>
        Gestión de tickets de soporte y moderación de contenido
      </p>

      <ModeratorNav />

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontFamily: font.title, fontSize: '18px', marginBottom: 16, color: colors.textPrimary }}>
          Resumen
        </h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {cards.map((card) => (
            <div
              key={card.label}
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
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: font.title, color: card.color }}>
                {card.value}
              </div>
              <div style={{ fontSize: '14px', color: colors.textSecondary, fontFamily: font.body, marginTop: 4 }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
