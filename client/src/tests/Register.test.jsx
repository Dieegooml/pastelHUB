import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockCreateUser = vi.hoisted(() => vi.fn());
const mockUpdateProfile = vi.hoisted(() => vi.fn());
const mockSignInPopup = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockRefreshUser = vi.hoisted(() => vi.fn());
const mockPost = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, Link: actual.Link };
});

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: (...args) => mockCreateUser(...args),
  updateProfile: (...args) => mockUpdateProfile(...args),
  signInWithPopup: (...args) => mockSignInPopup(...args),
}));

vi.mock('../config/firebase', () => ({ auth: {}, googleProvider: {} }));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ refreshUser: mockRefreshUser }),
}));

vi.mock('../services/apiService', () => ({
  api: { post: mockPost },
}));

vi.mock('../components/AuthLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

import Register from '../pages/public/Register';

function fillValidForm() {
  fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), { target: { value: 'Test User' } });
  fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'test@test.com' } });
  fireEvent.change(screen.getAllByPlaceholderText('Mínimo 8 caracteres')[0], { target: { value: 'Password1!' } });
  fireEvent.change(screen.getByPlaceholderText('Repite tu contraseña'), { target: { value: 'Password1!' } });
  fireEvent.click(screen.getByRole('checkbox'));
}

function renderRegister() {
  return render(<MemoryRouter><Register /></MemoryRouter>);
}

describe('Register', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renderiza el formulario', () => {
    renderRegister();
    expect(screen.getByText('Crear una cuenta')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('Mínimo 8 caracteres')[0]).toBeInTheDocument();
    expect(screen.getByText('Crear cuenta')).toBeInTheDocument();
  });

  it('valida nombre muy corto', async () => {
    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), { target: { value: 'ab' } });
    fireEvent.click(screen.getByText('Crear cuenta'));
    expect(await screen.findByText('El nombre debe tener al menos 3 caracteres')).toBeInTheDocument();
  });

  it('valida email invalido', async () => {
    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), { target: { value: 'Test User' } });
    fireEvent.click(screen.getByText('Crear cuenta'));
    expect(await screen.findByText('Ingresa un correo válido')).toBeInTheDocument();
  });

  it('valida contrasena debil', async () => {
    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getAllByPlaceholderText('Mínimo 8 caracteres')[0], { target: { value: 'short' } });
    fireEvent.click(screen.getByText('Crear cuenta'));
    expect(await screen.findByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
  });

  it('valida que las contrasenas coincidan', async () => {
    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getAllByPlaceholderText('Mínimo 8 caracteres')[0], { target: { value: 'Password1!' } });
    fireEvent.change(screen.getByPlaceholderText('Repite tu contraseña'), { target: { value: 'otra' } });
    fireEvent.click(screen.getByText('Crear cuenta'));
    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
  });

  it('valida que acepte terminos', async () => {
    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getAllByPlaceholderText('Mínimo 8 caracteres')[0], { target: { value: 'Password1!' } });
    fireEvent.change(screen.getByPlaceholderText('Repite tu contraseña'), { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByText('Crear cuenta'));
    expect(await screen.findByText('Debes aceptar los términos')).toBeInTheDocument();
  });

  it('registra exitosamente y navega al inicio', async () => {
    mockCreateUser.mockResolvedValue({ user: { uid: 'u1' } });
    mockUpdateProfile.mockResolvedValue();
    mockPost.mockResolvedValue({});
    mockRefreshUser.mockResolvedValue();

    renderRegister();
    fillValidForm();
    fireEvent.click(screen.getByText('Crear cuenta'));

    await waitFor(() => { expect(mockCreateUser).toHaveBeenCalled(); });
    expect(mockCreateUser).toHaveBeenCalledWith(expect.anything(), 'test@test.com', 'Password1!');
    expect(mockUpdateProfile).toHaveBeenCalled();
    expect(mockPost).toHaveBeenCalledWith('/auth/sync', { name: 'Test User' });
    expect(mockRefreshUser).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('muestra error email ya registrado', async () => {
    mockCreateUser.mockRejectedValue({ code: 'auth/email-already-in-use' });
    renderRegister();
    fillValidForm();
    fireEvent.click(screen.getByText('Crear cuenta'));
    expect(await screen.findByText('Este correo ya está registrado')).toBeInTheDocument();
  });

  it('muestra checklist al enfocar contrasena', () => {
    renderRegister();
    fireEvent.focus(screen.getAllByPlaceholderText('Mínimo 8 caracteres')[0]);
    expect(screen.getByText('La contraseña debe tener:')).toBeInTheDocument();
  });

  it('muestra fortaleza de contrasena', () => {
    renderRegister();
    fireEvent.change(screen.getAllByPlaceholderText('Mínimo 8 caracteres')[0], { target: { value: 'Password1!' } });
    expect(screen.getByText('Fuerte')).toBeInTheDocument();
  });

  it('muestra enlace de inicio de sesion', () => {
    renderRegister();
    expect(screen.getByText('Inicia sesión')).toBeInTheDocument();
  });

  it('deshabilita durante loading', async () => {
    mockCreateUser.mockImplementation(() => new Promise(() => {}));
    renderRegister();
    fillValidForm();
    fireEvent.click(screen.getByText('Crear cuenta'));
    expect(await screen.findByText('Creando cuenta...')).toBeInTheDocument();
  });
});
