import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Text, VStack, Divider, Stack } from '@chakra-ui/react';

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  if (['/login', '/register'].includes(location.pathname)) return null;

  const linkProps = {
    fontSize: 'sm',
    color: 'warmGray.300',
    cursor: 'pointer',
    _hover: { color: 'white' },
    transition: 'color 0.2s',
    bg: 'none',
    border: 'none',
    p: 0,
    textAlign: 'left',
    lineHeight: 2,
  };

  return (
    <Box
      as="footer"
      bg="brand.900"
      px={{ base: 6, md: 12 }}
      py={{ base: 8, md: 12 }}
      mt="auto"
    >
      <Box maxW="1200px" mx="auto">
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={{ base: 8, md: 12 }}
          justify="space-between"
        >
          <Box flex="1 1 280px">
            <Text fontFamily="heading" fontSize="2xl" fontWeight={700} color="white" mb={2}>
              PastelHub
            </Text>
            <Text fontSize="sm" color="warmGray.500" lineHeight={1.7}>
              Las mejores pastelerías locales en un solo lugar.
              <br />Disfruta de postres artesanales hechos con amor.
            </Text>
          </Box>

          <Box>
            <Text fontFamily="heading" fontSize="md" fontWeight={600} color="white" mb={3}>
              Navegación
            </Text>
            <VStack align="flex-start" spacing={0}>
              <Box as="button" onClick={() => navigate('/')} {...linkProps}>Inicio</Box>
              <Box as="button" onClick={() => navigate('/cart')} {...linkProps}>Carrito</Box>
              {user && (
                <Box as="button" onClick={() => navigate('/my-orders')} {...linkProps}>Mis Órdenes</Box>
              )}
            </VStack>
          </Box>

          <Box>
            <Text fontFamily="heading" fontSize="md" fontWeight={600} color="white" mb={3}>
              Soporte
            </Text>
            <VStack align="flex-start" spacing={0}>
              {user ? (
                <>
                  <Box as="button" onClick={() => navigate('/support')} {...linkProps}>Mis Tickets</Box>
                  <Box as="button" onClick={() => navigate('/support/new')} {...linkProps}>Crear Ticket</Box>
                </>
              ) : (
                <Box as="button" onClick={() => navigate('/login')} {...linkProps}>Iniciar Sesión</Box>
              )}
              {user && (
                <Text fontSize="sm" color="warmGray.600" cursor="default">
                  Hola, {user.full_name || user.email?.split('@')[0] || ''}
                </Text>
              )}
            </VStack>
          </Box>
        </Stack>

        <Divider borderColor="rgba(255,255,255,0.08)" my={6} />

        <Text fontSize="xs" color="warmGray.600" textAlign="center">
          &copy; {new Date().getFullYear()} PastelHub. Todos los derechos reservados.
        </Text>
      </Box>
    </Box>
  );
}
