import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiService';
import { authService } from '../../services/authService';
import AuthLayout from '../../components/AuthLayout';
import { PastelPageTransition } from '../../components/UI';
import {
  Box, Flex, Heading, Text, Input, Button, FormControl, FormLabel,
  InputGroup, InputRightElement, Alert, AlertIcon, Divider,
} from '@chakra-ui/react';

const FIREBASE_ERRORS = {
  'auth/user-not-found': 'No existe una cuenta con este correo',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/invalid-credential': 'Correo o contraseña incorrectos',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
};

export default function Login() {
  const { refreshUser } = useAuth();
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
        setError('Error al iniciar sesión con Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <PastelPageTransition>
      <Heading as="h1" fontFamily="heading" fontSize={{ base: '28px', md: '32px' }} fontWeight={700} color="brand.900" m={0}>
        Bienvenido de nuevo
      </Heading>
      <Text fontFamily="body" fontSize="14px" color="warmGray.500" mt={2} mb={8}>
        Inicia sesión en tu cuenta
      </Text>

      {error && (
        <Alert status="error" variant="left-accent" borderRadius="10px" mb={4} fontSize="14px">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {resetMode ? (
        <>
          {resetSent ? (
            <Alert status="success" variant="left-accent" borderRadius="10px" mb={4} flexDir="column" alignItems="center" textAlign="center">
              <AlertIcon />
              <Text fontWeight={600} fontSize="14px">Correo enviado</Text>
              <Text fontSize="13px">Revisa tu bandeja de entrada. Si no aparece, revisa la carpeta de spam.</Text>
            </Alert>
          ) : (
            <>
              <Text fontFamily="body" fontSize="14px" color="warmGray.500" mb={5}>
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </Text>
              <FormControl mb={5}>
                <FormLabel fontFamily="body" fontSize="12px" fontWeight={500} color="warmGray.600" mb={1.5}>
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
                  focusBorderColor="accent.500"
                  _placeholder={{ color: 'warmGray.300' }}
                />
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
            </>
          )}
          <Text textAlign="center" mt={4}>
            <Box
              as="span"
              fontFamily="body"
              fontSize="13px"
              color="accent.500"
              cursor="pointer"
              onClick={() => { setResetMode(false); setResetSent(false); setError(''); setResetEmail(''); }}
            >
              Volver al inicio de sesión
            </Box>
          </Text>
        </>
      ) : (
        <>
          <FormControl isInvalid={!!fieldErrors.email} mb={5}>
            <FormLabel fontFamily="body" fontSize="12px" fontWeight={500} color="warmGray.600" mb={1.5}>
              Correo electrónico
            </FormLabel>
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              maxLength={254}
              onChange={(e) => { setEmail(e.target.value.replace(/\s/g, '')); setFieldErrors((p) => ({ ...p, email: '' })); }}
              onFocus={() => setFocusField('email')}
              onBlur={() => setFocusField(null)}
              isDisabled={loading}
              isInvalid={!!fieldErrors.email}
              focusBorderColor={fieldErrors.email ? 'red.500' : 'accent.500'}
              _placeholder={{ color: 'warmGray.300' }}
            />
            {fieldErrors.email && (
              <Text fontSize="12px" color="red.500" mt={1}>{fieldErrors.email}</Text>
            )}
          </FormControl>

          <FormControl isInvalid={!!fieldErrors.password} mb={5}>
            <FormLabel fontFamily="body" fontSize="12px" fontWeight={500} color="warmGray.600" mb={1.5}>
              Contraseña
            </FormLabel>
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                maxLength={254}
                onChange={(e) => { setPassword(e.target.value.replace(/\s/g, '')); setFieldErrors((p) => ({ ...p, password: '' })); }}
                onFocus={() => setFocusField('password')}
                onBlur={() => setFocusField(null)}
                isDisabled={loading}
                isInvalid={!!fieldErrors.password}
                focusBorderColor={fieldErrors.password ? 'red.500' : 'accent.500'}
                _placeholder={{ color: 'warmGray.300' }}
                pr="44px"
              />
              <InputRightElement>
                <Button size="sm" variant="ghost" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} lineHeight={1} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  <Box w="20px" h="20px" color="warmGray.400">
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
              <Text fontSize="12px" color="red.500" mt={1}>{fieldErrors.password}</Text>
            )}
          </FormControl>

          <Text
            as="span"
            display="block"
            textAlign="right"
            fontFamily="body"
            fontSize="13px"
            color="accent.500"
            cursor="pointer"
            mt={-3}
            mb={6}
            onClick={() => { setResetMode(true); setResetEmail(email); setError(''); }}
          >
            ¿Olvidaste tu contraseña?
          </Text>

          <Button
            variant="primary"
            w="100%"
            h="50px"
            fontSize="15px"
            onClick={handleLogin}
            isLoading={loading}
            loadingText="Iniciando sesión..."
            isDisabled={loading}
          >
            {!loading && 'Iniciar sesión'}
          </Button>
        </>
      )}

      <Flex align="center" my={5}>
        <Divider />
        <Text px={4} fontFamily="body" fontSize="13px" color="warmGray.500" whiteSpace="nowrap">
          o continúa con
        </Text>
        <Divider />
      </Flex>

      <Button
        variant="outline"
        w="100%"
        h="50px"
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

      <Text textAlign="center" fontFamily="body" fontSize="14px" color="warmGray.500" mt={6}>
        ¿No tienes cuenta?{' '}
        <Box as={Link} to="/register" color="accent.500" fontWeight={600}>
          Regístrate aquí
        </Box>
      </Text>
    </PastelPageTransition>
    </AuthLayout>
  );
}
