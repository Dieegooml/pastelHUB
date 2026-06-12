import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ProductDetail from '../pages/public/ProductDetail';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ shop: 'test-shop', id: 'p1' }) };
});

vi.mock('../components/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock('../services/productsService', () => ({
  productsService: { getById: vi.fn(), getVariants: vi.fn() },
}));

vi.mock('../services/shopsService', () => ({
  shopsService: { getById: vi.fn() },
}));

const mockProduct = {
  id: 'p1',
  name: 'Pastel de Chocolate',
  price: 25,
  description: 'Delicioso pastel de chocolate artesanal',
  stock: 10,
  image_url: null,
  shop_id: 'shop1',
};

const mockShop = { id: 'shop1', name: 'Pastelería Delicias' };

const mockVariants = {
  data: [
    { type: 'size', value: 'Grande', extra_price: 5 },
    { type: 'size', value: 'Mediano', extra_price: 0 },
  ],
};

import * as productsModule from '../services/productsService';
import * as shopsModule from '../services/shopsService';

function renderProductDetail() {
  return render(
    <MemoryRouter>
      <ProductDetail />
    </MemoryRouter>
  );
}

describe('ProductDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('muestra skeleton loading inicialmente', async () => {
    productsModule.productsService.getById.mockReturnValue(new Promise(() => {}));
    renderProductDetail();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  it('muestra error cuando el producto no se encuentra', async () => {
    productsModule.productsService.getById.mockResolvedValue({});
    renderProductDetail();
    await waitFor(() => {
      const notFoundElements = screen.getAllByText('Producto no encontrado');
      expect(notFoundElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('muestra datos del producto', async () => {
    productsModule.productsService.getById.mockResolvedValue(mockProduct);
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getVariants.mockResolvedValue({ data: [] });
    renderProductDetail();
    await waitFor(() => {
      expect(screen.getByText('Pastel de Chocolate')).toBeInTheDocument();
    });
    expect(screen.getByText('Delicioso pastel de chocolate artesanal')).toBeInTheDocument();
    expect(screen.getByText('S/ 25.00')).toBeInTheDocument();
    expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
  });

  it('muestra y selecciona variantes', async () => {
    productsModule.productsService.getById.mockResolvedValue(mockProduct);
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getVariants.mockResolvedValue(mockVariants);
    renderProductDetail();
    await waitFor(() => {
      expect(screen.getByText('Grande (+S/ 5.00)')).toBeInTheDocument();
      expect(screen.getByText('Mediano')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Grande (+S/ 5.00)'));
    await waitFor(() => {
      expect(screen.getByText('S/ 30.00')).toBeInTheDocument();
    });
  });

  it('incrementa y decrementa cantidad', async () => {
    productsModule.productsService.getById.mockResolvedValue(mockProduct);
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getVariants.mockResolvedValue({ data: [] });
    renderProductDetail();
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
    const plusButton = screen.getByText('+');
    fireEvent.click(plusButton);
    expect(screen.getByText('2')).toBeInTheDocument();
    fireEvent.click(plusButton);
    expect(screen.getByText('3')).toBeInTheDocument();
    const minusButton = screen.getByText('−');
    fireEvent.click(minusButton);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('no decrementa por debajo de 1', async () => {
    productsModule.productsService.getById.mockResolvedValue(mockProduct);
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getVariants.mockResolvedValue({ data: [] });
    renderProductDetail();
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
    const minusButton = screen.getByText('−');
    fireEvent.click(minusButton);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('agrega al carrito', async () => {
    productsModule.productsService.getById.mockResolvedValue(mockProduct);
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getVariants.mockResolvedValue({ data: [] });
    renderProductDetail();
    await waitFor(() => {
      fireEvent.click(screen.getByText('Agregar al Carrito'));
    });
    const cart = JSON.parse(localStorage.getItem('cart'));
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe('p1');
    expect(cart[0].name).toBe('Pastel de Chocolate');
    expect(cart[0].price).toBe(25);
    expect(cart[0].quantity).toBe(1);
    expect(cart[0].shopId).toBe('shop1');
    expect(cart[0].shopName).toBe('Pastelería Delicias');
  });

  it('muestra toast de confirmacion al agregar', async () => {
    productsModule.productsService.getById.mockResolvedValue(mockProduct);
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getVariants.mockResolvedValue({ data: [] });
    renderProductDetail();
    await waitFor(() => {
      fireEvent.click(screen.getByText('Agregar al Carrito'));
    });
    await waitFor(() => {
      expect(screen.getByText('Pastel de Chocolate agregado al carrito')).toBeInTheDocument();
    });
  });

  it('incrementa cantidad si el producto ya esta en el carrito', async () => {
    localStorage.setItem('cart', JSON.stringify([{ id: 'p1', shopId: 'shop1', name: 'Pastel de Chocolate', price: 25, quantity: 1, variant: null }]));
    productsModule.productsService.getById.mockResolvedValue(mockProduct);
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getVariants.mockResolvedValue({ data: [] });
    renderProductDetail();
    await waitFor(() => {
      fireEvent.click(screen.getByText('Agregar al Carrito'));
    });
    const cart = JSON.parse(localStorage.getItem('cart'));
    expect(cart[0].quantity).toBe(2);
  });

  it('muestra "Agotado" cuando stock es 0', async () => {
    const outOfStock = { ...mockProduct, stock: 0 };
    productsModule.productsService.getById.mockResolvedValue(outOfStock);
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getVariants.mockResolvedValue({ data: [] });
    renderProductDetail();
    await waitFor(() => {
      const agotadoElements = screen.getAllByText('Agotado');
      expect(agotadoElements.length).toBeGreaterThanOrEqual(1);
    });
    const buttons = screen.getAllByRole('button');
    const addBtn = buttons.find(b => b.textContent === 'Agotado');
    expect(addBtn).toBeDisabled();
  });

  it('muestra aviso de stock bajo cuando stock <= 5', async () => {
    const lowStock = { ...mockProduct, stock: 3 };
    productsModule.productsService.getById.mockResolvedValue(lowStock);
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getVariants.mockResolvedValue({ data: [] });
    renderProductDetail();
    await waitFor(() => {
      expect(screen.getByText('Solo quedan 3 unidades')).toBeInTheDocument();
    });
  });

  it('muestra cantidad en stock cuando es mayor a 5', async () => {
    const highStock = { ...mockProduct, stock: 10 };
    productsModule.productsService.getById.mockResolvedValue(highStock);
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getVariants.mockResolvedValue({ data: [] });
    renderProductDetail();
    await waitFor(() => {
      expect(screen.getByText('10 en stock')).toBeInTheDocument();
    });
  });

  it('navega de vuelta a la tienda al hacer click en volver', async () => {
    productsModule.productsService.getById.mockResolvedValue(mockProduct);
    shopsModule.shopsService.getById.mockResolvedValue(mockShop);
    productsModule.productsService.getVariants.mockResolvedValue({ data: [] });
    renderProductDetail();
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Volver a/));
    });
    expect(mockNavigate).toHaveBeenCalledWith('/shops/shop1');
  });

  it('navega al presionar volver en la pantalla de error', async () => {
    productsModule.productsService.getById.mockResolvedValue({});
    renderProductDetail();
    await waitFor(() => {
      fireEvent.click(screen.getByText('Volver'));
    });
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
