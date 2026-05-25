import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { colors, font } from '../styles/theme';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.roles?.includes('admin');
  const isOwner = user?.roles?.includes('owner');

  const btnStyle = (active) => ({
    padding: '8px 16px', borderRadius: '99px', border: active ? 'none' : `1px solid ${colors.border}`,
    fontSize: '13px', fontWeight: 500, fontFamily: font.body, cursor: 'pointer',
    background: active ? colors.primary : colors.white,
    color: active ? '#fff' : colors.textSecondary,
    transition: 'all 0.2s ease',
  });

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem', height: '64px',
      background: colors.white, borderBottom: `1px solid ${colors.border}`,
      fontFamily: font.body,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        onClick={() => navigate('/')}>
        <img src="/favicon.png" alt="PastelHub" style={{ height: '32px', width: '32px', borderRadius: '6px' }} />
        <span style={{ fontFamily: font.heading, fontSize: '20px', fontWeight: 700, color: colors.primary }}>
          PastelHub
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button onClick={() => navigate('/')} style={btnStyle(location.pathname === '/')}>
          Inicio
        </button>

        <button onClick={() => navigate('/cart')} style={btnStyle(location.pathname === '/cart')}>
          Carrito
        </button>

        <button onClick={() => navigate('/my-orders')} style={btnStyle(location.pathname.startsWith('/my-orders'))}>
          Mis órdenes
        </button>

        <button onClick={() => navigate('/profile')} style={btnStyle(location.pathname === '/profile')}>
          Perfil
        </button>

        {isOwner && (
          <button onClick={() => navigate('/owner')} style={{
            ...btnStyle(location.pathname === '/owner'),
            background: location.pathname === '/owner' ? '#e65100' : colors.white,
            color: location.pathname === '/owner' ? '#fff' : colors.textSecondary,
            border: location.pathname === '/owner' ? 'none' : `1px solid ${colors.border}`,
          }}>
            Dueño
          </button>
        )}

        {isAdmin && (
          <button onClick={() => navigate('/admin')} style={{
            padding: '8px 16px', borderRadius: '99px',
            border: location.pathname.startsWith('/admin') ? 'none' : `1px solid ${colors.border}`,
            fontSize: '13px', fontWeight: 500, fontFamily: font.body, cursor: 'pointer',
            background: location.pathname.startsWith('/admin') ? colors.accent : colors.white,
            color: location.pathname.startsWith('/admin') ? '#fff' : colors.textSecondary,
            transition: 'all 0.2s ease',
          }}>
            Administrar
          </button>
        )}

        <span style={{ fontSize: '13px', color: colors.textMuted, margin: '0 4px' }}>
          {user?.email}
        </span>

        <button onClick={() => { signOut(auth); navigate('/login'); }}
          style={{
            padding: '6px 14px', borderRadius: '99px', border: 'none',
            fontSize: '12px', fontWeight: 500, fontFamily: font.body, cursor: 'pointer',
            background: colors.errorBg, color: colors.error, transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
          onMouseLeave={(e) => e.target.style.background = colors.errorBg}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
