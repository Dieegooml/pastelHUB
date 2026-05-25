import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiService';
import AuthLayout from '../../components/AuthLayout';
import { colors, font, inputStyle, btnPrimary } from '../../styles/theme';

const btnDisabled = {
  ...btnPrimary, width: '100%', height: '50px',
  opacity: 0.6, cursor: 'not-allowed',
};

const btnFull = {
  ...btnPrimary, width: '100%', height: '50px', fontSize: '15px',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
};

const btnGoogle = {
  width: '100%', height: '50px',
  background: colors.white, border: `1px solid ${colors.border}`,
  borderRadius: '99px', fontFamily: font.body, fontSize: '14px', fontWeight: 500,
  color: colors.primary, cursor: 'pointer', transition: 'all 0.25s ease',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
};

const googleSvg = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const fieldErrorStyle = {
  fontFamily: font.body, fontSize: '12px', color: colors.error, marginTop: '4px',
};

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
  const navigate = useNavigate();

  const getInputStyle = (field) => ({
    ...inputStyle,
    borderColor: fieldErrors[field] ? colors.error : focusField === field ? colors.accent : colors.border,
    boxShadow: fieldErrors[field] ? '0 0 0 3px rgba(239,68,68,0.1)' : focusField === field ? '0 0 0 3px rgba(29,158,117,0.1)' : 'none',
  });

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

  const inputWrapper = { marginBottom: '20px' };
  const inputRow = { position: 'relative' };
  const toggleBtn = {
    position: 'absolute', right: '12px', top: '50%',
    transform: 'translateY(-50%)', background: 'none', border: 'none',
    cursor: 'pointer', fontSize: '18px', padding: '4px', lineHeight: 1,
  };

  return (
    <AuthLayout>
      <h1 style={{ fontFamily: font.heading, fontSize: '32px', fontWeight: 700, color: colors.primary, margin: 0 }}>
        Bienvenido de nuevo
      </h1>
      <p style={{ fontFamily: font.body, fontSize: '14px', color: colors.textSecondary, margin: '8px 0 32px' }}>
        Inicia sesión en tu cuenta
      </p>

      {error && (
        <div style={{
          background: colors.errorBg, color: colors.error, padding: '12px 16px',
          borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontFamily: font.body,
          borderLeft: `4px solid ${colors.error}`,
        }}>
          {error}
        </div>
      )}

      <div style={inputWrapper}>
        <label style={{
          fontFamily: font.body, fontSize: '12px', fontWeight: 500,
          color: '#555', marginBottom: '6px', display: 'block',
        }}>Correo electrónico</label>
        <div style={inputRow}>
          <input
            style={{ ...getInputStyle('email'), paddingLeft: '14px' }}
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            maxLength={254}
            onChange={(e) => { setEmail(e.target.value.replace(/\s/g, '')); setFieldErrors((p) => ({ ...p, email: '' })); }}
            onFocus={() => setFocusField('email')}
            onBlur={() => setFocusField(null)}
            disabled={loading}
          />
        </div>
        {fieldErrors.email && <div style={fieldErrorStyle}>{fieldErrors.email}</div>}
      </div>

      <div style={inputWrapper}>
        <label style={{
          fontFamily: font.body, fontSize: '12px', fontWeight: 500,
          color: '#555', marginBottom: '6px', display: 'block',
        }}>Contraseña</label>
        <div style={inputRow}>
          <input
            style={{ ...getInputStyle('password'), paddingLeft: '14px', paddingRight: '44px' }}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            maxLength={254}
            onChange={(e) => { setPassword(e.target.value.replace(/\s/g, '')); setFieldErrors((p) => ({ ...p, password: '' })); }}
            onFocus={() => setFocusField('password')}
            onBlur={() => setFocusField(null)}
            disabled={loading}
          />
          <button type="button" style={toggleBtn} onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        {fieldErrors.password && <div style={fieldErrorStyle}>{fieldErrors.password}</div>}
      </div>

      <div
        style={{
          display: 'block', textAlign: 'right', fontFamily: font.body, fontSize: '13px',
          color: colors.accent, cursor: 'pointer', marginTop: '-12px', marginBottom: '24px', textDecoration: 'none',
        }}
        onClick={() => alert('Funcionalidad en desarrollo')}
      >
        ¿Olvidaste tu contraseña?
      </div>

      <button
        style={loading ? btnDisabled : btnFull}
        onClick={handleLogin}
        disabled={loading}
        onMouseEnter={(e) => { if (!loading) e.target.style.background = colors.accent; }}
        onMouseLeave={(e) => { if (!loading) e.target.style.background = colors.primary; }}
      >
        {loading ? (
          <>
            <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            Iniciando sesión...
          </>
        ) : (
          'Iniciar sesión'
        )}
      </button>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        margin: '20px 0', color: colors.textSecondary, fontFamily: font.body, fontSize: '13px',
      }}>
        <hr style={{ flex: 1, height: '1px', background: colors.border, border: 'none' }} />
        <span>o continúa con</span>
        <hr style={{ flex: 1, height: '1px', background: colors.border, border: 'none' }} />
      </div>

      <button
        style={loading ? { ...btnGoogle, opacity: 0.6, cursor: 'not-allowed' } : btnGoogle}
        onClick={handleGoogle}
        disabled={loading}
        onMouseEnter={(e) => { if (!loading) e.target.style.background = colors.bgBeige; }}
        onMouseLeave={(e) => { if (!loading) e.target.style.background = colors.white; }}
      >
        {googleSvg}
        Continuar con Google
      </button>

      <p style={{
        textAlign: 'center', fontFamily: font.body, fontSize: '14px', color: colors.textSecondary, marginTop: '24px',
      }}>
        ¿No tienes cuenta?{' '}
        <Link to="/register" style={{ color: colors.accent, fontWeight: 600, textDecoration: 'none' }}>
          Regístrate aquí
        </Link>
      </p>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #bbb; }
      `}</style>
    </AuthLayout>
  );
}
