import { useNavigate, useLocation } from 'react-router-dom';
import { VStack, Box, Text } from '@chakra-ui/react';

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
    <Box
      as="nav"
      bg="white"
      borderRadius="xl"
      border="1px solid"
      borderColor="brand.100"
      overflow="hidden"
      w="full"
    >
      <VStack spacing={0} align="stretch">
        {links.map((link) => {
          const active = isActive(link.path);
          return (
            <Box
              key={link.path}
              as="button"
              textAlign="left"
              w="full"
              onClick={() => navigate(link.path)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(link.path) }}
              cursor="pointer"
              borderLeft="3px solid"
              borderLeftColor={active ? 'accent.500' : 'transparent'}
              bg={active ? 'brand.50' : 'transparent'}
              color={active ? 'brand.800' : 'warmGray.600'}
              fontWeight={active ? 600 : 500}
              fontSize="14px"
              px={5}
              py={2.5}
              transition="all 0.15s"
              _hover={!active ? { bg: 'warmGray.50', color: 'brand.600' } : undefined}
              _focus={{ boxShadow: 'outline' }}
            >
              <Text>{link.label}</Text>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}
