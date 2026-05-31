import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '../pages/public/NotFound';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  );
}

describe('NotFound (404)', () => {
  it('muestra el numero 404', () => {
    renderNotFound();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('muestra boton Volver al inicio', () => {
    renderNotFound();
    expect(screen.getByText('Volver al inicio')).toBeInTheDocument();
  });

  it('navega a / al hacer click en Volver al inicio', () => {
    renderNotFound();
    fireEvent.click(screen.getByText('Volver al inicio'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
