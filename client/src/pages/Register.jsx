import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { api } from '../services/apiService';
import AuthLayout from '../components/AuthLayout';

const inputBase = {
  width: '100%',
  height: '48px',
  padding: '0 16px',
  border: '1.5px solid #E8DDD5',
  borderRadius: '10px',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  color: '#2D1F1F',
  background: '#FFFFFF',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '12px',
  fontWeight: 500,
  color: '#555',
  marginBottom: '6px',
  display: 'block',
};

const btnPrimary = {
  width: '100%',
  height: '50px',
  background: '#2D1F1F',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '99px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '15px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.25s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
};

const btnDisabled = {
  ...btnPrimary,
  opacity: 0.6,
  cursor: 'not-allowed',
};

const btnGoogle = {
  width: '100%',
  height: '50px',
  background: '#FFFFFF',
  border: '1px solid #E8DDD5',
  borderRadius: '99px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  fontWeight: 500,
  color: '#2D1F1F',
  cursor: 'pointer',
  transition: 'all 0.25s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
};

const googleSvg = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const errorBoxStyle = {
  background: '#FEF2F2',
  borderLeft: '3px solid #EF4444',
  padding: '12px',
  borderRadius: '8px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '13px',
  color: '#EF4444',
  marginBottom: '16px',
};

const successBoxStyle = {
  background: '#ECFDF5',
  borderLeft: '3px solid #1D9E75',
  padding: '12px',
  borderRadius: '8px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '13px',
  color: '#0F6E56',
  marginBottom: '16px',
};

const fieldErrorStyle = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '12px',
  color: '#EF4444',
  marginTop: '4px',
};

const FIREBASE_ERRORS = {
  'auth/email-already-in-use': 'Este correo ya está registrado',
  'auth/weak-password': 'La contraseña es muy débil',
};

function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: '#E8DDD5' };
  if (pw.length < 6) return { level: 1, label: 'Débil', color: '#EF4444' };
  const hasLetter = /[a-zA-Z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSymbol = /[^a-zA-Z0-9]/.test(pw);
  if (pw.length >= 8 && hasLetter && hasNumber && hasSymbol) return { level: 3, label: 'Fuerte', color: '#1D9E75' };
  if (pw.length >= 6 && hasLetter && hasNumber) return { level: 2, label: 'Media', color: '#F59E0B' };
  return { level: 1, label: 'Débil', color: '#EF4444' };
}

export default function Register() {
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
  const navigate = useNavigate();

  const pwStrength = getPasswordStrength(password);

  const getInputStyle = (field) => {
    const hasError = fieldErrors[field];
    return {
      ...inputBase,
      borderColor: hasError ? '#EF4444' : focusField === field ? '#1D9E75' : inputBase.borderColor,
      boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : focusField === field ? '0 0 0 3px rgba(29,158,117,0.1)' : 'none',
    };
  };

  const validate = () => {
    const errs = {};
    if (fullName.length < 3) errs.fullName = 'El nombre debe tener al menos 3 caracteres';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Ingresa un correo válido';
    if (password.length < 6) errs.password = 'La contraseña debe tener al menos 6 caracteres';
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
      setSuccess('¡Cuenta creada exitosamente! Redirigiendo...');
      setTimeout(() => navigate('/login'), 2000);
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
      navigate('/admin/users');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Error al registrarse con Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputWrapper = { marginBottom: '18px' };
  const inputRow = { position: 'relative' };
  const toggleBtn = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px',
    lineHeight: 1,
  };
  const separator = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '20px 0',
    color: '#888888',
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
  };
  const sepLine = { flex: 1, height: '1px', background: '#E8DDD5' };
  const footerText = {
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    color: '#888',
    marginTop: '24px',
  };

  return (
    <AuthLayout>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', fontWeight: 700, color: '#2D1F1F', margin: 0 }}>
        Crear una cuenta
      </h1>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#888888', margin: '8px 0 28px' }}>
        Únete a la comunidad PastelHub
      </p>

      {error && <div style={errorBoxStyle}>{error}</div>}
      {success && <div style={successBoxStyle}>{success}</div>}

      <div style={inputWrapper}>
        <label style={labelStyle}>Nombre completo</label>
        <input
          style={getInputStyle('fullName')}
          type="text"
          placeholder="Juan Pérez"
          value={fullName}
          onChange={(e) => { setFullName(e.target.value); setFieldErrors((p) => ({ ...p, fullName: '' })); }}
          onFocus={() => setFocusField('fullName')}
          onBlur={() => setFocusField(null)}
          disabled={loading}
        />
        {fieldErrors.fullName && <div style={fieldErrorStyle}>{fieldErrors.fullName}</div>}
      </div>

      <div style={inputWrapper}>
        <label style={labelStyle}>Correo electrónico</label>
        <input
          style={getInputStyle('email')}
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
          onFocus={() => setFocusField('email')}
          onBlur={() => setFocusField(null)}
          disabled={loading}
        />
        {fieldErrors.email && <div style={fieldErrorStyle}>{fieldErrors.email}</div>}
      </div>

      <div style={inputWrapper}>
        <label style={labelStyle}>Teléfono (opcional)</label>
        <input
          style={inputBase}
          type="tel"
          placeholder="+51 999 999 999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
        />
      </div>

      <div style={inputWrapper}>
        <label style={labelStyle}>Contraseña</label>
        <div style={inputRow}>
          <input
            style={{ ...getInputStyle('password'), paddingRight: '44px' }}
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
            onFocus={() => setFocusField('password')}
            onBlur={() => setFocusField(null)}
            disabled={loading}
          />
          <button
            type="button"
            style={toggleBtn}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        {fieldErrors.password && <div style={fieldErrorStyle}>{fieldErrors.password}</div>}
        {password && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  style={{
                    flex: 1,
                    height: '4px',
                    borderRadius: '2px',
                    background: pwStrength.level >= level ? pwStrength.color : '#E8DDD5',
                    transition: 'background 0.3s ease',
                  }}
                />
              ))}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: pwStrength.color, marginTop: '4px' }}>
              {pwStrength.label}
            </div>
          </div>
        )}
      </div>

      <div style={inputWrapper}>
        <label style={labelStyle}>Confirmar contraseña</label>
        <div style={inputRow}>
          <input
            style={{ ...getInputStyle('confirmPassword'), paddingRight: '44px' }}
            type="password"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: '' })); }}
            onFocus={() => setFocusField('confirmPassword')}
            onBlur={() => setFocusField(null)}
            disabled={loading}
          />
          <span style={{ ...toggleBtn, pointerEvents: 'none' }}>
            {confirmPassword ? (
              confirmPassword === password ? '✅' : '❌'
            ) : ''}
          </span>
        </div>
        {fieldErrors.confirmPassword && <div style={fieldErrorStyle}>{fieldErrors.confirmPassword}</div>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#2D1F1F' }}>
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => { setAcceptTerms(e.target.checked); setFieldErrors((p) => ({ ...p, terms: '' })); }}
            style={{ accentColor: '#1D9E75', width: '16px', height: '16px', cursor: 'pointer' }}
            disabled={loading}
          />
          Acepto los términos y condiciones
        </label>
        {fieldErrors.terms && <div style={fieldErrorStyle}>{fieldErrors.terms}</div>}
      </div>

      <button
        style={loading ? btnDisabled : btnPrimary}
        onClick={handleRegister}
        disabled={loading}
        onMouseEnter={(e) => { if (!loading) e.target.style.background = '#1D9E75'; }}
        onMouseLeave={(e) => { if (!loading) e.target.style.background = '#2D1F1F'; }}
      >
        {loading ? (
          <>
            <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            Creando cuenta...
          </>
        ) : (
          'Crear cuenta'
        )}
      </button>

      <div style={separator}>
        <hr style={sepLine} />
        <span>o continúa con</span>
        <hr style={sepLine} />
      </div>

      <button
        style={loading ? { ...btnGoogle, opacity: 0.6, cursor: 'not-allowed' } : btnGoogle}
        onClick={handleGoogle}
        disabled={loading}
        onMouseEnter={(e) => { if (!loading) e.target.style.background = '#F9F4EE'; }}
        onMouseLeave={(e) => { if (!loading) e.target.style.background = '#FFFFFF'; }}
      >
        {googleSvg}
        Continuar con Google
      </button>

      <p style={footerText}>
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" style={{ color: '#1D9E75', fontWeight: 600, textDecoration: 'none' }}>
          Inicia sesión
        </Link>
      </p>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </AuthLayout>
  );
}