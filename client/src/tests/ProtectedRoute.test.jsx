import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import * as auth from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const renderWithRouter = (ui, { initialEntries = ['/'] } = {}) =>
  render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);

describe('ProtectedRoute', () => {
  it('redirige a /login si no hay usuario', () => {
    auth.useAuth.mockReturnValue({ user: null });
    renderWithRouter(<ProtectedRoute><div>Contenido</div></ProtectedRoute>);
    expect(screen.queryByText('Contenido')).not.toBeInTheDocument();
  });

  it('muestra el contenido si el usuario esta autenticado y no se requiere rol', () => {
    auth.useAuth.mockReturnValue({ user: { uid: 'u1', roles: ['customer'] } });
    renderWithRouter(<ProtectedRoute><div>Contenido</div></ProtectedRoute>);
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('muestra el contenido si el usuario tiene el rol requerido', () => {
    auth.useAuth.mockReturnValue({ user: { uid: 'u1', roles: ['admin'] } });
    renderWithRouter(<ProtectedRoute role="admin"><div>Admin</div></ProtectedRoute>);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('redirige si el usuario no tiene el rol requerido', () => {
    auth.useAuth.mockReturnValue({ user: { uid: 'u1', roles: ['customer'] } });
    renderWithRouter(<ProtectedRoute role="admin"><div>Admin</div></ProtectedRoute>);
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('acepta array de roles y permite si el usuario tiene alguno', () => {
    auth.useAuth.mockReturnValue({ user: { uid: 'u1', roles: ['owner'] } });
    renderWithRouter(<ProtectedRoute role={['owner', 'admin']}><div>Owner</div></ProtectedRoute>);
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('redirige si el usuario no tiene ningun rol del array', () => {
    auth.useAuth.mockReturnValue({ user: { uid: 'u1', roles: ['customer'] } });
    renderWithRouter(<ProtectedRoute role={['owner', 'admin']}><div>Owner</div></ProtectedRoute>);
    expect(screen.queryByText('Owner')).not.toBeInTheDocument();
  });
});
