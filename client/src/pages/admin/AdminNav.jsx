import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { colors, font } from '../../styles/theme';

const links = [
  { path: '/admin', label: 'Dashboard' },
  { path: '/admin/users', label: 'Usuarios' },
  { path: '/admin/customers', label: 'Clientes' },
  { path: '/admin/shops', label: 'Pastelerías' },
  { path: '/admin/orders', label: 'Órdenes' },
  { path: '/admin/reviews', label: 'Reseñas' },
  { path: '/admin/reports', label: 'Reportes' },
  { path: '/admin/notifications', label: 'Notificaciones' },
  { path: '/admin/payments', label: 'Pagos' },
  { path: '/admin/promotions', label: 'Promociones' },
  { path: '/admin/invoices', label: 'Boletas' },
  { path: '/admin/chat', label: 'Chat' },
];

export default function AdminNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap',
      position: 'relative',
    }}>
      {links.map((link) => {
        const active = isActive(link.path);
        return (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            style={{
              position: 'relative',
              padding: '8px 14px',
              border: 'none',
              borderRadius: '99px',
              fontSize: '12px',
              fontWeight: active ? 600 : 500,
              fontFamily: font.body,
              cursor: 'pointer',
              background: 'transparent',
              color: active ? colors.primary : colors.textSecondary,
              transition: 'color 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!active) e.target.style.color = colors.primary;
            }}
            onMouseLeave={(e) => {
              if (!active) e.target.style.color = colors.textSecondary;
            }}
          >
            {active && (
              <motion.div
                layoutId="admin-tab"
                style={{
                  position: 'absolute', inset: 0,
                  background: colors.bgBeige,
                  borderRadius: '99px',
                  border: `1px solid ${colors.border}`,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>{link.label}</span>
          </button>
        );
      })}
    </div>
  );
}
