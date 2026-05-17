import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
    },
    errorCode: {
      fontSize: '120px',
      fontWeight: '900',
      color: '#1D9E75',
      margin: '0',
      lineHeight: '1',
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#333',
      margin: '20px 0 10px 0',
      textAlign: 'center',
    },
    message: {
      fontSize: '18px',
      color: '#666',
      margin: '10px 0 40px 0',
      textAlign: 'center',
      maxWidth: '500px',
    },
    button: {
      backgroundColor: '#1D9E75',
      color: 'white',
      border: 'none',
      padding: '12px 32px',
      fontSize: '16px',
      fontWeight: '600',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
      marginTop: '20px',
    },
    buttonHover: {
      backgroundColor: '#168959',
    },
    icon: {
      fontSize: '80px',
      marginBottom: '20px',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.errorCode}>404</h1>
      <h2 style={styles.title}>En desarrollo</h2>
      <p style={styles.message}>
        Esta página aún está en desarrollo :v
      </p>
      <button
        style={styles.button}
        onMouseEnter={(e) => (e.target.style.backgroundColor = styles.buttonHover.backgroundColor)}
        onMouseLeave={(e) => (e.target.style.backgroundColor = styles.button.backgroundColor)}
        onClick={() => navigate('/login')}
      >
        Volver a Inicio
      </button>
    </div>
  );
}
