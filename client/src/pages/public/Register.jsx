import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiService';
import AuthLayout from '../../components/AuthLayout';
import { PastelPageTransition } from '../../components/UI';
import {
  Box, Flex, Heading, Text, Input, Button, FormControl, FormLabel,
  InputGroup, InputRightElement, Alert, AlertIcon, Divider, Checkbox,
} from '@chakra-ui/react';

const FIREBASE_ERRORS = {
  'auth/email-already-in-use': 'Este correo ya está registrado',
  'auth/weak-password': 'La contraseña es muy débil',
};

function getPasswordChecks(pw) {
  return {
    minChars: pw.length >= 8,
    hasUpper: /[A-Z]/.test(pw),
    hasLower: /[a-z]/.test(pw),
    hasNumber: /\d/.test(pw),
    noSpaces: !/\s/.test(pw),
    hasSpecial: /[!@#$%^&*]/.test(pw),
  };
}

function CheckItem({ ok, text }) {
  return (
    <Flex align="center" gap="6px" py="2px" color={ok ? 'accent.500' : 'warmGray.500'} fontSize="12px">
      <Box w="14px" h="14px" flexShrink={0}>
        {ok ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        )}
      </Box>
      <Text as="span">{text}</Text>
    </Flex>
  );
}

function PasswordChecklist({ password, show }) {
  const checks = getPasswordChecks(password);
  return (
    <Box
      bg="warmGray.50"
      border="1px solid"
      borderColor="warmGray.200"
      borderRadius="10px"
      p="10px 14px"
      mt={2}
      fontFamily="body"
      fontSize="12px"
      display={show ? 'block' : 'none'}
      opacity={show ? 1 : 0}
      transition="opacity 0.3s ease"
    >
      <Text fontWeight={600} color="warmGray.600" mb={1.5} fontSize="12px">
        La contraseña debe tener:
      </Text>
      <CheckItem ok={checks.minChars} text="Mínimo 8 caracteres" />
      <CheckItem ok={checks.hasUpper} text="Una letra mayúscula" />
      <CheckItem ok={checks.hasLower} text="Una letra minúscula" />
      <CheckItem ok={checks.hasNumber} text="Un número" />
      <CheckItem ok={checks.hasSpecial} text="Un carácter especial (opcional)" />
    </Box>
  );
}

function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: 'warmGray.200' };
  const checks = getPasswordChecks(pw);
  if (checks.minChars && checks.hasUpper && checks.hasLower && checks.hasNumber && checks.hasSpecial) return { level: 3, label: 'Fuerte', color: 'accent.500' };
  if (checks.minChars && checks.hasUpper && checks.hasLower && checks.hasNumber) return { level: 2, label: 'Media', color: '#F59E0B' };
  return { level: 1, label: 'Débil', color: 'red.500' };
}

const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

export default function Register() {
  const { refreshUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showChecklist, setShowChecklist] = useState(false);
  const navigate = useNavigate();

  const pwStrength = getPasswordStrength(password);

  const validate = () => {
    const errs = {};
    if (fullName.length < 3) errs.fullName = 'El nombre debe tener al menos 3 caracteres';
    else if (!NAME_REGEX.test(fullName)) errs.fullName = 'El nombre solo puede contener letras y espacios';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Ingresa un correo válido';
    if (/\s/.test(email)) errs.email = 'El correo no debe contener espacios';
    const checks = getPasswordChecks(password);
    if (!checks.minChars) errs.password = 'La contraseña debe tener al menos 8 caracteres';
    else if (!checks.hasUpper) errs.password = 'Debe contener al menos una mayúscula';
    else if (!checks.hasLower) errs.password = 'Debe contener al menos una minúscula';
    else if (!checks.hasNumber) errs.password = 'Debe contener al menos un número';
    if (/\s/.test(password)) errs.password = 'La contraseña no debe contener espacios';
    if (confirmPassword !== password) errs.confirmPassword = 'Las contraseñas no coinciden';
    if (!acceptTerms) errs.terms = 'Debes aceptar los términos';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    if (!validate()) return;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });
      await api.post('/auth/sync', { name: fullName });
      await refreshUser();
      navigate('/');
    } catch (err) {
      setError(FIREBASE_ERRORS[err.code] || 'Error al crear la cuenta');
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
        setError('Error al registrarse con Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const allChecksMet = Object.values(getPasswordChecks(password)).every(Boolean);

  return (
    <AuthLayout>
      <PastelPageTransition>
      <Heading as="h1" fontFamily="heading" fontSize={{ base: '28px', md: '32px' }} fontWeight={700} color="brand.900" m={0}>
        Crear una cuenta
      </Heading>
      <Text fontFamily="body" fontSize="14px" color="warmGray.500" mt={2} mb={7}>
        Únete a la comunidad PastelHub
      </Text>

      {error && (
        <Alert status="error" variant="left-accent" borderRadius="10px" mb={4} fontSize="14px">
          <AlertIcon />
          {error}
        </Alert>
      )}
      {success && (
        <Alert status="success" variant="left-accent" borderRadius="10px" mb={4} fontSize="14px">
          <AlertIcon />
          {success}
        </Alert>
      )}

      <FormControl isInvalid={!!fieldErrors.fullName} mb={4.5}>
        <FormLabel fontFamily="body" fontSize="12px" fontWeight={500} color="warmGray.600" mb={1.5}>
          Nombre completo
        </FormLabel>
        <Input
          type="text"
          placeholder="Juan Pérez"
          value={fullName}
          onChange={(e) => { setFullName(e.target.value); setFieldErrors((p) => ({ ...p, fullName: '' })); }}
          onFocus={() => setFocusField('fullName')}
          onBlur={() => setFocusField(null)}
          isDisabled={loading}
          isInvalid={!!fieldErrors.fullName}
          focusBorderColor={fieldErrors.fullName ? 'red.500' : 'accent.500'}
          _placeholder={{ color: 'warmGray.300' }}
        />
        {fieldErrors.fullName && (
          <Text fontSize="12px" color="red.500" mt={1}>{fieldErrors.fullName}</Text>
        )}
      </FormControl>

      <FormControl isInvalid={!!fieldErrors.email} mb={4.5}>
        <FormLabel fontFamily="body" fontSize="12px" fontWeight={500} color="warmGray.600" mb={1.5}>
          Correo electrónico
        </FormLabel>
        <Input
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
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

      <FormControl mb={4.5}>
        <FormLabel fontFamily="body" fontSize="12px" fontWeight={500} color="warmGray.600" mb={1.5}>
          Teléfono (opcional)
        </FormLabel>
        <Input
          type="tel"
          placeholder="+51 999 999 999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          isDisabled={loading}
          focusBorderColor="accent.500"
          _placeholder={{ color: 'warmGray.300' }}
        />
      </FormControl>

      <FormControl isInvalid={!!fieldErrors.password} mb={4.5}>
        <FormLabel fontFamily="body" fontSize="12px" fontWeight={500} color="warmGray.600" mb={1.5}>
          Contraseña
        </FormLabel>
        <InputGroup>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
            onFocus={() => { setFocusField('password'); setShowChecklist(true); }}
            onBlur={() => { setFocusField(null); if (allChecksMet) setShowChecklist(false); }}
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
        <PasswordChecklist password={password} show={showChecklist || (password.length > 0 && !allChecksMet)} />
        {password && (
          <Box mt={2}>
            <Flex gap={1}>
              {[1, 2, 3].map((level) => (
                <Box
                  key={level}
                  flex={1}
                  h="4px"
                  borderRadius="2px"
                  bg={pwStrength.level >= level ? pwStrength.color : 'warmGray.200'}
                  transition="background 0.3s ease"
                />
              ))}
            </Flex>
            <Text fontFamily="body" fontSize="12px" color={pwStrength.color || 'warmGray.500'} mt={1}>
              {pwStrength.label}
            </Text>
          </Box>
        )}
      </FormControl>

      <FormControl isInvalid={!!fieldErrors.confirmPassword} mb={4.5}>
        <FormLabel fontFamily="body" fontSize="12px" fontWeight={500} color="warmGray.600" mb={1.5}>
          Confirmar contraseña
        </FormLabel>
        <InputGroup>
          <Input
            type="password"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: '' })); }}
            onFocus={() => setFocusField('confirmPassword')}
            onBlur={() => setFocusField(null)}
            isDisabled={loading}
            isInvalid={!!fieldErrors.confirmPassword}
            focusBorderColor={fieldErrors.confirmPassword ? 'red.500' : 'accent.500'}
            _placeholder={{ color: 'warmGray.300' }}
            pr="44px"
          />
          <InputRightElement pointerEvents="none">
            <Box w="18px" h="18px" color={confirmPassword === password ? 'accent.500' : 'rose.400'}>
              {confirmPassword ? (
                confirmPassword === password ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                )
              ) : null}
            </Box>
          </InputRightElement>
        </InputGroup>
        {fieldErrors.confirmPassword && (
          <Text fontSize="12px" color="red.500" mt={1}>{fieldErrors.confirmPassword}</Text>
        )}
      </FormControl>

      <FormControl isInvalid={!!fieldErrors.terms} mb={5}>
        <Checkbox
          isChecked={acceptTerms}
          onChange={(e) => { setAcceptTerms(e.target.checked); setFieldErrors((p) => ({ ...p, terms: '' })); }}
          isDisabled={loading}
          colorScheme="accent"
          size="md"
          fontFamily="body"
          fontSize="13px"
          color="brand.900"
        >
          Acepto los términos y condiciones
        </Checkbox>
        {fieldErrors.terms && (
          <Text fontSize="12px" color="red.500" mt={1}>{fieldErrors.terms}</Text>
        )}
      </FormControl>

      <Button
        variant="primary"
        w="100%"
        h="50px"
        fontSize="15px"
        onClick={handleRegister}
        isLoading={loading}
        loadingText="Creando cuenta..."
        isDisabled={loading}
      >
        {!loading && 'Crear cuenta'}
      </Button>

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
        ¿Ya tienes cuenta?{' '}
        <Box as={Link} to="/login" color="accent.500" fontWeight={600}>
          Inicia sesión
        </Box>
      </Text>
      </PastelPageTransition>
    </AuthLayout>
  );
}
