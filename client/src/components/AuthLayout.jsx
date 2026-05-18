import { useState, useEffect } from 'react';

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'Inter, sans-serif',
    position: 'relative',
  },
  leftPanel: {
    width: '45%',
    background: '#F9F4EE',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  rightPanel: {
    width: '55%',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    boxSizing: 'border-box',
  },
  formWrapper: {
    width: '100%',
    maxWidth: '400px',
  },
  logo: {
    fontSize: '64px',
    lineHeight: 1,
    marginBottom: '16px',
  },
  title: {
    fontFamily: 'Playfair Display, serif',
    fontSize: '42px',
    fontWeight: 700,
    color: '#2D1F1F',
    margin: 0,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    color: '#888888',
    maxWidth: '300px',
    textAlign: 'center',
    lineHeight: 1.5,
    margin: '12px 0 24px',
  },
  divider: {
    width: '60px',
    height: '2px',
    background: '#E8DDD5',
    border: 'none',
    marginBottom: '24px',
  },
  bullet: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    color: '#2D1F1F',
    marginBottom: '10px',
  },
  decorative: {
    position: 'absolute',
    bottom: '-40px',
    right: '-40px',
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    background: 'rgba(29, 158, 117, 0.04)',
  },
  decorative2: {
    position: 'absolute',
    top: '-60px',
    left: '-60px',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'rgba(45, 31, 31, 0.03)',
  },
};

const bullets = [
  { icon: '🏪', text: 'Múltiples pastelerías locales' },
  { icon: '🎨', text: 'Productos personalizables' },
  { icon: '⭐', text: 'Reseñas verificadas' },
];

export default function AuthLayout({ children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <div style={{ ...styles.container }}>
        <div style={{ width: '100%', background: '#FFFFFF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={styles.formWrapper}>{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.decorative} />
        <div style={styles.decorative2} />
        <div style={styles.logo}>🎂</div>
        <h1 style={styles.title}>PastelHub</h1>
        <p style={styles.subtitle}>Descubre las mejores pastelerías artesanales</p>
        <hr style={styles.divider} />
        <div>
          {bullets.map((b, i) => (
            <div key={i} style={styles.bullet}>
              <span>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={styles.rightPanel}>
        <div style={styles.formWrapper}>{children}</div>
      </div>
    </div>
  );
}