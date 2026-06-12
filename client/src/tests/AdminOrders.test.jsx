import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockOrdersService = vi.hoisted(() => ({
  getAll: vi.fn(),
  getByStatus: vi.fn(),
  updateStatus: vi.fn(),
  updatePaymentStatus: vi.fn(),
  delete: vi.fn(),
}));

const mockReviewsService = vi.hoisted(() => ({
  getByOrder: vi.fn(),
  create: vi.fn(),
  reply: vi.fn(),
}));

vi.mock('../services/ordersService', () => ({
  ordersService: mockOrdersService,
}));

vi.mock('../services/reviewsService', () => ({
  reviewsService: mockReviewsService,
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

import OrdersPage from '../pages/admin/Orders';

const mockOrders = {
  data: [
    {
      id: 'order1',
      created_at: { toDate: () => new Date('2025-01-15') },
      customer: { name: 'Cliente A', user_id: 'u1' },
      shop: { name: 'Pastelería Delicias', shop_id: 's1' },
      totals: { total: 50, subtotal: 45, delivery_fee: 5 },
      status: 'delivered',
      payment: { status: 'paid', method: 'yape' },
      items: [{ quantity: 2, name: 'Pastel', price_at_purchase: 25 }],
      status_history: ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered'],
    },
    {
      id: 'order2',
      created_at: { toDate: () => new Date('2025-01-16') },
      customer: { name: 'Cliente B' },
      shop: { name: 'Dulce Tentación' },
      totals: { total: 30, subtotal: 28, delivery_fee: 2 },
      status: 'pending',
      payment: { status: 'pending' },
      items: [],
      status_history: [],
    },
  ],
};

const mockReview = { id: 'r1', rating: 4, comment: 'Muy buen pastel', ownerReply: null };

function renderComponent() {
  return render(
    <MemoryRouter>
      <OrdersPage />
    </MemoryRouter>
  );
}

describe('AdminOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrdersService.getAll.mockResolvedValue(mockOrders);
    mockReviewsService.getByOrder.mockRejectedValue(new Error('No review'));
  });

  it('muestra skeleton loading inicialmente', () => {
    mockOrdersService.getAll.mockImplementationOnce(() => new Promise(() => {}));
    renderComponent();
    const skeleton = document.querySelector('[style*="shimmer"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('muestra tabla de órdenes con datos', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Cliente A')).toBeInTheDocument();
      expect(screen.getByText('Cliente B')).toBeInTheDocument();
    });
    expect(screen.getByText('Pastelería Delicias')).toBeInTheDocument();
    expect(screen.getByText('Dulce Tentación')).toBeInTheDocument();
    expect(screen.getByText('S/ 50.00')).toBeInTheDocument();
    expect(screen.getByText('S/ 30.00')).toBeInTheDocument();
  });

  it('muestra empty state cuando no hay órdenes', async () => {
    mockOrdersService.getAll.mockResolvedValueOnce({ data: [] });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('No hay órdenes que mostrar')).toBeInTheDocument();
    });
  });

  it('muestra empty state con filtro específico', async () => {
    mockOrdersService.getAll.mockResolvedValueOnce(mockOrders);
    mockOrdersService.getByStatus.mockResolvedValueOnce({ data: [] });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Cliente A')).toBeInTheDocument();
    });
    const filterButtons = screen.getAllByRole('button').filter(b => b.textContent === 'Pendiente');
    fireEvent.click(filterButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('No hay órdenes con estado "Pendiente"')).toBeInTheDocument();
    });
  });

  it('filtra por estado', async () => {
    mockOrdersService.getByStatus.mockResolvedValueOnce({ data: [mockOrders.data[1]] });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Cliente A')).toBeInTheDocument();
    });
    const pendButtons = screen.getAllByRole('button').filter(b => b.textContent === 'Pendiente');
    fireEvent.click(pendButtons[0]);
    await waitFor(() => {
      expect(mockOrdersService.getByStatus).toHaveBeenCalledWith('pending');
    });
    await waitFor(() => {
      expect(screen.getByText('Cliente B')).toBeInTheDocument();
    });
    expect(screen.queryByText('Cliente A')).not.toBeInTheDocument();
  });

  it('expande detalle de orden', async () => {
    mockReviewsService.getByOrder.mockResolvedValue(mockReview);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Cliente A')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cliente A'));
    await waitFor(() => {
      expect(screen.getByText(/S\/ 45\.00/)).toBeInTheDocument();
    });
    expect(screen.getByText(/S\/ 5\.00/)).toBeInTheDocument();
    expect(screen.getByText('2x')).toBeInTheDocument();
    expect(screen.getAllByText(/Pastel/).length).toBeGreaterThanOrEqual(1);
    await waitFor(() => {
      expect(screen.getByText('⭐'.repeat(4), { exact: false })).toBeInTheDocument();
    });
    expect(screen.getByText(/Muy buen pastel/)).toBeInTheDocument();
  });

  it('expande y muestra historial de estados', async () => {
    mockReviewsService.getByOrder.mockResolvedValue(mockReview);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Cliente A')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cliente A'));
    await waitFor(() => {
      expect(screen.getByText('Historial:')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Entregado').length).toBeGreaterThanOrEqual(2);
  });

  it('actualiza estado de orden', async () => {
    mockReviewsService.getByOrder.mockResolvedValue(mockReview);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Cliente A')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cliente A'));
    await waitFor(() => {
      expect(screen.getByText('2x')).toBeInTheDocument();
    });
    const statusSelects = screen.getAllByRole('combobox');
    const statusSelect = statusSelects[0];
    fireEvent.change(statusSelect, { target: { value: 'cancelled' } });
    const actualizarButtons = screen.getAllByText('Actualizar');
    fireEvent.click(actualizarButtons[0]);
    await waitFor(() => {
      expect(mockOrdersService.updateStatus).toHaveBeenCalledWith('order1', 'cancelled');
    });
    expect(screen.getByText('Estado actualizado')).toBeInTheDocument();
  });

  it('actualiza estado de pago', async () => {
    mockReviewsService.getByOrder.mockResolvedValue(mockReview);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Cliente A')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cliente A'));
    await waitFor(() => {
      expect(screen.getByText('2x')).toBeInTheDocument();
    });
    const selects = screen.getAllByRole('combobox');
    const paymentSelect = selects[1];
    fireEvent.change(paymentSelect, { target: { value: 'refunded' } });
    const buttons = screen.getAllByText('Actualizar');
    fireEvent.click(buttons[1]);
    await waitFor(() => {
      expect(mockOrdersService.updatePaymentStatus).toHaveBeenCalledWith('order1', 'refunded');
    });
    expect(screen.getByText('Estado de pago actualizado')).toBeInTheDocument();
  });

  it('elimina orden after confirm', async () => {
    const originalConfirm = global.confirm;
    global.confirm = vi.fn(() => true);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Cliente A')).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(mockOrdersService.delete).toHaveBeenCalledWith('order1');
    });
    expect(screen.getByText('Orden eliminada')).toBeInTheDocument();
    global.confirm = originalConfirm;
  });

  it('no elimina si confirm es false', async () => {
    const originalConfirm = global.confirm;
    global.confirm = vi.fn(() => false);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Cliente A')).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);
    expect(mockOrdersService.delete).not.toHaveBeenCalled();
    global.confirm = originalConfirm;
  });

  it('muestra badge de estado y pago', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Cliente A')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Entregado', { exact: false }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pendiente', { exact: false }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pagado', { exact: false }).length).toBeGreaterThanOrEqual(1);
  });

  it('maneja error al cargar órdenes', async () => {
    mockOrdersService.getAll.mockRejectedValueOnce(new Error('Network error'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Error al cargar órdenes')).toBeInTheDocument();
    });
  });

  it('muestra Navbar y AdminNav', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('admin-nav')).toBeInTheDocument();
    });
  });

  it('contador de órdenes muestra cantidad correcta', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('agrega reseña a orden entregada sin reseña', async () => {
    mockReviewsService.getByOrder.mockRejectedValue(new Error('No review'));
    mockReviewsService.create.mockResolvedValue({ id: 'r2', rating: 5, comment: 'Excelente' });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Cliente A')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cliente A'));
    await waitFor(() => {
      expect(screen.getByText('Agregar reseña:')).toBeInTheDocument();
    });
    const commentInput = screen.getByPlaceholderText('Comentario...');
    fireEvent.change(commentInput, { target: { value: 'Excelente servicio' } });
    fireEvent.click(screen.getByText('Agregar'));
    await waitFor(() => {
      expect(mockReviewsService.create).toHaveBeenCalledWith({
        orderId: 'order1',
        shopId: 's1',
        rating: 5,
        comment: 'Excelente servicio',
      });
    });
    expect(screen.getByText('Reseña agregada')).toBeInTheDocument();
  });

  it('responde a reseña existente', async () => {
    const reviewWithOwnerReply = { ...mockReview, ownerReply: '¡Gracias por tu compra!' };
    mockReviewsService.getByOrder.mockResolvedValue(mockReview);
    mockReviewsService.reply.mockResolvedValue(reviewWithOwnerReply);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Cliente A')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cliente A'));
    await waitFor(() => {
      expect(screen.getByText('Reseña:')).toBeInTheDocument();
    });
    const replyInput = screen.getByPlaceholderText('Escribe una respuesta...');
    fireEvent.change(replyInput, { target: { value: '¡Gracias por tu compra!' } });
    const replyButtons = screen.getAllByRole('button').filter(b => b.textContent === 'Responder');
    fireEvent.click(replyButtons[0]);
    await waitFor(() => {
      expect(mockReviewsService.reply).toHaveBeenCalledWith('r1', '¡Gracias por tu compra!');
    });
    expect(screen.getByText('Respuesta agregada')).toBeInTheDocument();
  });

  it('cambia filtro de vuelta a Todas', async () => {
    mockOrdersService.getByStatus.mockResolvedValueOnce({ data: [mockOrders.data[1]] });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Cliente A')).toBeInTheDocument();
    });
    const pendFilterBtns = screen.getAllByRole('button').filter(b => b.textContent === 'Pendiente');
    fireEvent.click(pendFilterBtns[0]);
    await waitFor(() => {
      expect(mockOrdersService.getByStatus).toHaveBeenCalledWith('pending');
    });
    fireEvent.click(screen.getByText('Todas'));
    await waitFor(() => {
      expect(mockOrdersService.getAll).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText('Cliente A')).toBeInTheDocument();
    });
  });
});
