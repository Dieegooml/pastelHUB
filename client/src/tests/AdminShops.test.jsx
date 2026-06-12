import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockShopsService = vi.hoisted(() => ({
  getAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

const mockUsersService = vi.hoisted(() => ({
  getAll: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/shopsService', () => ({
  shopsService: mockShopsService,
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

vi.mock('../styles/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('../components/ImageUploader', () => ({
  default: () => <div data-testid="image-uploader" />,
}));

import ShopsPage from '../pages/admin/Shops';

const mockShops = {
  data: [
    { id: 'shop1', shopName: 'Pastelería Delicias', city: 'Lima', approvalStatus: 'approved', shopDescription: 'La mejor pastelería de Lima', phone: '999000111' },
    { id: 'shop2', shopName: 'Dulce Tentación', city: 'Arequipa', approvalStatus: 'pending' },
  ],
};

const mockUsers = {
  data: [
    { id: 'u1', full_name: 'Juan Pérez', email: 'juan@test.com', roles: ['owner'] },
    { id: 'u2', full_name: 'Admin User', email: 'admin@test.com', roles: ['admin'] },
  ],
};

function renderComponent() {
  return render(
    <MemoryRouter>
      <ShopsPage />
    </MemoryRouter>
  );
}

describe('AdminShops', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShopsService.getAll.mockResolvedValue(mockShops);
    mockUsersService.getAll.mockResolvedValue(mockUsers);
  });

  it('muestra skeleton loading inicialmente', () => {
    mockShopsService.getAll.mockImplementationOnce(() => new Promise(() => {}));
    renderComponent();
    const skeleton = document.querySelector('[style*="shimmer"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('muestra tabla de pastelerías con datos', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
      expect(screen.getByText('Dulce Tentación')).toBeInTheDocument();
    });
    expect(screen.getByText('Lima')).toBeInTheDocument();
    expect(screen.getByText('Arequipa')).toBeInTheDocument();
  });

  it('muestra empty state cuando no hay shops', async () => {
    mockShopsService.getAll.mockResolvedValueOnce({ data: [] });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('No hay pastelerías registradas aún')).toBeInTheDocument();
    });
  });

  it('muestra formulario de creación con owner dropdown', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Nueva pastelería')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Ej: Dulce Tentación')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe tu pastelería...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Av. Principal 123')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Lima')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+51 999 999 999')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('contacto@ejemplo.com')).toBeInTheDocument();
    expect(screen.getByText('Crear pastelería')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez (juan@test.com)')).toBeInTheDocument();
    });
    expect(screen.queryByText('Admin User (admin@test.com)')).not.toBeInTheDocument();
  });

  it('abre formulario de edición al hacer click en Editar', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
    });
    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('Editar pastelería')).toBeInTheDocument();
      expect(screen.getByText('Guardar cambios')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('Pastelería Delicias')).toBeInTheDocument();
    expect(screen.getByDisplayValue('La mejor pastelería de Lima')).toBeInTheDocument();
    expect(screen.getByDisplayValue('999000111')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Lima')).toBeInTheDocument();
    expect(screen.getByText('Aprobado')).toBeInTheDocument();
  });

  it('elimina pastelería after confirm', async () => {
    const originalConfirm = global.confirm;
    global.confirm = vi.fn(() => true);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(mockShopsService.delete).toHaveBeenCalledWith('shop1');
    });
    expect(screen.getByText('Pastelería eliminada correctamente')).toBeInTheDocument();
    global.confirm = originalConfirm;
  });

  it('no elimina si confirm es false', async () => {
    const originalConfirm = global.confirm;
    global.confirm = vi.fn(() => false);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);
    expect(mockShopsService.delete).not.toHaveBeenCalled();
    global.confirm = originalConfirm;
  });

  it('muestra badge de estado (approved/pending)', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
    });
    expect(screen.getByText('approved')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('navega a productos al hacer click en Productos', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
    });
    const productButtons = screen.getAllByText('Productos');
    fireEvent.click(productButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/shops/shop1/products');
  });

  it('muestra ImageUploader components', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByTestId('image-uploader').length).toBe(2);
    });
  });

  it('cancela edición al hacer click en Cancelar', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
    });
    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => {
      expect(screen.getByText('Nueva pastelería')).toBeInTheDocument();
    });
  });

  it('muestra error al cargar shops', async () => {
    mockShopsService.getAll.mockRejectedValueOnce(new Error('Network error'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Error al cargar pastelerías')).toBeInTheDocument();
    });
  });

  it('crea una pastelería exitosamente', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ej: Dulce Tentación')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez (juan@test.com)')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('Ej: Dulce Tentación'), { target: { value: 'New Shop' } });
    fireEvent.change(screen.getByPlaceholderText('Describe tu pastelería...'), { target: { value: 'Description' } });
    fireEvent.change(screen.getByPlaceholderText('Av. Principal 123'), { target: { value: 'Av. Test 456' } });
    fireEvent.change(screen.getByPlaceholderText('Lima'), { target: { value: 'Lima' } });
    fireEvent.click(screen.getByText('Crear pastelería'));
    await waitFor(() => {
      expect(mockShopsService.create).toHaveBeenCalled();
    });
    expect(screen.getByText('Pastelería creada correctamente')).toBeInTheDocument();
  });

  it('actualiza una pastelería exitosamente', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
    });
    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Pastelería Delicias')).toBeInTheDocument();
    });
    const nameInput = screen.getByDisplayValue('Pastelería Delicias');
    fireEvent.change(nameInput, { target: { value: 'Pastelería Updated' } });
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() => {
      expect(mockShopsService.update).toHaveBeenCalledWith('shop1', expect.objectContaining({
        shopName: 'Pastelería Updated',
      }));
    });
    expect(screen.getByText('Pastelería actualizada correctamente')).toBeInTheDocument();
  });

  it('muestra Navbar y AdminNav', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('admin-nav')).toBeInTheDocument();
    });
  });

  it('maneja error al crear pastelería', async () => {
    mockShopsService.create.mockRejectedValueOnce(new Error('Creation failed'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ej: Dulce Tentación')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('Ej: Dulce Tentación'), { target: { value: 'Fail Shop' } });
    fireEvent.click(screen.getByText('Crear pastelería'));
    await waitFor(() => {
      expect(screen.getByText('Error al guardar la pastelería')).toBeInTheDocument();
    });
  });

  it('muestra contador de pastelerías', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('maneja error al eliminar pastelería', async () => {
    const originalConfirm = global.confirm;
    global.confirm = vi.fn(() => true);
    mockShopsService.delete.mockRejectedValueOnce(new Error('Delete failed'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('Error al eliminar la pastelería')).toBeInTheDocument();
    });
    global.confirm = originalConfirm;
  });
});
