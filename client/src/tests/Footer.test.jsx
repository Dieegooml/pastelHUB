import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../components/Footer';
import * as authModule from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const renderFooter = () => render(
  <MemoryRouter initialEntries={['/']}>
    <Footer />
  </MemoryRouter>
);

describe('Footer sin usuario', () => {
  beforeEach(() => {
    authModule.useAuth.mockReturnValue({ user: null });
  });

  it('muestra el nombre PastelHub', () => {
    renderFooter();
    expect(screen.getByText('PastelHub')).toBeInTheDocument();
  });

  it('muestra enlace a Inicio', () => {
    renderFooter();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });

  it('muestra enlace a Carrito', () => {
    renderFooter();
    expect(screen.getByText('Carrito')).toBeInTheDocument();
  });

  it('no muestra Mis Ordenes si no hay usuario', () => {
    renderFooter();
    expect(screen.queryByText('Mis Órdenes')).not.toBeInTheDocument();
  });

  it('muestra Iniciar Sesion si no hay usuario', () => {
    renderFooter();
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
  });
});

describe('Footer con usuario', () => {
  beforeEach(() => {
    authModule.useAuth.mockReturnValue({ user: { uid: 'u1', email: 'test@test.com' } });
  });

  it('muestra Mis Ordenes si hay usuario', () => {
    renderFooter();
    expect(screen.getByText('Mis Órdenes')).toBeInTheDocument();
  });

  it('muestra saludo al usuario', () => {
    renderFooter();
    expect(screen.getByText(/Hola, test/)).toBeInTheDocument();
  });

  it('muestra Mis Tickets si hay usuario', () => {
    renderFooter();
    expect(screen.getByText('Mis Tickets')).toBeInTheDocument();
  });
});

describe('Footer oculto', () => {
  it('no renderiza en pagina de login', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Footer />
      </MemoryRouter>
    );
    expect(container.innerHTML).toBe('');
  });

  it('no renderiza en pagina de register', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Footer />
      </MemoryRouter>
    );
    expect(container.innerHTML).toBe('');
  });
});

describe('Footer copyright', () => {
  beforeEach(() => {
    authModule.useAuth.mockReturnValue({ user: null });
  });

  it('muestra el copyright', () => {
    renderFooter();
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${year} PastelHub`))).toBeInTheDocument();
  });
});
