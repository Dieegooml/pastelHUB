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
  InputGroup, InputRightElement,
} from '@chakra-ui/react';
import { font } from '../../styles/theme';

const FIREBASE_ERRORS = {
  'auth/user-not-found': 'No existe una cuenta con este correo',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/invalid-credential': 'Correo o contraseña incorrectos',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
};

export default function Login() {
  const { user, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusField, setFocusField] = useState(null);
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

  return (
    <AuthLayout>
      <PastelPageTransition>
      <Box w="full">
      <Heading as="h1" fontFamily="heading" fontSize={{ base: '22px', md: '30px' }} fontWeight={700} color="#2D1F1F" m={0}>
        Bienvenido de nuevo
      </Heading>
      <Text fontFamily="body" fontSize={{ base: '13px', md: '14px' }} color="#888" mt={1} mb={5}>
        Inicia sesión en tu cuenta
      </Text>

      {error && (
        <Flex
          bg="#FEF2F2"
          color="#DC2626"
          px={4}
          py={3}
          borderRadius="10px"
          fontSize="14px"
          fontFamily={font.body}
          mb={4}
          align="center"
          gap={2}
        >
          <Box flexShrink={0} w="18px" h="18px" color="#DC2626">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </Box>
          <Text fontSize="14px" color="#DC2626">{error}</Text>
        </Flex>
      )}

      {user ? (
        <Box textAlign="center" py={4}>
          <Text fontFamily={font.body} fontSize="14px" color="#555" mb={4}>
            Ya tienes una sesión activa como <strong>{user.email}</strong>
          </Text>
          <Button
            w="100%" h="48px" fontSize="15px" fontFamily={font.body}
            fontWeight={600} bg="#DC2626" color="#fff" border="none"
            borderRadius="99px" cursor="pointer"
            _hover={{ bg: '#B91C1C' }}
            onClick={async () => { await signOut(auth); }}
          >
            Cerrar sesión
          </Button>
        </Box>
      ) : resetMode ? (
        <>
          {resetSent ? (
            <Flex direction="column" align="center" bg="#ECFDF5" color="#16A34A" px={4} py={4} borderRadius="10px" mb={4} textAlign="center" fontFamily={font.body}>
              <Text fontWeight={600} fontSize="14px" color="#16A34A">Correo enviado</Text>
              <Text fontSize="13px" color="#16A34A" mt={1}>Revisa tu bandeja de entrada. Si no aparece, revisa la carpeta de spam.</Text>
            </Flex>
          ) : (
            <>
              <Text fontFamily="body" fontSize="14px" color="warmGray.500" mb={5}>
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </Text>
              <FormControl mb={5}>
                <FormLabel fontFamily={font.body} fontSize="12px" fontWeight={500} color="#555" mb={1.5}>
                  Correo electrónico
                </FormLabel>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  isDisabled={loading}
                  h="48px"
                  fontSize="14px"
                  fontFamily={font.body}
                  focusBorderColor="#1D9E75"
                  _placeholder={{ color: '#ccc' }}
                />
              </FormControl>
              <Button
                w="100%"
                h="50px"
                fontSize="15px"
                fontFamily={font.body}
                fontWeight={600}
                bg="#2D1F1F"
                color="#fff"
                border="none"
                borderRadius="99px"
                cursor="pointer"
                _hover={{ bg: '#4A3A3A' }}
                onClick={handleResetPassword}
                isLoading={loading}
                loadingText="Enviando..."
                isDisabled={loading}
              >
                {!loading && 'Enviar enlace de recuperación'}
              </Button>
            </>
          )}
          <Text textAlign="center" mt={4} fontFamily={font.body} fontSize="13px" color="#1D9E75" cursor="pointer" onClick={() => { setResetMode(false); setResetSent(false); setError(''); setResetEmail(''); }}>
            Volver al inicio de sesión
          </Text>
        </>
      ) : (
        <>
          <FormControl isInvalid={!!fieldErrors.email} mb={4}>
            <FormLabel fontFamily={font.body} fontSize="12px" fontWeight={500} color="#555" mb={1.5}>
              Correo electrónico
            </FormLabel>
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              maxLength={254}
              h="48px"
              fontSize="14px"
              fontFamily={font.body}
              onChange={(e) => { setEmail(e.target.value.replace(/\s/g, '')); setFieldErrors((p) => ({ ...p, email: '' })); }}
              onFocus={() => setFocusField('email')}
              onBlur={() => setFocusField(null)}
              isDisabled={loading}
              isInvalid={!!fieldErrors.email}
              focusBorderColor={fieldErrors.email ? '#EF4444' : '#1D9E75'}
              _placeholder={{ color: '#ccc' }}
            />
            {fieldErrors.email && (
              <Text fontSize="12px" color="#EF4444" mt={1} fontFamily={font.body}>{fieldErrors.email}</Text>
            )}
          </FormControl>

          <FormControl isInvalid={!!fieldErrors.password} mb={4}>
            <FormLabel fontFamily={font.body} fontSize="12px" fontWeight={500} color="#555" mb={1.5}>
              Contraseña
            </FormLabel>
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                maxLength={254}
                h="48px"
                fontSize="14px"
                fontFamily={font.body}
                onChange={(e) => { setPassword(e.target.value.replace(/\s/g, '')); setFieldErrors((p) => ({ ...p, password: '' })); }}
                onFocus={() => setFocusField('password')}
                onBlur={() => setFocusField(null)}
                isDisabled={loading}
                isInvalid={!!fieldErrors.password}
                focusBorderColor={fieldErrors.password ? '#EF4444' : '#1D9E75'}
                _placeholder={{ color: '#ccc' }}
                pr="44px"
              />
              <InputRightElement h="48px">
                <Button size="sm" variant="ghost" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} lineHeight={1} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  <Box w="20px" h="20px" color="#999">
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </Box>
                </Button>
              </InputRightElement>
            </InputGroup>
            {fieldErrors.password && (
              <Text fontSize="12px" color="#EF4444" mt={1} fontFamily={font.body}>{fieldErrors.password}</Text>
            )}
          </FormControl>

          <Text
            display="block"
            textAlign="right"
            fontFamily={font.body}
            fontSize="13px"
            color="#1D9E75"
            cursor="pointer"
            mt={-2}
            mb={5}
            onClick={() => { setResetMode(true); setResetEmail(email); setError(''); }}
          >
            ¿Olvidaste tu contraseña?
          </Text>

          <Button
            w="100%"
            h="48px"
            fontSize="15px"
            fontFamily={font.body}
            fontWeight={600}
            bg="#2D1F1F"
            color="#fff"
            border="none"
            borderRadius="99px"
            cursor="pointer"
            _hover={{ bg: '#4A3A3A' }}
            onClick={handleLogin}
            isLoading={loading}
            loadingText="Iniciando sesión..."
            isDisabled={loading}
          >
            {!loading && 'Iniciar sesión'}
          </Button>
        </>
      )}

      {!user && (
        <>
      <Flex align="center" my={5}>
        <Box flex={1} h="1px" bg="#E8DDD5" />
        <Text px={4} fontFamily={font.body} fontSize="13px" color="#888" whiteSpace="nowrap">
          o continúa con
        </Text>
        <Box flex={1} h="1px" bg="#E8DDD5" />
      </Flex>

      <Button
        w="100%"
        h="48px"
        fontSize="14px"
        fontFamily={font.body}
        fontWeight={500}
        bg="#fff"
        color="#333"
        border="1.5px solid #E8DDD5"
        borderRadius="99px"
        cursor="pointer"
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap="8px"
        _hover={{ bg: '#f9f9f9' }}
        onClick={handleGoogle}
        isDisabled={loading}
        leftIcon={
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        }
      >
        Continuar con Google
      </Button>

      <Button
        w="100%"
        h="48px"
        fontSize="14px"
        fontFamily={font.body}
        fontWeight={500}
        bg="#fff"
        color="#333"
        border="1.5px solid #E8DDD5"
        borderRadius="99px"
        cursor="pointer"
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap="8px"
        mt={3}
        _hover={{ bg: '#f9f9f9' }}
        onClick={handleFacebook}
        isDisabled={loading}
        leftIcon={
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        }
      >
        Continuar con Facebook
      </Button>

      <Text textAlign="center" fontFamily={font.body} fontSize="14px" color="#888" mt={6}>
        ¿No tienes cuenta?{' '}
        <Box as={Link} to="/register" color="#1D9E75" fontWeight={600} display="inline">
          Regístrate aquí
        </Box>
      </Text>
        </>
      )}
    </Box>
    </PastelPageTransition>
    </AuthLayout>
  );
}
