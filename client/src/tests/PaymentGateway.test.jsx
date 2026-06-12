import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PaymentGateway from '../components/PaymentGateway';
import { paymentsService } from '../services/paymentsService';

let _testMethod = 'mercadopago';

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: (initial) => {
      if (initial === 'mercadopago') {
        const [value, setter] = actual.useState(_testMethod);
        return [value, setter];
      }
      return actual.useState(initial);
    },
  };
});

vi.mock('../services/paymentsService', () => ({
  paymentsService: {
    createPreference: vi.fn().mockResolvedValue({ preferenceId: 'pref123', initPoint: 'https://mp.com/pay/123' }),
    processGateway: vi.fn().mockResolvedValue({ success: true, paymentId: 'pay123' }),
  },
}));

const defaultProps = {
  orderIds: ['order1'],
  total: 50,
  onSuccess: vi.fn(),
  onError: vi.fn(),
  email: 'test@example.com',
};

function renderGateway(props = {}) {
  return render(<PaymentGateway {...defaultProps} {...props} />);
}

describe('PaymentGateway', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _testMethod = 'mercadopago';
    vi.stubEnv('VITE_MERCADOPAGO_PUBLIC_KEY', '');
  });

  it('muestra metodos de pago disponibles (5 metodos)', () => {
    renderGateway();

    expect(screen.getByText(/Paga con MercadoPago/)).toBeInTheDocument();
    expect(screen.getByText(/Modo simulado/)).toBeInTheDocument();
    expect(screen.getByText('Simular pago MercadoPago')).toBeInTheDocument();
  });

  it('muestra modo efectivo al seleccionar "Efectivo"', () => {
    _testMethod = 'cash';
    renderGateway();

    expect(screen.getByText(/Pagarás en efectivo al recibir tu pedido/)).toBeInTheDocument();
  });

  it('confirma pedido en efectivo (calls onSuccess)', () => {
    const onSuccess = vi.fn();
    _testMethod = 'cash';
    renderGateway({ onSuccess });

    fireEvent.click(screen.getByText('Confirmar pedido'));

    expect(onSuccess).toHaveBeenCalledWith({
      success: true,
      method: 'cash',
      message: 'Pagarás en efectivo al recibir',
    });
  });

  it('muestra modo simulado cuando no hay MP config (VITE_MERCADOPAGO_PUBLIC_KEY vacio)', () => {
    renderGateway();

    expect(screen.getByText(/Modo simulado/)).toBeInTheDocument();
    expect(screen.getByText(/MercadoPago no está configurado/)).toBeInTheDocument();
  });

  it('procesa pago con tarjeta', async () => {
    const onSuccess = vi.fn();
    _testMethod = 'yape';
    renderGateway({ onSuccess });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar pago/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ success: true, paymentId: 'pay123' });
    });
  });

  it('procesa pago con Yape', async () => {
    const onSuccess = vi.fn();
    _testMethod = 'yape';
    renderGateway({ onSuccess });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar pago/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ success: true, paymentId: 'pay123' });
    });
  });

  it('procesa pago con Plin', async () => {
    const onSuccess = vi.fn();
    _testMethod = 'plin';
    renderGateway({ onSuccess });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar pago/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ success: true, paymentId: 'pay123' });
    });
  });

  it('muestra error cuando falla el pago', async () => {
    paymentsService.processGateway.mockResolvedValue({ success: false, errorMessage: 'Fondos insuficientes' });

    _testMethod = 'yape';
    renderGateway();

    fireEvent.click(screen.getByRole('button', { name: /Confirmar pago/i }));

    await waitFor(() => {
      expect(screen.getByText('Fondos insuficientes')).toBeInTheDocument();
    });
  });

  it('muestra boton "Volver" cuando onBack esta presente', () => {
    _testMethod = 'cash';
    renderGateway({ onBack: vi.fn() });

    expect(screen.getByText('Volver')).toBeInTheDocument();
  });

  it('cambia de metodo de pago (de efectivo a tarjeta)', async () => {
    _testMethod = 'card';
    renderGateway();

    fireEvent.click(screen.getByText('Efectivo'));

    await waitFor(() => {
      expect(screen.getByText(/Pagarás en efectivo al recibir tu pedido/)).toBeInTheDocument();
    });
  });

  it('muestra error cuando paymentsService.processGateway lanza error', async () => {
    paymentsService.processGateway.mockRejectedValue(new Error('Network error'));

    _testMethod = 'yape';
    renderGateway();

    fireEvent.click(screen.getByRole('button', { name: /Confirmar pago/i }));

    await waitFor(() => {
      expect(screen.getByText('Error al procesar el pago')).toBeInTheDocument();
    });
  });
});
