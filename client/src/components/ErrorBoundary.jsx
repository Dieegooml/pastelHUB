import { Component } from 'react';
import PropTypes from 'prop-types';
import { colors, font } from '../styles/theme';

export default class ErrorBoundary extends Component {
  static propTypes = {
    children: PropTypes.node,
    fallback: PropTypes.node,
  };

  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Error capturado:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: colors.bgBeige, padding: '2rem',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ fontFamily: font.heading, fontSize: '24px', fontWeight: 700, color: colors.primary, margin: '0 0 8px' }}>
              Algo salió mal
            </h1>
            <p style={{ fontFamily: font.body, fontSize: '14px', color: colors.textSecondary, margin: '0 0 24px', lineHeight: 1.6 }}>
              Ocurrió un error inesperado. Intenta recargar la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px', background: colors.accent, color: '#fff', border: 'none',
                borderRadius: '99px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: font.body,
              }}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
