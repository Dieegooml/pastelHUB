import { useNavigate } from 'react-router-dom';
import { colors, font } from '../../styles/theme';

const LINKS = [
  { label: 'Pastelerías', path: '/', icon: '🏪' },
  { label: 'Iniciar sesión', path: '/login', icon: '🔑' },
  { label: 'Registrarse', path: '/register', icon: '✨' },
];

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', background: colors.bgBeige, fontFamily: font.body, padding: '20px',
    }}>
      {/* Decorative dots */}
      <div style={{
        display: 'flex', gap: '8px', marginBottom: '24px',
      }}>
        {['#e8ddd5', '#1d9e75', '#f59e0b', '#ef4444'].map(c => (
          <div key={c} style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, opacity: 0.4 }} />
        ))}
      </div>

      <img src="/pastelHUBlogo.png" alt="PastelHub" style={{ height: '64px', marginBottom: '20px', opacity: 0.5 }} />
      <h1 style={{
        fontFamily: font.heading, fontSize: '120px', fontWeight: 900,
        color: colors.accent, margin: '0', lineHeight: 1,
      }}>
        404
      </h1>
      <h2 style={{
        fontFamily: font.heading, fontSize: '28px', fontWeight: 700,
        color: colors.primary, margin: '12px 0 8px',
      }}>
        ¡Se nos escapó el pastel!
      </h2>
      <p style={{
        fontSize: '15px', color: colors.textSecondary, margin: '0 0 32px',
        textAlign: 'center', maxWidth: '400px',
      }}>
        La página que buscas no existe o fue movida. <br />
        Prueba con estas opciones:
      </p>

      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center',
        marginBottom: '24px',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: colors.white, color: colors.text, border: `1px solid ${colors.border}`,
            padding: '10px 24px', fontSize: '14px', fontWeight: 500,
            borderRadius: '99px', cursor: 'pointer', fontFamily: font.body,
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => { e.target.style.background = '#f5f5f5'; }}
          onMouseLeave={(e) => { e.target.style.background = colors.white; }}
        >
          ← Volver atrás
        </button>
        {LINKS.map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            style={{
              background: colors.white, color: colors.text, border: `1px solid ${colors.border}`,
              padding: '10px 24px', fontSize: '14px', fontWeight: 500,
              borderRadius: '99px', cursor: 'pointer', fontFamily: font.body,
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => { e.target.style.background = '#f5f5f5'; }}
            onMouseLeave={(e) => { e.target.style.background = colors.white; }}
          >
            {link.icon} {link.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate('/')}
        style={{
          background: colors.accent, color: '#fff', border: 'none',
          padding: '12px 36px', fontSize: '15px', fontWeight: 600,
          borderRadius: '99px', cursor: 'pointer', fontFamily: font.body,
          transition: 'all 0.25s ease',
        }}
        onMouseEnter={(e) => e.target.style.background = '#168959'}
        onMouseLeave={(e) => e.target.style.background = colors.accent}
      >
        Ir al inicio
      </button>
    </div>
  );
}
