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

vi.mock('../services/websocketService', () => ({
  default: {
    onMessage: vi.fn(() => () => {}),
    onTyping: vi.fn(() => () => {}),
    onNotification: vi.fn(() => () => {}),
    sendMessage: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const NAV_TRANSLATIONS = {
  'nav.home': 'Inicio',
  'nav.cart': 'Carrito',
  'nav.orders': 'Mis órdenes',
  'nav.invoices': 'Facturas',
  'nav.support': 'Soporte',
  'nav.profile': 'Perfil',
  'nav.owner': 'Dueño',
  'nav.moderate': 'Moderar',
  'nav.admin': 'Administrar',
  'nav.logout': 'Cerrar sesión',
  'nav.spanish': 'Español',
  'nav.english': 'Inglés',
  'notifications.title': 'Notificaciones',
  'notifications.unread': 'sin leer',
  'notifications.noNotifications': 'Sin notificaciones',
  'notifications.viewAll': 'Ver todas',
};

vi.mock('../context/I18nContext', () => ({
  useI18n: () => ({
    t: (key, fallback) => NAV_TRANSLATIONS[key] ?? fallback ?? key,
    lang: 'es',
    setLang: vi.fn(),
  }),
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
    expect(screen.getAllByText('Perfil')[0]).toBeInTheDocument();
  });

  it('muestra boton Dueño si es owner', () => {
    renderNavbar({ uid: 'u1', roles: ['owner'] });
    expect(screen.getAllByText('Dueño')[0]).toBeInTheDocument();
  });

  it('oculta Dueño si no es owner', () => {
    renderNavbar({ uid: 'u1', roles: ['customer'] });
    expect(screen.queryByText('Dueño')).not.toBeInTheDocument();
  });

  it('muestra Moderar si es moderator', () => {
    renderNavbar({ uid: 'u1', roles: ['moderator'] });
    expect(screen.getAllByText('Moderar')[0]).toBeInTheDocument();
  });

  it('muestra Administrar si es admin', () => {
    renderNavbar({ uid: 'u1', roles: ['admin'] });
    expect(screen.getAllByText('Administrar')[0]).toBeInTheDocument();
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
