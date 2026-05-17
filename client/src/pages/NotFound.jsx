import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', marginTop: '10vh' }}>
      <h1>404</h1>
      <h2>Página no encontrada</h2>
      <p>La página que buscas no existe o está en desarrollo.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  );
}
