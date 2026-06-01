import { useState, useEffect, useRef } from 'react';
import { onRateLimit } from '../services/rateLimitHandler';

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: '#fff', borderRadius: '16px', padding: '2rem',
    maxWidth: '400px', width: '90%', textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  icon: {
    width: '64px', height: '64px', borderRadius: '50%',
    background: '#fef3c7', display: 'flex', alignItems: 'center',
    justifyContent: 'center', margin: '0 auto 1rem',
    fontSize: '32px',
  },
  title: {
    fontSize: '18px', fontWeight: 700, marginBottom: '8px',
    fontFamily: "'Playfair Display', serif",
  },
  text: {
    fontSize: '14px', color: '#666', marginBottom: '1.5rem',
    lineHeight: 1.5,
  },
  button: {
    background: '#d4a574', color: '#fff', border: 'none',
    padding: '10px 24px', borderRadius: '99px', fontSize: '14px',
    fontWeight: 600, cursor: 'pointer',
  },
};

export default function RateLimitToast() {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const unsub = onRateLimit(() => {
      setVisible(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 6000);
    });
    return () => {
      unsub();
      clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div style={styles.overlay} onClick={() => setVisible(false)}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.icon}>⏳</div>
        <h2 style={styles.title}>Demasiadas solicitudes</h2>
        <p style={styles.text}>
          Has realizado demasiadas peticiones en poco tiempo.
          Espera unos minutos antes de intentar de nuevo.
        </p>
        <button style={styles.button} onClick={() => setVisible(false)}>
          Entendido
        </button>
      </div>
    </div>
  );
}
