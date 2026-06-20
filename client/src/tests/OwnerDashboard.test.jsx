import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import OwnerDashboard from '../pages/owner/OwnerDashboard';

vi.mock('../components/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'owner1' } }),
}));

vi.mock('../services/shopsService', () => ({
  shopsService: { getByOwner: vi.fn() },
}));

vi.mock('../pages/owner/OwnerTabInfo', () => ({
  default: ({ selectedShop }) => <div data-testid="owner-tab-info">{selectedShop.shopName}</div>,
}));

vi.mock('../pages/owner/OwnerTabProducts', () => ({
  default: ({ selectedShop }) => <div data-testid="owner-tab-products">{selectedShop.shopName}</div>,
}));

vi.mock('../pages/owner/OwnerTabOrders', () => ({
  default: ({ selectedShop }) => <div data-testid="owner-tab-orders">{selectedShop.shopName}</div>,
}));

vi.mock('../pages/owner/OwnerTabPromotions', () => ({
  default: ({ selectedShop }) => <div data-testid="owner-tab-promotions">{selectedShop.shopName}</div>,
}));

vi.mock('../pages/owner/OwnerTabSummary', () => ({
  default: ({ selectedShop }) => <div data-testid="owner-tab-summary">{selectedShop.shopName}</div>,
}));

vi.mock('../pages/owner/OwnerTabBoletas', () => ({
  default: ({ selectedShop }) => <div data-testid="owner-tab-boletas">{selectedShop.shopName}</div>,
}));

vi.mock('../context/I18nContext', () => ({
  useI18n: () => ({ t: (k) => k, lang: 'es', setLang: vi.fn() }),
}));

const mockShops = {
  data: [
    { id: 'shop1', shopName: 'Pastelería Delicias' },
    { id: 'shop2', shopName: 'Dulce Tentación' },
  ],
};

const mockSingleShop = {
  data: [{ id: 'shop1', shopName: 'Pastelería Delicias' }],
};

import * as shopsModule from '../services/shopsService';

function renderOwnerDashboard() {
  return render(
    <MemoryRouter>
      <OwnerDashboard />
    </MemoryRouter>
  );
}

describe('OwnerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Muestra skeleton loading inicialmente', async () => {
    shopsModule.shopsService.getByOwner.mockReturnValue(new Promise(() => {}));
    renderOwnerDashboard();
    expect(document.querySelectorAll('.pastel-skeleton').length).toBeGreaterThan(0);
    expect(screen.queryByText('No tienes pastelerías registradas')).not.toBeInTheDocument();
    expect(screen.queryByText('Panel de Dueño')).not.toBeInTheDocument();
  });

  it('Muestra "No tienes pastelerías registradas" cuando no hay shops', async () => {
    shopsModule.shopsService.getByOwner.mockResolvedValue({ data: [] });
    renderOwnerDashboard();
    await waitFor(() => {
      expect(screen.getByText('No tienes pastelerías registradas')).toBeInTheDocument();
    });
  });

  it('Muestra tabs y contenido de primera tab (info) cuando hay shops', async () => {
    shopsModule.shopsService.getByOwner.mockResolvedValue(mockSingleShop);
    renderOwnerDashboard();
    await waitFor(() => {
      expect(screen.getByText('Panel de Dueño')).toBeInTheDocument();
      expect(screen.getByText('Información')).toBeInTheDocument();
      expect(screen.getByText('Productos')).toBeInTheDocument();
      expect(screen.getByText('Órdenes')).toBeInTheDocument();
      expect(screen.getByText('Promociones')).toBeInTheDocument();
      expect(screen.getByText('Resumen')).toBeInTheDocument();
      expect(screen.getByText('Boletas')).toBeInTheDocument();
      expect(screen.getByTestId('owner-tab-info')).toHaveTextContent('Pastelería Delicias');
    });
  });

  it('Cambia de tab al hacer click', async () => {
    shopsModule.shopsService.getByOwner.mockResolvedValue(mockSingleShop);
    renderOwnerDashboard();
    await waitFor(() => {
      expect(screen.getByText('Productos')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Productos'));
    await waitFor(() => {
      expect(screen.getByTestId('owner-tab-products')).toHaveTextContent('Pastelería Delicias');
    });
  });

  it('Muestra selector de shops cuando hay más de una shop', async () => {
    shopsModule.shopsService.getByOwner.mockResolvedValue(mockShops);
    renderOwnerDashboard();
    await waitFor(() => {
      const deliciaButtons = screen.getAllByText('Pastelería Delicias');
      expect(deliciaButtons.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Dulce Tentación')).toBeInTheDocument();
    });
  });

  it('Cambia de shop al seleccionar otra en el selector', async () => {
    shopsModule.shopsService.getByOwner.mockResolvedValue(mockShops);
    renderOwnerDashboard();
    await waitFor(() => {
      expect(screen.getByText('Dulce Tentación')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Dulce Tentación'));
    await waitFor(() => {
      expect(screen.getByTestId('owner-tab-info')).toHaveTextContent('Dulce Tentación');
    });
  });
});
