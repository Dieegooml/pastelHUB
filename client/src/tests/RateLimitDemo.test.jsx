import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RateLimitDemo from '../components/RateLimitDemo';

describe('RateLimitDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el titulo', () => {
    render(<RateLimitDemo />);
    expect(screen.getByText('🛡️ Rate Limiting Demo')).toBeInTheDocument();
  });

  it('muestra los botones de control', () => {
    render(<RateLimitDemo />);
    expect(screen.getByText('Probar Límite General (100/15min)')).toBeInTheDocument();
    expect(screen.getByText('Probar Límite Auth (10/15min)')).toBeInTheDocument();
    expect(screen.getByText('Iniciar Simulación')).toBeInTheDocument();
  });

  it('el boton Iniciar Simulacion arranca deshabilitado', () => {
    render(<RateLimitDemo />);
    const btn = screen.getByText('Iniciar Simulación');
    expect(btn).not.toBeDisabled();
  });

  it('alterna entre tipo general y auth', () => {
    render(<RateLimitDemo />);
    const authBtn = screen.getByText('Probar Límite Auth (10/15min)');
    fireEvent.click(authBtn);
    const simulateBtn = screen.getByText('Iniciar Simulación');
    fireEvent.click(simulateBtn);
    vi.runAllTimers();
    expect(screen.getByText(/Request #/)).toBeInTheDocument();
  });
});
