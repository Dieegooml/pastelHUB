import { Box, Flex, Text, VStack, Heading, useMediaQuery } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import { PastelFadeIn, PastelSlideIn } from './UI';

const bullets = [
  { text: 'Múltiples pastelerías locales', icon: 'shop' },
  { text: 'Productos personalizables', icon: 'cake' },
  { text: 'Reseñas verificadas', icon: 'star' },
  { text: 'Entrega rápida y segura', icon: 'truck' },
  { text: 'Pagos 100% protegidos', icon: 'lock' },
];

function AuthLayout({ children }) {
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="white" p={6}>
        <Box w="full" maxW="400px">{children}</Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh">
      <PastelFadeIn duration={0.6}>
        <Flex
          w="45%"
          bg="brand.50"
          direction="column"
          align="center"
          justify="center"
          p={12}
          position="relative"
          overflow="hidden"
        >
          <Box
            position="absolute"
            bottom="-40px"
            right="-40px"
            w="280px"
            h="280px"
            borderRadius="50%"
            bg="rgba(29, 158, 117, 0.05)"
          />
          <Box
            position="absolute"
            top="-60px"
            left="-60px"
            w="200px"
            h="200px"
            borderRadius="50%"
            bg="rgba(45, 31, 31, 0.04)"
          />
          <Box
            position="absolute"
            top="30%"
            right="-80px"
            w="160px"
            h="160px"
            borderRadius="50%"
            bg="rgba(29, 158, 117, 0.03)"
          />

          <Box
            as="img"
            src="/pastelHUBlogo.png"
            alt="PastelHub"
            h="140px"
            mb={4}
            fallback={
              <Box w="120px" h="120px" borderRadius="xl" bg="brand.900" color="white" display="flex" alignItems="center" justifyContent="center" fontSize="48px" fontWeight={900} fontFamily="heading" mb={4}>
                P
              </Box>
            }
          />
          <Heading fontFamily="heading" fontSize="42px" fontWeight={700} color="brand.900" textAlign="center">
            PastelHub
          </Heading>
          <Text fontSize="md" color="warmGray.500" textAlign="center" maxW="300px" mt={3} mb={6}>
            Descubre las mejores pastelerías artesanales
          </Text>
          <Box w="60px" h="2px" bg="brand.200" mb={8} />

          <VStack spacing={3} w="full" maxW="350px">
            {bullets.map((b, i) => (
              <PastelSlideIn key={i} direction="left" delay={i * 0.1}>
                <Flex
                  align="center"
                  gap={3}
                  bg="rgba(255,255,255,0.6)"
                  p="10px 16px"
                  borderRadius="lg"
                  backdropFilter="blur(4px)"
                  w="full"
                >
                  <Flex w="22px" h="22px" color="accent.500" align="center" justify="center">
                    {b.icon === 'shop' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                      </svg>
                    )}
                    {b.icon === 'cake' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    )}
                    {b.icon === 'star' && (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    )}
                    {b.icon === 'truck' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                      </svg>
                    )}
                    {b.icon === 'lock' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    )}
                  </Flex>
                  <Text fontSize="sm" color="brand.700" fontWeight={500}>{b.text}</Text>
                </Flex>
              </PastelSlideIn>
            ))}
          </VStack>
        </Flex>
      </PastelFadeIn>

      <Flex
        w="55%"
        bg="white"
        align="center"
        justify="center"
        p={12}
      >
        <PastelSlideIn direction="right" duration={0.5}>
          <Box w="full" maxW="400px">
            {children}
          </Box>
        </PastelSlideIn>
      </Flex>
    </Flex>
  );
}

AuthLayout.propTypes = {
  children: PropTypes.node,
};

export default AuthLayout;
