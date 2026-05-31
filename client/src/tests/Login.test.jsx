import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockSignIn = vi.hoisted(() => vi.fn());
const mockSignInPopup = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockRefreshUser = vi.hoisted(() => vi.fn());
const mockPost = vi.hoisted(() => vi.fn());
const mockResetPassword = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, Link: actual.Link };
});

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args) => mockSignIn(...args),
  signInWithPopup: (...args) => mockSignInPopup(...args),
}));

vi.mock('../config/firebase', () => ({ auth: {}, googleProvider: {} }));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ refreshUser: mockRefreshUser }),
}));

vi.mock('../services/apiService', () => ({
  api: { post: mockPost },
}));

vi.mock('../services/authService', () => ({
  authService: { resetPassword: (...args) => mockResetPassword(...args) },
}));

vi.mock('../components/AuthLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

import Login from '../pages/public/Login';

function renderLogin() {
  return render(<MemoryRouter><Login /></MemoryRouter>);
}

describe('Login', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renderiza el formulario de login', () => {
    renderLogin();
    expect(screen.getByText('Bienvenido de nuevo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
  });

  it('valida email vacio', async () => {
    renderLogin();
    fireEvent.click(screen.getByText('Iniciar sesión'));
    expect(await screen.findByText('El correo es obligatorio')).toBeInTheDocument();
  });

  it('valida contrasena vacia', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText('Iniciar sesión'));
    expect(await screen.findByText('La contraseña es obligatoria')).toBeInTheDocument();
  });

  it('valida formato de email', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'invalido' } });
    fireEvent.click(screen.getByText('Iniciar sesión'));
    expect(await screen.findByText('Ingresa un correo válido')).toBeInTheDocument();
  });

  it('llama a signInWithEmailAndPassword y navega al inicio', async () => {
    mockSignIn.mockResolvedValue({ user: { uid: 'u1' } });
    mockPost.mockResolvedValue({});
    mockRefreshUser.mockResolvedValue({});

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Iniciar sesión'));

    await waitFor(() => { expect(mockSignIn).toHaveBeenCalled(); });
    expect(mockSignIn).toHaveBeenCalledWith(expect.anything(), 'a@b.com', 'password123');
    expect(mockPost).toHaveBeenCalledWith('/auth/sync', {});
    expect(mockRefreshUser).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('muestra error Firebase invalid-credential', async () => {
    mockSignIn.mockRejectedValue({ code: 'auth/invalid-credential' });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('Iniciar sesión'));
    expect(await screen.findByText('Correo o contraseña incorrectos')).toBeInTheDocument();
  });

  it('muestra error too-many-requests', async () => {
    mockSignIn.mockRejectedValue({ code: 'auth/too-many-requests' });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('Iniciar sesión'));
    expect(await screen.findByText('Demasiados intentos. Intenta más tarde')).toBeInTheDocument();
  });

  it('muestra error generico si codigo no mapeado', async () => {
    mockSignIn.mockRejectedValue({ code: 'auth/unknown' });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('Iniciar sesión'));
    expect(await screen.findByText('Error al iniciar sesión')).toBeInTheDocument();
  });

  it('alterna visibilidad de contrasena', () => {
    renderLogin();
    const input = screen.getByPlaceholderText('••••••••');
    expect(input.type).toBe('password');
    fireEvent.click(screen.getByText('👁️'));
    expect(input.type).toBe('text');
    fireEvent.click(screen.getByText('🙈'));
    expect(input.type).toBe('password');
  });

  it('cambia a modo recuperacion', () => {
    renderLogin();
    fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
    expect(screen.getByText('Enviar enlace de recuperación')).toBeInTheDocument();
  });

  it('vuelve al login desde recuperacion', () => {
    renderLogin();
    fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
    fireEvent.click(screen.getByText('Volver al inicio de sesión'));
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
  });

  it('muestra loading durante envio', async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {}));
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'x' } });
    fireEvent.click(screen.getByText('Iniciar sesión'));
    expect(await screen.findByText('Iniciando sesión...')).toBeInTheDocument();
  });

  it('muestra enlace de registro', () => {
    renderLogin();
    expect(screen.getByText('Regístrate aquí')).toBeInTheDocument();
  });
});
