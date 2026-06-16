import { useNavigate, useLocation } from 'react-router-dom';
import { HStack, Button } from '@chakra-ui/react';

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
    <HStack spacing={1} flexWrap="wrap">
      {links.map((link) => {
        const active = isActive(link.path);
        return (
          <Button
            key={link.path}
            size="sm"
            variant={active ? 'solid' : 'ghost'}
            colorScheme={active ? 'brand' : undefined}
            bg={active ? 'brand.500' : undefined}
            color={active ? 'white' : 'warmGray.600'}
            borderRadius="full"
            fontWeight={active ? 600 : 500}
            fontSize="xs"
            whiteSpace="nowrap"
            onClick={() => navigate(link.path)}
            _hover={!active ? { color: 'brand.500' } : undefined}
          >
            {link.label}
          </Button>
        );
      })}
    </HStack>
  );
}
