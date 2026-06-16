import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiService';
import { authService } from '../../services/authService';
import AuthLayout from '../../components/AuthLayout';
import { PastelPageTransition } from '../../components/UI';
import {
  Box, Flex, Heading, Text, Input, Button, FormControl, FormLabel,
  InputGroup, InputLeftElement, InputRightElement,
  Alert, AlertIcon, Divider, Checkbox,
} from '@chakra-ui/react';
import { font } from '../../styles/theme';

const FIREBASE_ERRORS = {
  'auth/user-not-found': 'No existe una cuenta con este correo',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/invalid-credential': 'Correo o contraseña incorrectos',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
};

function IconMail({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconLock({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function IconEye({ off }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {off ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

function IconGoogle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function Login() {
  const { user, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!email) errs.email = 'El correo es obligatorio';
    else if (/\s/.test(email)) errs.email = 'El correo no debe contener espacios';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Ingresa un correo válido';
    if (!password) errs.password = 'La contraseña es obligatoria';
    else if (/\s/.test(password)) errs.password = 'La contraseña no debe contener espacios';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    setError('');
    setFieldErrors({});
    if (!validate()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await api.post('/auth/sync', {});
      await refreshUser();
      navigate('/');
    } catch (err) {
      const code = err.code;
      setError(FIREBASE_ERRORS[code] || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setError('Ingresa un correo válido');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      const code = err.code;
      if (code === 'auth/user-not-found') {
        setError('No existe una cuenta con este correo');
      } else {
        setError('Error al enviar el correo. Intenta más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      await api.post('/auth/sync', {});
      await refreshUser();
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        await signOut(auth).catch(() => {});
        setError('Error al iniciar sesión con Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebook = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, facebookProvider);
      await api.post('/auth/sync', {});
      await refreshUser();
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        await signOut(auth).catch(() => {});
        setError('Error al iniciar sesión con Facebook');
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldBorderColor = (name) => (fieldErrors[name] ? 'rose.400' : 'brand.200');
  const fieldFocusColor = (name) => (fieldErrors[name] ? 'rose.400' : 'accent.500');
  const iconColor = (name) => (fieldErrors[name] ? '#F63E5E' : '#9A8F80');

  return (
    <AuthLayout>
      <PastelPageTransition>
        <Box
          bg="white"
          borderRadius="2xl"
          boxShadow={{ base: 'none', md: '0 4px 24px rgba(0,0,0,0.06)' }}
          p={{ base: 0, md: 8 }}
        >
          <Heading as="h1" fontFamily="heading" fontSize={{ base: '24px', md: '32px' }} fontWeight={700} color="brand.900" m={0}>
            Bienvenido de nuevo
          </Heading>
          <Text fontFamily="body" fontSize="14px" color="warmGray.500" mt={1} mb={6}>
            Inicia sesión en tu cuenta
          </Text>

          {error && (
            <Alert status="error" variant="left-accent" borderRadius="10px" mb={4} fontSize="14px">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {user ? (
            <Box textAlign="center" py={4}>
              <Text fontFamily="body" fontSize="14px" color="warmGray.600" mb={4}>
                Ya tienes una sesión activa como <strong>{user.email}</strong>
              </Text>
              <Button
                variant="outline"
                w="100%"
                h="50px"
                onClick={async () => { await signOut(auth); }}
              >
                Cerrar sesión
              </Button>
            </Box>
          ) : resetMode ? (
            <Box>
              {resetSent ? (
                <Alert status="success" variant="left-accent" borderRadius="10px" mb={4} flexDir="column" alignItems="center" textAlign="center">
                  <AlertIcon />
                  <Text fontWeight={600} fontSize="14px">Correo enviado</Text>
                  <Text fontSize="13px">Revisa tu bandeja de entrada. Si no aparece, revisa la carpeta de spam.</Text>
                </Alert>
              ) : (
                <Box>
                  <Text fontFamily="body" fontSize="14px" color="warmGray.500" mb={5}>
                    Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                  </Text>
                  <FormControl mb={5}>
                    <FormLabel fontFamily="body" fontSize="12px" fontWeight={500} color="warmGray.600" mb={1.5}>
                      Correo electrónico
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement h="48px">
                        <Box w="18px" h="18px" color="warmGray.400"><IconMail /></Box>
                      </InputLeftElement>
                      <Input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        isDisabled={loading}
                        h="48px"
                        fontSize="14px"
                        pl="44px"
                        focusBorderColor="accent.500"
                        _placeholder={{ color: 'warmGray.300' }}
                      />
                    </InputGroup>
                  </FormControl>
                  <Button
                    variant="primary"
                    w="100%"
                    h="50px"
                    fontSize="15px"
                    onClick={handleResetPassword}
                    isLoading={loading}
                    loadingText="Enviando..."
                    isDisabled={loading}
                  >
                    {!loading && 'Enviar enlace de recuperación'}
                  </Button>
                </Box>
              )}
              <Text textAlign="center" mt={4}>
                <Box
                  as="span"
                  fontFamily="body"
                  fontSize="13px"
                  color="accent.500"
                  cursor="pointer"
                  fontWeight={600}
                  onClick={() => { setResetMode(false); setResetSent(false); setError(''); setResetEmail(''); }}
                >
                  Volver al inicio de sesión
                </Box>
              </Text>
            </Box>
          ) : (
            <Box>
              <FormControl isInvalid={!!fieldErrors.email} mb={4.5}>
                <FormLabel fontFamily="body" fontSize="12px" fontWeight={500} color="warmGray.600" mb={1.5}>
                  Correo electrónico
                </FormLabel>
                <InputGroup>
                  <InputLeftElement h="48px">
                    <Box w="18px" h="18px" color={iconColor('email')} transition="color 0.2s"><IconMail /></Box>
                  </InputLeftElement>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    maxLength={254}
                    onChange={(e) => { setEmail(e.target.value.replace(/\s/g, '')); setFieldErrors((p) => ({ ...p, email: '' })); }}
                    isDisabled={loading}
                    isInvalid={!!fieldErrors.email}
                    h="48px"
                    fontSize="14px"
                    pl="44px"
                    borderColor={fieldBorderColor('email')}
                    focusBorderColor={fieldFocusColor('email')}
                    _placeholder={{ color: 'warmGray.300' }}
                  />
                </InputGroup>
                {fieldErrors.email && (
                  <Text fontSize="12px" color="rose.500" mt={1} transition="all 0.2s">
                    {fieldErrors.email}
                  </Text>
                )}
              </FormControl>

              <FormControl isInvalid={!!fieldErrors.password} mb={4.5}>
                <FormLabel fontFamily="body" fontSize="12px" fontWeight={500} color="warmGray.600" mb={1.5}>
                  Contraseña
                </FormLabel>
                <InputGroup>
                  <InputLeftElement h="48px">
                    <Box w="18px" h="18px" color={iconColor('password')} transition="color 0.2s"><IconLock /></Box>
                  </InputLeftElement>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    maxLength={254}
                    onChange={(e) => { setPassword(e.target.value.replace(/\s/g, '')); setFieldErrors((p) => ({ ...p, password: '' })); }}
                    isDisabled={loading}
                    isInvalid={!!fieldErrors.password}
                    h="48px"
                    fontSize="14px"
                    pl="44px"
                    pr="44px"
                    borderColor={fieldBorderColor('password')}
                    focusBorderColor={fieldFocusColor('password')}
                    _placeholder={{ color: 'warmGray.300' }}
                  />
                  <InputRightElement h="48px">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      lineHeight={1}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      minW="auto"
                      h="auto"
                      p={2}
                    >
                      <Box w="20px" h="20px" color="warmGray.400">
                        <IconEye off={showPassword} />
                      </Box>
                    </Button>
                  </InputRightElement>
                </InputGroup>
                {fieldErrors.password && (
                  <Text fontSize="12px" color="rose.500" mt={1}>{fieldErrors.password}</Text>
                )}
              </FormControl>

              <Flex justify="space-between" align="center" mt={-1} mb={5}>
                <Checkbox
                  isChecked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  isDisabled={loading}
                  colorScheme="accent"
                  size="md"
                  fontFamily="body"
                  fontSize="13px"
                  color="brand.700"
                  iconColor="white"
                >
                  Recordarme
                </Checkbox>
                <Text
                  as="span"
                  fontFamily="body"
                  fontSize="13px"
                  color="accent.500"
                  cursor="pointer"
                  fontWeight={600}
                  onClick={() => { setResetMode(true); setResetEmail(email); setError(''); }}
                >
                  ¿Olvidaste tu contraseña?
                </Text>
              </Flex>

              <Button
                w="100%"
                h="50px"
                fontSize="15px"
                onClick={handleLogin}
                isLoading={loading}
                loadingText="Iniciando sesión..."
                isDisabled={loading}
                spinnerPlacement="start"
              >
                Iniciar sesión
              </Button>
            </Box>
          )}

          <Flex align="center" my={5}>
            <Divider />
            <Text px={4} fontFamily="body" fontSize="13px" color="warmGray.500" whiteSpace="nowrap">
              o continúa con
            </Text>
            <Divider />
          </Flex>

          <Flex direction="column" gap={3}>
            <Button
              variant="outline"
              w="100%"
              h="50px"
              onClick={handleGoogle}
              isDisabled={loading}
              leftIcon={<IconGoogle />}
              _hover={{ bg: 'warmGray.50', borderColor: 'brand.300', transform: 'translateY(-1px)' }}
              transition="all 0.2s"
            >
              Continuar con Google
            </Button>

            <Button
              variant="outline"
              w="100%"
              h="50px"
              onClick={handleFacebook}
              isDisabled={loading}
              leftIcon={<IconFacebook />}
              _hover={{ bg: 'warmGray.50', borderColor: 'brand.300', transform: 'translateY(-1px)' }}
              transition="all 0.2s"
            >
              Continuar con Facebook
            </Button>
          </Flex>

          <Text textAlign="center" fontFamily="body" fontSize="14px" color="warmGray.500" mt={6}>
            ¿No tienes cuenta?{' '}
            <Box as={Link} to="/register" color="accent.500" fontWeight={600}>
              Regístrate aquí
            </Box>
          </Text>
        </Box>
      </PastelPageTransition>
    </AuthLayout>
  );
}
