import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useLocation: () => ({ pathname: '/' }) };
});

vi.mock('firebase/auth', () => ({ signOut: vi.fn() }));
vi.mock('../config/firebase', () => ({ auth: {} }));

vi.mock('../services/notificationsService', () => ({
  notificationsService: {
    getUnreadCount: vi.fn().mockResolvedValue({ count: 0 }),
    getUnreadByUser: vi.fn().mockResolvedValue([]),
    markAsRead: vi.fn().mockResolvedValue(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import Navbar from '../components/Navbar';
import * as authModule from '../context/AuthContext';

function renderNavbar(user) {
  vi.mocked(authModule.useAuth).mockReturnValue({ user });
  return render(<MemoryRouter initialEntries={['/']}><Navbar /></MemoryRouter>);
}

describe('Navbar', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renderiza logo y nombre', () => {
    renderNavbar(null);
    expect(screen.getByText('PastelHub')).toBeInTheDocument();
  });

  it('muestra botones basicos para customer', () => {
    renderNavbar({ uid: 'u1', roles: ['customer'] });
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Carrito')).toBeInTheDocument();
    expect(screen.getByText('Mis órdenes')).toBeInTheDocument();
    expect(screen.getByText('Soporte')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });

  it('muestra boton Dueño si es owner', () => {
    renderNavbar({ uid: 'u1', roles: ['owner'] });
    expect(screen.getByText('Dueño')).toBeInTheDocument();
  });

  it('oculta Dueño si no es owner', () => {
    renderNavbar({ uid: 'u1', roles: ['customer'] });
    expect(screen.queryByText('Dueño')).not.toBeInTheDocument();
  });

  it('muestra Moderar si es moderator', () => {
    renderNavbar({ uid: 'u1', roles: ['moderator'] });
    expect(screen.getByText('Moderar')).toBeInTheDocument();
  });

  it('muestra Administrar si es admin', () => {
    renderNavbar({ uid: 'u1', roles: ['admin'] });
    expect(screen.getByText('Administrar')).toBeInTheDocument();
  });

  it('no muestra Moderar si es admin', () => {
    renderNavbar({ uid: 'u1', roles: ['admin'] });
    expect(screen.queryByText('Moderar')).not.toBeInTheDocument();
  });

  it('muestra el email del usuario', () => {
    renderNavbar({ uid: 'u1', email: 'test@test.com', roles: ['customer'] });
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
  });

  it('muestra boton Cerrar sesion', () => {
    renderNavbar({ uid: 'u1', roles: ['customer'] });
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });
});
