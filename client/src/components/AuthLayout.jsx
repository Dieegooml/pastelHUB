import { useState, useEffect } from 'react';
import { Box, Flex, Text, VStack, Heading, useMediaQuery } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import { PastelFadeIn, PastelSlideIn } from './UI';

const testimonials = [
  {
    text: 'Los mejores postres artesanales los encuentro aquí. Siempre fresco y delicioso.',
    name: 'María G.',
    role: 'Cliente frecuente',
  },
  {
    text: 'Descubrí pastelerías locales increíbles que no conocía. Todo en un solo lugar.',
    name: 'Carlos L.',
    role: 'Cliente verificada',
  },
  {
    text: 'Pido para cada ocasión especial. Servicio puntual y calidad excepcional.',
    name: 'Ana R.',
    role: 'Usuario Premium',
  },
];

const GRADIENT_BG = 'linear-gradient(135deg, #2D1810 0%, #6B4226 50%, #2D1810 100%)';

function DecorativeBackground() {
  return (
    <Box position="absolute" inset={0} overflow="hidden">
      <Box position="absolute" top="-80px" right="-80px" w="400px" h="400px" borderRadius="50%" bg="radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)" />
      <Box position="absolute" bottom="-100px" left="-100px" w="300px" h="300px" borderRadius="50%" bg="radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)" />
      <Box position="absolute" top="20%" left="-60px" w="200px" h="200px" borderRadius="50%" bg="radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)" />
      <Box position="absolute" bottom="30%" right="-40px" w="150px" h="150px" borderRadius="50%" bg="radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)" />
    </Box>
  );
}

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

function TestimonialCarousel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % testimonials.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const t = testimonials[idx];

  return (
    <Box
      w="full"
      maxW="350px"
      bg="rgba(255,255,255,0.06)"
      borderRadius="xl"
      p={5}
      backdropFilter="blur(8px)"
      border="1px solid"
      borderColor="rgba(255,255,255,0.08)"
    >
      <Text fontSize="sm" color="whiteAlpha.800" fontStyle="italic" lineHeight={1.6}>
        &ldquo;{t.text}&rdquo;
      </Text>
      <Flex mt={3} align="center" gap={2}>
        <Box w="6px" h="6px" borderRadius="full" bg="accent.400" />
        <Text fontSize="12px" color="whiteAlpha.700" fontWeight={600}>{t.name}</Text>
        <Text fontSize="11px" color="whiteAlpha.500">&mdash; {t.role}</Text>
      </Flex>
      <Flex mt={3} gap={1.5} justify="center">
        {testimonials.map((_, i) => (
          <Box
            key={i}
            w={i === idx ? '20px' : '6px'}
            h="6px"
            borderRadius="full"
            bg={i === idx ? 'accent.400' : 'rgba(255,255,255,0.2)'}
            transition="all 0.4s ease"
            cursor="pointer"
            onClick={() => setIdx(i)}
          />
        ))}
      </Flex>
    </Box>
  );
}

function BrandContent({ compact }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      p={{ base: compact ? 6 : 10, md: 12 }}
      position="relative"
      overflow="hidden"
      minH={compact ? 'auto' : '100%'}
    >
      <DecorativeBackground />

      <Box
        as="img"
        src="/pastelHUBlogo.png"
        alt="PastelHub"
        h={{ base: '90px', md: '130px' }}
        mb={4}
        fallback={
          <Box w="80px" h="80px" borderRadius="xl" bg="white" color="#2D1F1F" display="flex" alignItems="center" justifyContent="center" fontSize="40px" fontWeight={900} fontFamily="heading" mb={3}>
            P
          </Box>
        }
      />
      <Heading fontFamily="heading" fontSize={{ base: '28px', md: '40px' }} fontWeight={700} color="white" textAlign="center" lineHeight="1.15">
        PastelHub
      </Heading>
      <Text fontSize={{ base: '13px', md: '15px' }} color="whiteAlpha.500" textAlign="center" maxW="280px" mt={1.5} mb={compact ? 4 : 6}>
        Descubre las mejores pastelerías artesanales
      </Text>

      <Box w="50px" h="2px" bg="linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" mb={6} />

      <VStack spacing={2.5} w="full" maxW="350px">
        {['shop', 'cake', 'star', 'truck', 'lock'].slice(0, compact ? 3 : 5).map((icon, i) => (
          <Flex
            key={i}
            align="center"
            gap={3}
            bg="rgba(255,255,255,0.08)"
            p="10px 16px"
            borderRadius="lg"
            w="full"
            backdropFilter="blur(4px)"
          >
            <RenderIcon icon={icon} />
            <Text fontSize={{ base: '12px', md: 'sm' }} color="whiteAlpha.800" fontWeight={500}>
              {['Múltiples pastelerías locales', 'Productos personalizables', 'Reseñas verificadas', 'Entrega rápida y segura', 'Pagos 100% protegidos'][i]}
            </Text>
          </Flex>
        ))}
      </VStack>

      {!compact && (
        <Box mt={6} w="full" maxW="350px">
          <TestimonialCarousel />
        </Box>
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
        <Flex w="45%" bg={GRADIENT_BG} direction="column" align="center" justify="center" position="relative">
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
