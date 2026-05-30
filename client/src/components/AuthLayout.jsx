import { useState, useEffect } from 'react';
import { colors, font } from '../styles/theme';

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: font.body,
    position: 'relative',
  },
  leftPanel: {
    width: '45%',
    background: `linear-gradient(135deg, ${colors.bgBeige} 0%, #f0e8de 100%)`,
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
    background: colors.white,
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
  title: {
    fontFamily: font.heading,
    fontSize: '42px',
    fontWeight: 700,
    color: colors.primary,
    margin: 0,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: font.body,
    fontSize: '16px',
    color: colors.textSecondary,
    maxWidth: '300px',
    textAlign: 'center',
    lineHeight: 1.5,
    margin: '12px 0 24px',
  },
  divider: {
    width: '60px',
    height: '2px',
    background: colors.border,
    border: 'none',
    marginBottom: '24px',
  },
  bullet: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: font.body,
    fontSize: '14px',
    color: colors.primary,
    marginBottom: '12px',
    background: 'rgba(255,255,255,0.5)',
    padding: '10px 16px',
    borderRadius: '10px',
    backdropFilter: 'blur(4px)',
  },
  decorative: {
    position: 'absolute',
    bottom: '-40px',
    right: '-40px',
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    background: 'rgba(29, 158, 117, 0.05)',
  },
  decorative2: {
    position: 'absolute',
    top: '-60px',
    left: '-60px',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'rgba(45, 31, 31, 0.04)',
  },
  decorative3: {
    position: 'absolute',
    top: '30%',
    right: '-80px',
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    background: 'rgba(29, 158, 117, 0.03)',
  },
};

const bullets = [
  { text: 'Múltiples pastelerías locales' },
  { text: 'Productos personalizables' },
  { text: 'Reseñas verificadas' },
];

export default function AuthLayout({ children }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <div style={{ ...styles.container }}>
        <div style={{ width: '100%', background: colors.white, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
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
        <div style={styles.decorative3} />
        <img src="/pastelHUBlogo.png" alt="PastelHub" style={{ height: '140px', marginBottom: '20px' }} />
        <h1 style={styles.title}>PastelHub</h1>
        <p style={styles.subtitle}>Descubre las mejores pastelerías artesanales</p>
        <hr style={styles.divider} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {bullets.map((b, i) => (
            <div key={i} style={styles.bullet}>
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
