import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Checkout from '../pages/customer/Checkout';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../components/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'u1', roles: ['customer'] } }),
}));

vi.mock('../services/ordersService', () => ({
  ordersService: { create: vi.fn() },
}));

vi.mock('../services/paymentsService', () => ({
  paymentsService: { processGateway: vi.fn() },
}));

const cartItems = [
  { id: 'p1', name: 'Pastel de chocolate', price: 25, quantity: 2, shopId: 's1' },
  { id: 'p2', name: 'Cupcake vainilla', price: 8.5, quantity: 3, shopId: 's1' },
];

function renderCheckout(items = []) {
  localStorage.setItem('cart', JSON.stringify(items));
  return render(
    <MemoryRouter>
      <Checkout />
    </MemoryRouter>
  );
}

describe('Checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('redirige a /cart si el carrito esta vacio', async () => {
    renderCheckout([]);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cart');
    });
  });

  it('muestra el formulario de checkout con items', async () => {
    renderCheckout(cartItems);
    await waitFor(() => {
      expect(screen.getByText('Checkout')).toBeInTheDocument();
      expect(screen.getByText('Datos de entrega')).toBeInTheDocument();
      expect(screen.getByText('Resumen del pedido')).toBeInTheDocument();
    });
  });

  it('muestra los items del carrito en el resumen', async () => {
    renderCheckout(cartItems);
    await waitFor(() => {
      expect(screen.getByText('Pastel de chocolate')).toBeInTheDocument();
      expect(screen.getByText('Cupcake vainilla')).toBeInTheDocument();
      expect(screen.getByText(/2x/)).toBeInTheDocument();
      expect(screen.getByText(/3x/)).toBeInTheDocument();
    });
  });

  it('muestra los campos obligatorios del formulario', async () => {
    renderCheckout(cartItems);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Tu nombre')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Av. Ejemplo 123')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Lima')).toBeInTheDocument();
    });
  });

  it('muestra el selector de metodo de pago', async () => {
    renderCheckout(cartItems);
    await waitFor(() => {
      expect(screen.getByText('💳 Tarjeta de crédito/débito')).toBeInTheDocument();
      expect(screen.getByText('💵 Efectivo')).toBeInTheDocument();
      expect(screen.getByText('📱 Yape')).toBeInTheDocument();
    });
  });

  it('muestra el total correctamente en el resumen', async () => {
    renderCheckout(cartItems);
    const expectedTotal = 25 * 2 + 8.5 * 3;
    await waitFor(() => {
      expect(screen.getByText(`S/ ${(expectedTotal + 5).toFixed(2)}`)).toBeInTheDocument();
    });
  });

  it('muestra mensaje de error al enviar sin completar campos', async () => {
    renderCheckout(cartItems);
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Confirmar pedido/));
    });
    await waitFor(() => {
      expect(screen.getByText('Completa los campos obligatorios')).toBeInTheDocument();
    });
  });

  it('muestra boton de confirmar pedido deshabilitado mientras carga', async () => {
    renderCheckout(cartItems);
    await waitFor(() => {
      const btn = screen.getByText(/Confirmar pedido/);
      expect(btn).not.toBeDisabled();
    });
  });
});
