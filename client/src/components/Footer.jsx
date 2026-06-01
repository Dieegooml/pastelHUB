import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colors, font } from '../styles/theme';

const linkStyle = {
  fontFamily: font.body,
  fontSize: '13px',
  color: colors.textSecondary,
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: '3px 0',
  textAlign: 'left',
};

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  if (['/login', '/register'].includes(location.pathname)) return null;

  return (
    <div style={{
      background: colors.primary,
      padding: '40px 24px 20px',
      marginTop: '40px',
    }}>
      <div style={{
        maxWidth: '960px', margin: '0 auto',
        display: 'flex', flexWrap: 'wrap', gap: '40px',
      }}>
        <div style={{ flex: '1 1 200px' }}>
          <div style={{
            fontFamily: font.heading, fontSize: '22px',
            fontWeight: 700, color: colors.white, marginBottom: '8px',
          }}>PastelHub</div>
          <p style={{
            fontFamily: font.body, fontSize: '12px',
            color: '#aaa', lineHeight: 1.6, margin: 0,
          }}>
            Las mejores pastelerías locales en un solo lugar.
            <br />Disfruta de postres artesanales hechos con amor.
          </p>
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <h4 style={{
            fontFamily: font.heading, fontSize: '15px',
            fontWeight: 600, color: colors.white, margin: '0 0 10px',
          }}>Navegación</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <button onClick={() => navigate('/')} style={linkStyle}>Inicio</button>
            <button onClick={() => navigate('/cart')} style={linkStyle}>Carrito</button>
            {user && (
              <button onClick={() => navigate('/my-orders')} style={linkStyle}>Mis Órdenes</button>
            )}
          </div>
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <h4 style={{
            fontFamily: font.heading, fontSize: '15px',
            fontWeight: 600, color: colors.white, margin: '0 0 10px',
          }}>Soporte</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {user ? (
              <>
                <button onClick={() => navigate('/support')} style={linkStyle}>Mis Tickets</button>
                <button onClick={() => navigate('/support/new')} style={linkStyle}>Crear Ticket</button>
              </>
            ) : (
              <button onClick={() => navigate('/login')} style={linkStyle}>Iniciar Sesión</button>
            )}
            <span style={{ ...linkStyle, cursor: 'default', color: '#777' }}>
              {user ? `Hola, ${user.full_name || user.email?.split('@')[0] || ''}` : ''}
            </span>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '960px', margin: '24px auto 0',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        paddingTop: '16px',
        display: 'flex', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: font.body, fontSize: '11px',
          color: '#777',
        }}>
          &copy; {new Date().getFullYear()} PastelHub. Todos los derechos reservados.
        </span>
      </div>
    </div>
  );
}
