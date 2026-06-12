import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockUsersService = vi.hoisted(() => ({
  getAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  updateStatus: vi.fn(),
  getAddresses: vi.fn(),
  addAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
}));

vi.mock('../services/usersService', () => ({
  usersService: mockUsersService,
}));

vi.mock('../components/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock('../pages/admin/AdminNav', () => ({
  default: () => <nav data-testid="admin-nav">AdminNav</nav>,
}));

vi.mock('../../styles/useIsMobile', () => ({
  useIsMobile: () => false,
}));

import UsersPage from '../pages/admin/Users';

const mockUsers = {
  data: [
    { id: 'u1', full_name: 'Admin User', email: 'admin@test.com', roles: ['admin'], isActive: true, phone: '999000111' },
    { id: 'u2', full_name: 'Owner User', email: 'owner@test.com', roles: ['owner'], isActive: true },
    { id: 'u3', full_name: 'Customer User', email: 'customer@test.com', roles: ['customer'], isActive: false },
  ],
};

function renderComponent() {
  return render(
    <MemoryRouter>
      <UsersPage />
    </MemoryRouter>
  );
}

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsersService.getAll.mockResolvedValue(mockUsers);
  });

  it('muestra skeleton loading inicialmente', () => {
    mockUsersService.getAll.mockImplementationOnce(() => new Promise(() => {}));
    renderComponent();
    const skeleton = document.querySelector('[style*="shimmer"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('muestra tabla de usuarios con datos', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Owner User')).toBeInTheDocument();
      expect(screen.getByText('Customer User')).toBeInTheDocument();
    });
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('owner@test.com')).toBeInTheDocument();
    expect(screen.getByText('customer@test.com')).toBeInTheDocument();
  });

  it('muestra empty state cuando no hay usuarios', async () => {
    mockUsersService.getAll.mockResolvedValueOnce({ data: [] });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('No hay usuarios registrados')).toBeInTheDocument();
    });
  });

  it('muestra formulario de creacion', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Nuevo usuario')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mínimo 8 caracteres')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+51 999 999 999')).toBeInTheDocument();
    expect(screen.getByText('Crear usuario')).toBeInTheDocument();
  });

  it('abre formulario de edicion al hacer click en Editar', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('Editar usuario')).toBeInTheDocument();
      expect(screen.getByText('Guardar cambios')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('admin@test.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('999000111')).toBeInTheDocument();
  });

  it('elimina usuario after confirm', async () => {
    const originalConfirm = global.confirm;
    global.confirm = vi.fn(() => true);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(mockUsersService.delete).toHaveBeenCalledWith('u1');
    });
    expect(screen.getByText('Usuario eliminado correctamente')).toBeInTheDocument();
    global.confirm = originalConfirm;
  });

  it('cambia estado (activar/desactivar)', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    const statusBadges = screen.getAllByText(/Activo|Inactivo/);
    const activeBadge = statusBadges[0];
    fireEvent.click(activeBadge);
    await waitFor(() => {
      expect(mockUsersService.updateStatus).toHaveBeenCalledWith('u1', false);
    });
    expect(screen.getByText('Usuario desactivado')).toBeInTheDocument();
  });

  it('expande direcciones de usuario', async () => {
    mockUsersService.getAddresses.mockResolvedValueOnce([
      { address_id: 'a1', street: 'Av. Siempre Viva 123', city: 'Lima', is_default: true },
    ]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    const userName = screen.getByText('Admin User');
    fireEvent.click(userName);
    await waitFor(() => {
      expect(screen.getByText('Direcciones')).toBeInTheDocument();
      expect(screen.getByText('Av. Siempre Viva 123')).toBeInTheDocument();
      expect(screen.getByText('Lima')).toBeInTheDocument();
    });
  });

  it('muestra badges de roles', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    const adminBadges = screen.getAllByText('admin');
    const ownerBadges = screen.getAllByText('owner');
    const customerBadges = screen.getAllByText('customer');
    expect(adminBadges.length).toBeGreaterThanOrEqual(1);
    expect(ownerBadges.length).toBeGreaterThanOrEqual(1);
    expect(customerBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('cancela edicion al hacer click en Cancelar', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => {
      expect(screen.getByText('Nuevo usuario')).toBeInTheDocument();
    });
  });

  it('muestra error al cargar usuarios', async () => {
    mockUsersService.getAll.mockRejectedValueOnce(new Error('Network error'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Error al cargar usuarios')).toBeInTheDocument();
    });
  });

  it('contador de usuarios muestra cantidad correcta', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('crea un nuevo usuario exitosamente', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Juan Pérez')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => {
      expect(mockUsersService.create).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@test.com',
        password: 'password123',
        phone: '',
        roles: ['customer'],
      });
    });
    expect(screen.getByText('Usuario creado correctamente')).toBeInTheDocument();
  });

  it('actualiza un usuario exitosamente', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
    });
    const nameInput = screen.getByDisplayValue('Admin User');
    fireEvent.change(nameInput, { target: { value: 'Admin Updated' } });
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() => {
      expect(mockUsersService.update).toHaveBeenCalledWith('u1', {
        full_name: 'Admin Updated',
        phone: '999000111',
        roles: ['admin'],
      });
    });
    expect(screen.getByText('Usuario actualizado correctamente')).toBeInTheDocument();
  });

  it('no elimina si confirm es false', async () => {
    const originalConfirm = global.confirm;
    global.confirm = vi.fn(() => false);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);
    expect(mockUsersService.delete).not.toHaveBeenCalled();
    global.confirm = originalConfirm;
  });

  it('muestra Navbar y AdminNav', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('admin-nav')).toBeInTheDocument();
    });
  });

  it('maneja error al crear usuario', async () => {
    mockUsersService.create.mockRejectedValueOnce(new Error('Creation failed'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Juan Pérez')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), { target: { value: 'Fail User' } });
    fireEvent.change(screen.getByPlaceholderText('correo@ejemplo.com'), { target: { value: 'fail@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => {
      expect(screen.getByText('Error al guardar el usuario')).toBeInTheDocument();
    });
  });

  it('toggle de roles en el formulario', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
    });
    const roleCheckboxes = screen.getAllByRole('checkbox');
    expect(roleCheckboxes.length).toBeGreaterThanOrEqual(4);
  });

  it('expande y colapsa direcciones', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    const userName = screen.getByText('Admin User');
    fireEvent.click(userName);
    await waitFor(() => {
      expect(screen.getByText('Direcciones')).toBeInTheDocument();
    });
    fireEvent.click(userName);
    await waitFor(() => {
      expect(screen.queryByText('Direcciones')).not.toBeInTheDocument();
    });
  });
});
