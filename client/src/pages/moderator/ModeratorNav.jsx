import { useNavigate, useLocation } from 'react-router-dom';
import { HStack, Button } from '@chakra-ui/react';

const links = [
  { path: '/moderator', label: 'Dashboard' },
  { path: '/moderator/users', label: 'Usuarios' },
  { path: '/support', label: 'Tickets' },
  { path: '/admin/reviews', label: 'Reseñas' },
  { path: '/admin/reports', label: 'Reportes' },
];

export default function ModeratorNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/moderator') return location.pathname === '/moderator';
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
