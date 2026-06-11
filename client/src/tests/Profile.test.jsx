import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../pages/customer/Profile';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('firebase/auth', () => ({
  updatePassword: vi.fn(),
  getAuth: vi.fn(),
}));

vi.mock('../config/firebase', () => ({
  auth: {},
}));

vi.mock('../components/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock('../services/usersService', () => ({
  usersService: {
    getById: vi.fn(),
    update: vi.fn(),
    addAddress: vi.fn(),
    updateAddress: vi.fn(),
    deleteAddress: vi.fn(),
  },
}));

const mockUser = {
  uid: 'u1',
  email: 'cliente@test.com',
  displayName: 'Cliente Test',
  roles: ['customer'],
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, refreshUser: vi.fn() }),
}));

const mockUserData = {
  uid: 'u1',
  full_name: 'Cliente Test',
  phone: '999 888 777',
  email: 'cliente@test.com',
  roles: ['customer'],
  addresses: [
    { address_id: 'a1', street: 'Av. Principal 123', city: 'Lima', is_default: true },
    { address_id: 'a2', street: 'Jr. Secundaria 456', city: 'Miraflores', is_default: false },
  ],
};

import * as usersModule from '../services/usersService';

function renderProfile() {
  return render(
    <MemoryRouter>
      <Profile />
    </MemoryRouter>
  );
}

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el titulo de la pagina', async () => {
    usersModule.usersService.getById.mockResolvedValue(mockUserData);
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    });
  });

  it('muestra el email del usuario', async () => {
    usersModule.usersService.getById.mockResolvedValue(mockUserData);
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('cliente@test.com')).toBeInTheDocument();
    });
  });

  it('muestra el nombre completo cargado desde el servicio', async () => {
    usersModule.usersService.getById.mockResolvedValue(mockUserData);
    renderProfile();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Cliente Test')).toBeInTheDocument();
    });
  });

  it('muestra el telefono cargado desde el servicio', async () => {
    usersModule.usersService.getById.mockResolvedValue(mockUserData);
    renderProfile();
    await waitFor(() => {
      expect(screen.getByDisplayValue('999 888 777')).toBeInTheDocument();
    });
  });

  it('muestra el rol del usuario como badge', async () => {
    usersModule.usersService.getById.mockResolvedValue(mockUserData);
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Cliente')).toBeInTheDocument();
    });
  });

  it('muestra la seccion de direcciones', async () => {
    usersModule.usersService.getById.mockResolvedValue(mockUserData);
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Mis Direcciones')).toBeInTheDocument();
    });
  });

  it('muestra las direcciones del usuario', async () => {
    usersModule.usersService.getById.mockResolvedValue(mockUserData);
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Av. Principal 123')).toBeInTheDocument();
      expect(screen.getByText('Lima')).toBeInTheDocument();
      expect(screen.getByText('Jr. Secundaria 456')).toBeInTheDocument();
      expect(screen.getByText('Miraflores')).toBeInTheDocument();
    });
  });

  it('muestra badge de direccion por defecto', async () => {
    usersModule.usersService.getById.mockResolvedValue(mockUserData);
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Por defecto')).toBeInTheDocument();
    });
  });

  it('muestra el boton Agregar direccion', async () => {
    usersModule.usersService.getById.mockResolvedValue(mockUserData);
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('+ Agregar')).toBeInTheDocument();
    });
  });

  it('muestra la seccion de seguridad', async () => {
    usersModule.usersService.getById.mockResolvedValue(mockUserData);
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Seguridad')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument();
    });
  });

  it('muestra mensaje cuando no hay direcciones', async () => {
    const noAddrData = { ...mockUserData, addresses: [] };
    usersModule.usersService.getById.mockResolvedValue(noAddrData);
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('No tienes direcciones registradas.')).toBeInTheDocument();
    });
  });

  it('llama a usersService.getById con el uid del usuario', async () => {
    usersModule.usersService.getById.mockResolvedValue(mockUserData);
    renderProfile();
    await waitFor(() => {
      expect(usersModule.usersService.getById).toHaveBeenCalledWith('u1');
    });
  });
});
