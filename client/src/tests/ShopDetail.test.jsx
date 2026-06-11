import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ShopDetail from '../pages/public/ShopDetail';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: 's1' }) };
});

vi.mock('../components/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock('../services/shopsService', () => ({
  shopsService: { getById: vi.fn() },
}));

vi.mock('../services/productsService', () => ({
  productsService: { getByShop: vi.fn() },
}));

vi.mock('../services/reviewsService', () => ({
  reviewsService: { getByShop: vi.fn() },
}));

const mockShop = {
  id: 's1',
  shopName: 'Pastelería Delicias',
  city: 'Lima',
  address: 'Av. Siempre Viva 742',
  phone: '999 000 111',
  email: 'delicias@test.com',
  description: 'La mejor pastelería de Lima',
  rating: 4.5,
  approvalStatus: 'approved',
  delivery_range: 10,
  owner_name: 'Juan Pérez',
  schedules: [
    { day: 'Lunes', open: '09:00', close: '18:00' },
    { day: 'Martes', open: '09:00', close: '18:00' },
  ],
  categories: [
    { name: 'Tortas' },
    { name: 'Cupcakes' },
  ],
};

const mockProducts = {
  data: [
    { id: 'p1', name: 'Pastel de chocolate', price: 25, description: 'Delicioso pastel', category_id: 'cat1', is_available: true },
    { id: 'p2', name: 'Cupcake vainilla', price: 8.5, description: 'Esponjoso cupcake', category_id: 'cat2', is_available: true },
    { id: 'p3', name: 'Pastel fresa', price: 30, description: 'Pastel de fresas frescas', category_id: 'cat1', is_available: false },
  ],
};

import * as shopsModule from '../services/shopsService';
import * as productsModule from '../services/productsService';
import * as reviewsModule from '../services/reviewsService';

function renderShopDetail() {
  return render(
    <MemoryRouter>
      <ShopDetail />
    </MemoryRouter>
  );
}

describe('ShopDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('muestra estado de carga inicialmente', async () => {
    shopsModule.shopsService.getById.mockReturnValue(new Promise(() => {}));
    productsModule.productsService.getByShop.mockReturnValue(new Promise(() => {}));
    reviewsModule.reviewsService.getByShop.mockReturnValue(new Promise(() => {}));
    renderShopDetail();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  it('muestra los datos de la pasteleria al cargar', async () => {
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getByShop.mockResolvedValue(mockProducts);
    reviewsModule.reviewsService.getByShop.mockResolvedValue({ data: [] });
    renderShopDetail();
    await waitFor(() => {
      expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
    });
  });

  it('muestra la direccion de la pasteleria', async () => {
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getByShop.mockResolvedValue(mockProducts);
    reviewsModule.reviewsService.getByShop.mockResolvedValue({ data: [] });
    renderShopDetail();
    await waitFor(() => {
      const addressElements = screen.getAllByText(/Av. Siempre Viva 742/);
      expect(addressElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('muestra el rating de la pasteleria', async () => {
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getByShop.mockResolvedValue(mockProducts);
    reviewsModule.reviewsService.getByShop.mockResolvedValue({ data: [] });
    renderShopDetail();
    await waitFor(() => {
      expect(screen.getByText('4.5 / 5')).toBeInTheDocument();
    });
  });

  it('muestra los productos disponibles', async () => {
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getByShop.mockResolvedValue(mockProducts);
    reviewsModule.reviewsService.getByShop.mockResolvedValue({ data: [] });
    renderShopDetail();
    await waitFor(() => {
      expect(screen.getByText('Pastel de chocolate')).toBeInTheDocument();
      expect(screen.getByText('Cupcake vainilla')).toBeInTheDocument();
    });
  });

  it('filtra productos no disponibles', async () => {
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getByShop.mockResolvedValue(mockProducts);
    reviewsModule.reviewsService.getByShop.mockResolvedValue({ data: [] });
    renderShopDetail();
    await waitFor(() => {
      expect(screen.queryByText('Pastel fresa')).not.toBeInTheDocument();
    });
  });

  it('muestra el contador de productos', async () => {
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getByShop.mockResolvedValue(mockProducts);
    reviewsModule.reviewsService.getByShop.mockResolvedValue({ data: [] });
    renderShopDetail();
    await waitFor(() => {
      expect(screen.getByText('2 productos')).toBeInTheDocument();
    });
  });

  it('muestra el precio de los productos', async () => {
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getByShop.mockResolvedValue(mockProducts);
    reviewsModule.reviewsService.getByShop.mockResolvedValue({ data: [] });
    renderShopDetail();
    await waitFor(() => {
      expect(screen.getByText('S/ 25.00')).toBeInTheDocument();
      expect(screen.getByText('S/ 8.50')).toBeInTheDocument();
    });
  });

  it('muestra la descripcion de la pasteleria', async () => {
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getByShop.mockResolvedValue(mockProducts);
    reviewsModule.reviewsService.getByShop.mockResolvedValue({ data: [] });
    renderShopDetail();
    await waitFor(() => {
      expect(screen.getByText('La mejor pastelería de Lima')).toBeInTheDocument();
    });
  });

  it('muestra la seccion de horarios', async () => {
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getByShop.mockResolvedValue(mockProducts);
    reviewsModule.reviewsService.getByShop.mockResolvedValue({ data: [] });
    renderShopDetail();
    await waitFor(() => {
      expect(screen.getByText('Horarios')).toBeInTheDocument();
      expect(screen.getByText('Lunes')).toBeInTheDocument();
    });
  });

  it('muestra el horario con open y close', async () => {
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getByShop.mockResolvedValue(mockProducts);
    reviewsModule.reviewsService.getByShop.mockResolvedValue({ data: [] });
    renderShopDetail();
    await waitFor(() => {
      const scheduleDivs = screen.getAllByText(/09:00/);
      expect(scheduleDivs.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('agrega producto al carrito al hacer click en Agregar', async () => {
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getByShop.mockResolvedValue(mockProducts);
    reviewsModule.reviewsService.getByShop.mockResolvedValue({ data: [] });
    renderShopDetail();
    await waitFor(() => {
      const addButtons = screen.getAllByText('Agregar');
      fireEvent.click(addButtons[0]);
    });
    const cart = JSON.parse(localStorage.getItem('cart'));
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe('p1');
    expect(cart[0].quantity).toBe(1);
  });

  it('muestra toast al agregar producto', async () => {
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getByShop.mockResolvedValue(mockProducts);
    reviewsModule.reviewsService.getByShop.mockResolvedValue({ data: [] });
    renderShopDetail();
    await waitFor(() => {
      const addButtons = screen.getAllByText('Agregar');
      fireEvent.click(addButtons[0]);
    });
    await waitFor(() => {
      expect(screen.getByText('Pastel de chocolate agregado al carrito')).toBeInTheDocument();
    });
  });

  it('incrementa cantidad si el producto ya esta en el carrito', async () => {
    localStorage.setItem('cart', JSON.stringify([{ id: 'p1', shopId: 's1', name: 'Pastel de chocolate', price: 25, quantity: 1 }]));
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getByShop.mockResolvedValue(mockProducts);
    reviewsModule.reviewsService.getByShop.mockResolvedValue({ data: [] });
    renderShopDetail();
    await waitFor(() => {
      const addButtons = screen.getAllByText('Agregar');
      fireEvent.click(addButtons[0]);
    });
    const cart = JSON.parse(localStorage.getItem('cart'));
    expect(cart[0].quantity).toBe(2);
  });

  it('muestra mensaje de error cuando falla la carga', async () => {
    shopsModule.shopsService.getById.mockRejectedValue(new Error('Network error'));
    productsModule.productsService.getByShop.mockRejectedValue(new Error('Network error'));
    reviewsModule.reviewsService.getByShop.mockRejectedValue(new Error('Network error'));
    renderShopDetail();
    await waitFor(() => {
      expect(screen.getByText('Error al cargar la pastelería')).toBeInTheDocument();
    });
  });

  it('navega al inicio al hacer click en volver', async () => {
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getByShop.mockResolvedValue(mockProducts);
    reviewsModule.reviewsService.getByShop.mockResolvedValue({ data: [] });
    renderShopDetail();
    await waitFor(() => {
      fireEvent.click(screen.getByText('← Volver a pastelerías'));
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
