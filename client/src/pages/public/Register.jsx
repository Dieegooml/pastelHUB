import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiService';
import AuthLayout from '../../components/AuthLayout';
import { PastelPageTransition } from '../../components/UI';
import {
  Box, Flex, Heading, Text, Input, Button, FormControl, FormLabel,
  InputGroup, InputLeftElement, InputRightElement,
  Alert, AlertIcon, Divider,
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

function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: 'warmGray.200', bg: 'warmGray.200' };
  const checks = getPasswordChecks(pw);
  if (checks.minChars && checks.hasUpper && checks.hasLower && checks.hasNumber && checks.hasSpecial)
    return { level: 3, label: 'Fuerte', color: 'accent.500', bg: 'accent.500' };
  if (checks.minChars && checks.hasUpper && checks.hasLower && checks.hasNumber)
    return { level: 2, label: 'Media', color: '#F59E0B', bg: '#F59E0B' };
  return { level: 1, label: 'Débil', color: 'red.500', bg: 'red.500' };
}

const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.36 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

function CheckItem({ ok, text }) {
  return (
    <Flex align="center" gap="6px" py="2px" color={ok ? 'accent.500' : 'warmGray.500'} fontSize="12px">
      <Box w="14px" h="14px" flexShrink={0}>
        {ok ? <IconCheck /> : <IconX />}
      </Box>
      <Text as="span">{text}</Text>
    </Flex>
  );
}

function PasswordChecklist({ password, show }) {
  const checks = getPasswordChecks(password);
  const allChecksMet = Object.values(checks).every(Boolean);
  const visible = show || (password.length > 0 && !allChecksMet);

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
      maxH={visible ? '240px' : '0'}
      opacity={visible ? 1 : 0}
      overflow="hidden"
      transition="max-height 0.35s ease, opacity 0.3s ease, margin 0.3s ease"
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

function PasswordStrengthBar({ password }) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  return (
    <Box mt={2}>
      <Flex gap={1} h="5px">
        {[1, 2, 3].map((level) => (
          <Box
            key={level}
            flex={1}
            borderRadius="3px"
            bg={strength.level >= level ? strength.bg : 'warmGray.200'}
            transition="background 0.4s ease"
          />
        ))}
      </Flex>
      <Flex justify="space-between" align="center" mt={0.5}>
        <Text fontFamily="body" fontSize="12px" color={strength.color} fontWeight={600} transition="color 0.3s ease">
          {strength.label}
        </Text>
        <Text fontFamily="body" fontSize="11px" color="warmGray.400">
          {strength.level === 3 ? 'Segura' : strength.level === 2 ? 'Podría ser mejor' : 'Demasiado débil'}
        </Text>
      </Flex>
    </Box>
  );
}

function CustomCheckbox({ checked, onChange, disabled, children, error }) {
  return (
    <Flex as="label" align="center" gap={3} cursor={disabled ? 'not-allowed' : 'pointer'} opacity={disabled ? 0.6 : 1} userSelect="none">
      <Box
        as="button"
        type="button"
        onClick={disabled ? undefined : onChange}
        w="20px"
        h="20px"
        borderRadius="md"
        border="2px solid"
        borderColor={error ? 'rose.400' : checked ? 'accent.500' : 'brand.300'}
        bg={checked ? 'accent.500' : 'white'}
        display="flex"
        alignItems="center"
        justifyContent="center"
        transition="all 0.15s"
        _hover={!disabled ? { borderColor: checked ? 'accent.600' : 'brand.400' } : undefined}
        _focus={{ boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.25)', outline: 'none' }}
        aria-checked={checked}
        role="checkbox"
        flexShrink={0}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </Box>
      <Text fontFamily="body" fontSize="13px" color={error ? 'rose.500' : 'brand.800'}>
        {children}
      </Text>
    </Flex>
  );
}

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [showChecklist, setShowChecklist] = useState(false);
  const navigate = useNavigate();

  const allChecksMet = Object.values(getPasswordChecks(password)).every(Boolean);

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
        setError('Error al registrarse con Facebook');
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
          p={{ base: 0, md: 5 }}
        >
          <Heading as="h1" fontFamily="heading" fontSize={{ base: '24px', md: '32px' }} fontWeight={700} color="brand.900" m={0}>
            Crear una cuenta
          </Heading>
          <Text fontFamily="body" fontSize="14px" color="warmGray.500" mt={1} mb={6}>
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
            <InputGroup>
              <InputLeftElement h="48px">
                <Box w="18px" h="18px" color={iconColor('fullName')} transition="color 0.2s"><IconUser /></Box>
              </InputLeftElement>
              <Input
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setFieldErrors((p) => ({ ...p, fullName: '' })); }}
                onBlur={() => { if (fullName.length < 3) setFieldErrors((p) => ({ ...p, fullName: 'El nombre debe tener al menos 3 caracteres' })); else if (!NAME_REGEX.test(fullName)) setFieldErrors((p) => ({ ...p, fullName: 'El nombre solo puede contener letras y espacios' })); }}
                isDisabled={loading}
                isInvalid={!!fieldErrors.fullName}
                h="48px"
                fontSize="14px"
                pl="44px"
                borderColor={fieldBorderColor('fullName')}
                focusBorderColor={fieldFocusColor('fullName')}
                _placeholder={{ color: 'warmGray.300' }}
              />
            </InputGroup>
            {fieldErrors.fullName && (
              <Text fontSize="12px" color="rose.500" mt={1}>{fieldErrors.fullName}</Text>
            )}
          </FormControl>

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
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
                onBlur={() => { if (!email.trim()) setFieldErrors((p) => ({ ...p, email: 'El correo es obligatorio' })); else if (/\s/.test(email)) setFieldErrors((p) => ({ ...p, email: 'El correo no debe contener espacios' })); else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setFieldErrors((p) => ({ ...p, email: 'Ingresa un correo válido' })); }}
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
              <Text fontSize="12px" color="rose.500" mt={1}>{fieldErrors.email}</Text>
            )}
          </FormControl>

          <FormControl mb={4.5}>
            <FormLabel fontFamily="body" fontSize="12px" fontWeight={500} color="warmGray.600" mb={1.5}>
              Teléfono (opcional)
            </FormLabel>
            <InputGroup>
              <InputLeftElement h="48px">
                <Box w="18px" h="18px" color="warmGray.400"><IconPhone /></Box>
              </InputLeftElement>
              <Input
                type="tel"
                placeholder="+51 999 999 999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                isDisabled={loading}
                h="48px"
                fontSize="14px"
                pl="44px"
                focusBorderColor="accent.500"
                _placeholder={{ color: 'warmGray.300' }}
              />
            </InputGroup>
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
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
                onFocus={() => { setShowChecklist(true); }}
                onBlur={() => { if (!password.trim()) setFieldErrors((p) => ({ ...p, password: 'La contraseña es obligatoria' })); else if (/\s/.test(password)) setFieldErrors((p) => ({ ...p, password: 'La contraseña no debe contener espacios' })); else if (password.length < 8) setFieldErrors((p) => ({ ...p, password: 'La contraseña debe tener al menos 8 caracteres' })); else if (!/[A-Z]/.test(password)) setFieldErrors((p) => ({ ...p, password: 'Debe contener al menos una mayúscula' })); else if (!/[a-z]/.test(password)) setFieldErrors((p) => ({ ...p, password: 'Debe contener al menos una minúscula' })); else if (!/\d/.test(password)) setFieldErrors((p) => ({ ...p, password: 'Debe contener al menos un número' })); }}
                onBlur={() => { if (allChecksMet) setShowChecklist(false); }}
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
            <PasswordChecklist password={password} show={showChecklist} />
            <PasswordStrengthBar password={password} />
          </FormControl>

          <FormControl isInvalid={!!fieldErrors.confirmPassword} mb={4.5}>
            <FormLabel fontFamily="body" fontSize="12px" fontWeight={500} color="warmGray.600" mb={1.5}>
              Confirmar contraseña
            </FormLabel>
            <InputGroup>
              <InputLeftElement h="48px">
                <Box w="18px" h="18px" color={iconColor('confirmPassword')} transition="color 0.2s"><IconLock /></Box>
              </InputLeftElement>
              <Input
                type="password"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: '' })); }}
                onBlur={() => { if (confirmPassword !== password) setFieldErrors((p) => ({ ...p, confirmPassword: 'Las contraseñas no coinciden' })); }}
                isDisabled={loading}
                isInvalid={!!fieldErrors.confirmPassword}
                h="48px"
                fontSize="14px"
                pl="44px"
                pr="44px"
                borderColor={fieldBorderColor('confirmPassword')}
                focusBorderColor={fieldFocusColor('confirmPassword')}
                _placeholder={{ color: 'warmGray.300' }}
              />
              <InputRightElement h="48px" pointerEvents="none">
                <Box
                  w="18px"
                  h="18px"
                  color={confirmPassword === password ? 'accent.500' : 'rose.400'}
                  transition="color 0.2s"
                >
                  {confirmPassword ? (
                    confirmPassword === password ? <IconCheck /> : <IconX />
                  ) : null}
                </Box>
              </InputRightElement>
            </InputGroup>
            {fieldErrors.confirmPassword && (
              <Text fontSize="12px" color="rose.500" mt={1}>{fieldErrors.confirmPassword}</Text>
            )}
          </FormControl>

          <FormControl isInvalid={!!fieldErrors.terms} mb={5}>
            <CustomCheckbox
              checked={acceptTerms}
              onChange={() => { setAcceptTerms(!acceptTerms); setFieldErrors((p) => ({ ...p, terms: '' })); }}
              disabled={loading}
              error={!!fieldErrors.terms}
            >
              Acepto los términos y condiciones
            </CustomCheckbox>
            {fieldErrors.terms && (
              <Text fontSize="12px" color="rose.500" mt={1}>{fieldErrors.terms}</Text>
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
            spinnerPlacement="start"
            _hover={loading ? {} : { bg: 'brand.800', transform: 'translateY(-1px)', shadow: 'md' }}
            _focus={{ boxShadow: '0 0 0 3px rgba(45, 24, 16, 0.3)', outline: 'none' }}
            _disabled={{ bg: 'brand.300', cursor: 'not-allowed', _hover: { transform: 'none', shadow: 'none' } }}
          >
            Crear cuenta
          </Button>

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
            ¿Ya tienes cuenta?{' '}
            <Box as={Link} to="/login" color="accent.500" fontWeight={600}>
              Inicia sesión
            </Box>
          </Text>
        </Box>
      </PastelPageTransition>
    </AuthLayout>
  );
}
