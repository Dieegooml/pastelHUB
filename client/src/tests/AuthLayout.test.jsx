import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthLayout from '../components/AuthLayout';

describe('AuthLayout', () => {
  beforeEach(() => {
    window.innerWidth = 1024;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('muestra el titulo PastelHub en desktop', () => {
    render(<AuthLayout><div>Contenido</div></AuthLayout>);
    expect(screen.getByText('PastelHub')).toBeInTheDocument();
  });

  it('muestra el children en desktop', () => {
    render(<AuthLayout><div>Contenido</div></AuthLayout>);
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('muestra los bullets informativos', () => {
    render(<AuthLayout><div>Contenido</div></AuthLayout>);
    expect(screen.getByText('Múltiples pastelerías locales')).toBeInTheDocument();
    expect(screen.getByText('Productos personalizables')).toBeInTheDocument();
    expect(screen.getByText('Reseñas verificadas')).toBeInTheDocument();
  });

  it('oculta panel izquierdo en mobile', () => {
    window.innerWidth = 375;
    render(<AuthLayout><div>Mobile</div></AuthLayout>);
    expect(screen.getByText('Mobile')).toBeInTheDocument();
    expect(screen.queryByText('PastelHub')).not.toBeInTheDocument();
  });

  it('renderiza sin children', () => {
    render(<AuthLayout />);
    expect(screen.getByText('PastelHub')).toBeInTheDocument();
  });
});
