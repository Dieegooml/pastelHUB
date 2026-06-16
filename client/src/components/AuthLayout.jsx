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

const GRADIENT_BG = 'linear-gradient(145deg, #2D1F1F 0%, #1D9E75 100%)';

function RenderIcon({ icon }) {
  const svg = {
    shop: (
      <>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </>
    ),
    cake: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    truck: (
      <>
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </>
    ),
    lock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
  };

  return (
    <Flex w="22px" h="22px" color="#4ADE80" align="center" justify="center">
      <svg
        viewBox="0 0 24 24"
        fill={icon === 'star' ? 'currentColor' : 'none'}
        stroke={icon === 'star' ? undefined : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="20"
        height="20"
      >
        {svg[icon]}
      </svg>
    </Flex>
  );
}

function BrandContent({ compact }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      p={{ base: compact ? 5 : 10, md: 12 }}
      position="relative"
      overflow="hidden"
      minH={compact ? 'auto' : '100%'}
    >
      <Box position="absolute" bottom="-40px" right="-40px" w="280px" h="280px" borderRadius="50%" bg="rgba(255,255,255,0.05)" />
      <Box position="absolute" top="-60px" left="-60px" w="200px" h="200px" borderRadius="50%" bg="rgba(255,255,255,0.04)" />
      <Box position="absolute" top="30%" right="-80px" w="160px" h="160px" borderRadius="50%" bg="rgba(255,255,255,0.03)" />

      <Box
        as="img"
        src="/pastelHUBlogo.png"
        alt="PastelHub"
        h={{ base: '80px', md: '120px' }}
        mb={3}
        fallback={
          <Box w="80px" h="80px" borderRadius="xl" bg="white" color="#2D1F1F" display="flex" alignItems="center" justifyContent="center" fontSize="40px" fontWeight={900} fontFamily="heading" mb={3}>
            P
          </Box>
        }
      />
      <Heading fontFamily="heading" fontSize={{ base: '24px', md: '38px' }} fontWeight={700} color="white" textAlign="center" lineHeight="1.2">
        PastelHub
      </Heading>
      <Text fontSize={{ base: '12px', md: '15px' }} color="rgba(255,255,255,0.6)" textAlign="center" maxW="260px" mt={2} mb={compact ? 3 : 6}>
        Descubre las mejores pastelerías artesanales
      </Text>
      <Box w="50px" h="2px" bg="rgba(255,255,255,0.3)" mb={compact ? 3 : 6} />

      {!compact && (
        <VStack spacing={2.5} w="full" maxW="320px">
          {bullets.map((b, i) => (
            <Flex
              key={i}
              align="center"
              gap={3}
              bg="rgba(255,255,255,0.08)"
              p="10px 16px"
              borderRadius="lg"
              backdropFilter="blur(4px)"
              w="full"
            >
              <RenderIcon icon={b.icon} />
              <Text fontSize={{ base: '12px', md: '14px' }} color="rgba(255,255,255,0.8)" fontWeight={500}>
                {b.text}
              </Text>
            </Flex>
          ))}
        </VStack>
      )}
    </Flex>
  );
}

function AuthLayout({ children }) {
  const [isLg] = useMediaQuery('(min-width: 1024px)');
  const [isMobile] = useMediaQuery('(max-width: 640px)');

  if (isMobile) {
    return (
      <Flex minH="100vh" direction="column" bg="#fff">
        <Box bg={GRADIENT_BG}>
          <BrandContent compact />
        </Box>
        <Flex flex={1} align="flex-start" justify="center" px={5} py={6}>
          <Box w="full" maxW="420px">
            {children}
          </Box>
        </Flex>
      </Flex>
    );
  }

  if (!isLg) {
    return (
      <Flex minH="100vh" direction="column" bg="#fff">
        <Box bg={GRADIENT_BG}>
          <BrandContent compact />
        </Box>
        <Flex flex={1} align="center" justify="center" px={6} py={8}>
          <Box w="full" maxW="440px">
            {children}
          </Box>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh">
      <PastelFadeIn duration={0.6}>
        <Flex w="480px" minW="420px" bg={GRADIENT_BG} direction="column" align="center" justify="center">
          <BrandContent />
        </Flex>
      </PastelFadeIn>
      <Flex
        flex={1}
        bg="white"
        align="center"
        justify="center"
        px={8}
        py={10}
        overflowY="auto"
      >
        <PastelSlideIn direction="right" duration={0.5}>
          <Box w="full" maxW="420px">
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
