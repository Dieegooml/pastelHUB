import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
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
  'auth/email-already-in-use': 'Este correo ya está registrado',
  'auth/weak-password': 'La contraseña es muy débil',
};

const checklistContainer = {
  background: colors.bgBeige,
  border: `1px solid ${colors.border}`,
  borderRadius: '10px',
  padding: '10px 14px',
  marginTop: '8px',
  fontFamily: font.body,
  fontSize: '12px',
};

const checklistTitle = {
  fontWeight: 600,
  color: '#555',
  marginBottom: '6px',
  fontSize: '12px',
};

const checklistItem = (met) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '2px 0',
  color: met ? colors.accent : colors.textSecondary,
  transition: 'color 0.3s ease',
  fontSize: '12px',
});

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

function PasswordChecklist({ password, show }) {
  const checks = getPasswordChecks(password);
  return (
    <div style={{ ...checklistContainer, display: show ? 'block' : 'none', opacity: show ? 1 : 0, transition: 'opacity 0.3s ease' }}>
      <div style={checklistTitle}>La contraseña debe tener:</div>
      <div style={checklistItem(checks.minChars)}>{checks.minChars ? '✅' : '❌'} Mínimo 8 caracteres</div>
      <div style={checklistItem(checks.hasUpper)}>{checks.hasUpper ? '✅' : '❌'} Una letra mayúscula</div>
      <div style={checklistItem(checks.hasLower)}>{checks.hasLower ? '✅' : '❌'} Una letra minúscula</div>
      <div style={checklistItem(checks.hasNumber)}>{checks.hasNumber ? '✅' : '❌'} Un número</div>
      <div style={checklistItem(checks.hasSpecial)}>{checks.hasSpecial ? '✅' : '❌'} Un carácter especial (opcional)</div>
    </div>
  );
}

function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: colors.border };
  const checks = getPasswordChecks(pw);
  if (checks.minChars && checks.hasUpper && checks.hasLower && checks.hasNumber && checks.hasSpecial) return { level: 3, label: 'Fuerte', color: colors.accent };
  if (checks.minChars && checks.hasUpper && checks.hasLower && checks.hasNumber) return { level: 2, label: 'Media', color: '#F59E0B' };
  return { level: 1, label: 'Débil', color: colors.error };
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

  const getInputStyle = (field) => {
    const hasError = fieldErrors[field];
    return {
      ...inputStyle,
      borderColor: hasError ? colors.error : focusField === field ? colors.accent : colors.border,
      boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : focusField === field ? '0 0 0 3px rgba(29,158,117,0.1)' : 'none',
    };
  };

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

  const inputWrapper = { marginBottom: '18px' };
  const inputRow = { position: 'relative' };
  const toggleBtn = {
    position: 'absolute', right: '12px', top: '50%',
    transform: 'translateY(-50%)', background: 'none', border: 'none',
    cursor: 'pointer', fontSize: '18px', padding: '4px', lineHeight: 1,
  };

  const allChecksMet = Object.values(getPasswordChecks(password)).every(Boolean);

  return (
    <AuthLayout>
      <h1 style={{ fontFamily: font.heading, fontSize: '32px', fontWeight: 700, color: colors.primary, margin: 0 }}>
        Crear una cuenta
      </h1>
      <p style={{ fontFamily: font.body, fontSize: '14px', color: colors.textSecondary, margin: '8px 0 28px' }}>
        Únete a la comunidad PastelHub
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
      {success && (
        <div style={{
          background: colors.successBg, color: colors.success, padding: '12px 16px',
          borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontFamily: font.body,
          borderLeft: `4px solid ${colors.success}`,
        }}>
          {success}
        </div>
      )}

      <div style={inputWrapper}>
        <label style={{
          fontFamily: font.body, fontSize: '12px', fontWeight: 500,
          color: '#555', marginBottom: '6px', display: 'block',
        }}>Nombre completo</label>
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
        <label style={{
          fontFamily: font.body, fontSize: '12px', fontWeight: 500,
          color: '#555', marginBottom: '6px', display: 'block',
        }}>Correo electrónico</label>
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
        <label style={{
          fontFamily: font.body, fontSize: '12px', fontWeight: 500,
          color: '#555', marginBottom: '6px', display: 'block',
        }}>Teléfono (opcional)</label>
        <input
          style={inputStyle}
          type="tel"
          placeholder="+51 999 999 999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
        />
      </div>

      <div style={inputWrapper}>
        <label style={{
          fontFamily: font.body, fontSize: '12px', fontWeight: 500,
          color: '#555', marginBottom: '6px', display: 'block',
        }}>Contraseña</label>
        <div style={inputRow}>
          <input
            style={{ ...getInputStyle('password'), paddingRight: '44px' }}
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
            onFocus={() => { setFocusField('password'); setShowChecklist(true); }}
            onBlur={() => { setFocusField(null); if (allChecksMet) setShowChecklist(false); }}
            disabled={loading}
          />
          <button type="button" style={toggleBtn} onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        {fieldErrors.password && <div style={fieldErrorStyle}>{fieldErrors.password}</div>}
        <PasswordChecklist password={password} show={showChecklist || (password.length > 0 && !allChecksMet)} />
        {password && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3].map((level) => (
                <div key={level} style={{
                  flex: 1, height: '4px', borderRadius: '2px',
                  background: pwStrength.level >= level ? pwStrength.color : colors.border,
                  transition: 'background 0.3s ease',
                }} />
              ))}
            </div>
            <div style={{ fontFamily: font.body, fontSize: '12px', color: pwStrength.color, marginTop: '4px' }}>
              {pwStrength.label}
            </div>
          </div>
        )}
      </div>

      <div style={inputWrapper}>
        <label style={{
          fontFamily: font.body, fontSize: '12px', fontWeight: 500,
          color: '#555', marginBottom: '6px', display: 'block',
        }}>Confirmar contraseña</label>
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
        <label style={{
          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
          fontFamily: font.body, fontSize: '13px', color: colors.primary,
        }}>
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => { setAcceptTerms(e.target.checked); setFieldErrors((p) => ({ ...p, terms: '' })); }}
            style={{ accentColor: colors.accent, width: '16px', height: '16px', cursor: 'pointer' }}
            disabled={loading}
          />
          Acepto los términos y condiciones
        </label>
        {fieldErrors.terms && <div style={fieldErrorStyle}>{fieldErrors.terms}</div>}
      </div>

      <button
        style={loading ? btnDisabled : btnFull}
        onClick={handleRegister}
        disabled={loading}
        onMouseEnter={(e) => { if (!loading) e.target.style.background = colors.accent; }}
        onMouseLeave={(e) => { if (!loading) e.target.style.background = colors.primary; }}
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
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" style={{ color: colors.accent, fontWeight: 600, textDecoration: 'none' }}>
          Inicia sesión
        </Link>
      </p>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #bbb; }
      `}</style>
    </AuthLayout>
  );
}
