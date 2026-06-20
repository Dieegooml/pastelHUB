import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ShopsList from '../pages/public/ShopsList';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../components/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock('../services/shopsService', () => ({
  shopsService: { getAll: vi.fn() },
}));

const mockShops = {
  data: [
    { id: 's1', shopName: 'Pastelería Delicias', city: 'Lima', description: 'La mejor pastelería', approvalStatus: 'approved', rating: 4.5, phone: '999000111', categories: ['Tortas', 'Cupcakes'], address: 'Av. Siempre Viva 742', bannerUrl: null, logoUrl: null },
    { id: 's2', shopName: 'Dulce Tentación', city: 'Arequipa', description: 'Postres artesanales', approvalStatus: 'approved', rating: 4.0, categories: [], address: '' },
    { id: 's3', shopName: 'Panadería El Pan', city: 'Cusco', description: 'Pan artesanal', approvalStatus: 'pending' },
  ],
};

import * as shopsModule from '../services/shopsService';

function renderShopsList() {
  return render(
    <MemoryRouter>
      <ShopsList />
    </MemoryRouter>
  );
}

describe('ShopsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('muestra skeleton loading inicialmente', () => {
    shopsModule.shopsService.getAll.mockReturnValue(new Promise(() => {}));
    renderShopsList();
    expect(document.querySelectorAll('.pastel-skeleton').length).toBeGreaterThan(0);
  });

  it('muestra error cuando falla la carga', async () => {
    shopsModule.shopsService.getAll.mockRejectedValue(new Error('Network error'));
    renderShopsList();
    await waitFor(() => {
      expect(screen.getByText('Error al cargar las pastelerías')).toBeInTheDocument();
    });
  });

  it('muestra mensaje vacío cuando no hay shops', async () => {
    shopsModule.shopsService.getAll.mockResolvedValue({ data: [] });
    renderShopsList();
    await waitFor(() => {
      expect(screen.getByText('No hay pastelerías disponibles')).toBeInTheDocument();
    });
  });

  it('muestra shops aprobados correctamente', async () => {
    shopsModule.shopsService.getAll.mockResolvedValue(mockShops);
    renderShopsList();
    await waitFor(() => {
      expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
      expect(screen.getByText('Dulce Tentación')).toBeInTheDocument();
    });
    expect(screen.getByText('Lima')).toBeInTheDocument();
    expect(screen.getByText('Arequipa')).toBeInTheDocument();
    expect(screen.getByText('La mejor pastelería')).toBeInTheDocument();
    expect(screen.getByText('Postres artesanales')).toBeInTheDocument();
    expect(screen.queryByText('Panadería El Pan')).not.toBeInTheDocument();
  });

  it('filtra por búsqueda', async () => {
    shopsModule.shopsService.getAll.mockResolvedValue(mockShops);
    renderShopsList();
    await waitFor(() => {
      expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText('Buscar por nombre, ciudad...');
    fireEvent.change(searchInput, { target: { value: 'Delicias' } });
    await waitFor(() => {
      expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
      expect(screen.queryByText('Dulce Tentación')).not.toBeInTheDocument();
    });
  });

  it('navega al hacer click en una shop card', async () => {
    shopsModule.shopsService.getAll.mockResolvedValue(mockShops);
    renderShopsList();
    await waitFor(() => {
      expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Pastelería Delicias'));
    expect(mockNavigate).toHaveBeenCalledWith('/shops/s1');
  });

  it('muestra "Sin resultados" cuando no hay match de búsqueda', async () => {
    shopsModule.shopsService.getAll.mockResolvedValue(mockShops);
    renderShopsList();
    await waitFor(() => {
      expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText('Buscar por nombre, ciudad...');
    fireEvent.change(searchInput, { target: { value: 'zzzzzz' } });
    await waitFor(() => {
      expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    });
  });

  it('muestra contador de pastelerías activas', async () => {
    shopsModule.shopsService.getAll.mockResolvedValue(mockShops);
    renderShopsList();
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('pastelerías activas')).toBeInTheDocument();
    });
  });
});
