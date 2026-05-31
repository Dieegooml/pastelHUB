import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from '../components/ErrorBoundary';

const originalLocation = window.location;

beforeEach(() => {
  vi.clearAllMocks();
  delete window.location;
  window.location = { ...originalLocation, reload: vi.fn() };
});

afterAll(() => {
  window.location = originalLocation;
});

function Bomb({ shouldThrow }) {
  if (shouldThrow) throw new Error('Test error');
  return <div>Contenido sin error</div>;
}

describe('ErrorBoundary', () => {
  it('renderiza hijos cuando no hay error', () => {
    const { container } = render(
      <ErrorBoundary>
        <div>Hola mundo</div>
      </ErrorBoundary>
    );
    expect(container.textContent).toBe('Hola mundo');
  });

  it('captura el error y muestra la UI de fallback', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText('Recargar página')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('recarga la pagina al hacer click en Recargar', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByText('Recargar página'));
    expect(window.location.reload).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
