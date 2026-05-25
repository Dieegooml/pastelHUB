import { useNavigate } from 'react-router-dom';
import { colors, font } from '../../styles/theme';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', background: colors.bgBeige, fontFamily: font.body, padding: '20px',
    }}>
      <img src="/pastelHUBlogo.png" alt="PastelHub" style={{ height: '80px', marginBottom: '24px', opacity: 0.6 }} />
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
        En desarrollo
      </h2>
      <p style={{
        fontSize: '15px', color: colors.textSecondary, margin: '0 0 32px',
        textAlign: 'center', maxWidth: '400px',
      }}>
        Esta página aún está en desarrollo
      </p>
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
        Volver al inicio
      </button>
    </div>
  );
}
