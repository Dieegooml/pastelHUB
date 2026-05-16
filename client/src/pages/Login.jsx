import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin/users');
    } catch {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      alignItems: 'center', height: '100vh', background: '#f5f5f5'
    }}>
      <form onSubmit={handleLogin} style={{
        background: '#fff', padding: '2rem', borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '320px',
        display: 'flex', flexDirection: 'column', gap: '1rem'
      }}>
        <h2 style={{ textAlign: 'center', margin: 0 }}>🎂 PastelHub</h2>
        <p style={{ textAlign: 'center', color: '#888', margin: 0, fontSize: '14px' }}>
          Panel de administración
        </p>
        <input
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} required
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
        />
        <input
          type="password" placeholder="Contraseña" value={password}
          onChange={e => setPassword(e.target.value)} required
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
        />
        {error && <p style={{ color: 'red', fontSize: '13px', margin: 0 }}>{error}</p>}
        <button type="submit" style={{
          padding: '10px', background: '#1D9E75', color: '#fff',
          border: 'none', borderRadius: '6px', fontSize: '15px', cursor: 'pointer'
        }}>
          Ingresar
        </button>
      </form>
    </div>
  );
}