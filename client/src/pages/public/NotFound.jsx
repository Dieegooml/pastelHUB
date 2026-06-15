import { useNavigate } from 'react-router-dom';
import {
  PastelCard, PastelErrorState, PastelPageTransition,
} from '../../components/UI';
import {
  Box, Flex, Text, Button, Image,
} from '@chakra-ui/react';

const LINKS = [
  { label: 'Pastelerías', path: '/', icon: 'shop' },
  { label: 'Iniciar sesión', path: '/login', icon: 'login' },
  { label: 'Registrarse', path: '/register', icon: 'register' },
];

export default function NotFound() {
  const navigate = useNavigate();

  const linkIcons = {
    shop: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    login: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
    ),
    register: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
      </svg>
    ),
  };

  return (
    <PastelPageTransition>
      <Flex
        direction="column"
        justify="center"
        align="center"
        minH="100vh"
        bg="warmGray.50"
        fontFamily="body"
        p={5}
      >
        {/* Decorative dots */}
        <Flex gap={2} mb={6}>
          {['#e8ddd5', '#1d9e75', '#f59e0b', '#ef4444'].map(c => (
            <Box key={c} w="8px" h="8px" borderRadius="50%" bg={c} opacity={0.4} />
          ))}
        </Flex>

        <Image src="/pastelHUBlogo.png" alt="PastelHub" h="64px" mb={5} opacity={0.5} />

        <PastelCard variant="elevated" p={8} mb={6} maxW="500px" w="100%">
          <PastelErrorState
            title="404"
            message="La página que buscas no existe o fue movida."
            onBack={() => navigate('/')}
            backLabel="Ir al inicio"
          />
        </PastelCard>

        <Flex gap={3} flexWrap="wrap" justify="center" mb={6}>
          <Button
            variant="outline"
            borderRadius="99px"
            fontSize="14px"
            fontWeight={500}
            fontFamily="body"
            leftIcon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            }
            onClick={() => navigate(-1)}
          >
            Volver atrás
          </Button>
          {LINKS.map(link => (
            <Button
              key={link.path}
              variant="outline"
              borderRadius="99px"
              fontSize="14px"
              fontWeight={500}
              fontFamily="body"
              leftIcon={linkIcons[link.icon]}
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </Button>
          ))}
        </Flex>
      </Flex>
    </PastelPageTransition>
  );
}
