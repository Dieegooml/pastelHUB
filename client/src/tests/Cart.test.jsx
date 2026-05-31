import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Cart from '../pages/customer/Cart';

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

const cartItems = [
  { id: 'p1', name: 'Pastel de chocolate', price: 25, quantity: 2, image_url: null },
  { id: 'p2', name: 'Cupcake vainilla', price: 8.5, quantity: 3, image_url: null },
];

function renderCart(items = []) {
  localStorage.setItem('cart', JSON.stringify(items));
  return render(
    <MemoryRouter>
      <Cart />
    </MemoryRouter>
  );
}

describe('Cart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('muestra carrito vacio cuando no hay items', async () => {
    renderCart([]);
    await waitFor(() => {
      expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    });
  });

  it('muestra contador de productos', async () => {
    renderCart(cartItems);
    await waitFor(() => {
      expect(screen.getByText('2 productos')).toBeInTheDocument();
    });
  });

  it('muestra boton Ir a pagar con items', async () => {
    renderCart(cartItems);
    await waitFor(() => {
      expect(screen.getByText('Ir a pagar')).toBeInTheDocument();
    });
  });

  it('navega a /checkout al hacer click en Ir a pagar', async () => {
    renderCart(cartItems);
    await waitFor(() => {
      fireEvent.click(screen.getByText('Ir a pagar'));
    });
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });

  it('navega a / al hacer click en Ver pastelerias (carrito vacio)', async () => {
    renderCart([]);
    await waitFor(() => {
      fireEvent.click(screen.getByText('Ver pastelerías'));
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('incrementa cantidad al hacer click en +', async () => {
    renderCart(cartItems);
    await waitFor(() => {
      const plusButtons = screen.getAllByText('+');
      fireEvent.click(plusButtons[0]);
    });
    const stored = JSON.parse(localStorage.getItem('cart'));
    expect(stored.find((i) => i.id === 'p1').quantity).toBe(3);
  });

  it('decrementa cantidad al hacer click en -', async () => {
    renderCart(cartItems);
    await waitFor(() => {
      const minusButtons = screen.getAllByText('−');
      fireEvent.click(minusButtons[0]);
    });
    const stored = JSON.parse(localStorage.getItem('cart'));
    expect(stored.find((i) => i.id === 'p1').quantity).toBe(1);
  });

  it('no decrementa por debajo de 1', async () => {
    const single = [{ id: 'p1', name: 'Test', price: 10, quantity: 1 }];
    renderCart(single);
    await waitFor(() => {
      const minusButton = screen.getAllByText('−')[0];
      fireEvent.click(minusButton);
    });
    const stored = JSON.parse(localStorage.getItem('cart'));
    expect(stored[0].quantity).toBe(1);
  });

  it('elimina item al hacer click en X', async () => {
    renderCart(cartItems);
    await waitFor(() => {
      const closeButtons = screen.getAllByText('✕');
      fireEvent.click(closeButtons[0]);
    });
    const stored = JSON.parse(localStorage.getItem('cart'));
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('p2');
  });

  it('vacia el carrito al hacer click en Vaciar carrito', async () => {
    renderCart(cartItems);
    await waitFor(() => {
      fireEvent.click(screen.getByText('Vaciar carrito'));
    });
    const stored = JSON.parse(localStorage.getItem('cart'));
    expect(stored).toHaveLength(0);
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
  });

  it('calcula total correctamente', async () => {
    renderCart(cartItems);
    await waitFor(() => {
      const total = 25 * 2 + 8.5 * 3;
      expect(screen.getByText(`S/ ${total.toFixed(2)}`)).toBeInTheDocument();
    });
  });
});
