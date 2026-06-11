import { test, expect } from '@playwright/test';
import { setupAuth } from '../helpers/mock-auth.js';

test.describe('Auth Flow', () => {

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/login');
    const loginBtn = page.getByText('Iniciar sesión').first();
    await loginBtn.click();
    await expect(page.getByText('El correo es obligatorio')).toBeVisible();
    await expect(page.getByText('La contraseña es obligatoria')).toBeVisible();
  });

  test('shows validation error for invalid email', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.getByPlaceholder('correo@ejemplo.com');
    await emailInput.fill('invalid-email');
    const passwordInput = page.getByPlaceholder('••••••••');
    await passwordInput.fill('password123');
    const loginBtn = page.getByText('Iniciar sesión').first();
    await loginBtn.click();
    await expect(page.getByText('Ingresa un correo válido')).toBeVisible();
  });

  test('shows validation error for email with spaces', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.getByPlaceholder('correo@ejemplo.com');
    await emailInput.fill('test @test.com');
    const passwordInput = page.getByPlaceholder('••••••••');
    await passwordInput.fill('password123');
    const loginBtn = page.getByText('Iniciar sesión').first();
    await loginBtn.click();
    await expect(page.getByText('Ingresa un correo válido')).toBeVisible();
  });

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.getByPlaceholder('••••••••');
    await passwordInput.fill('secret123');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    const toggleBtn = page.locator('button[tabindex="-1"]').first();
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('redirect to register page', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Regístrate aquí').click();
    await page.waitForURL(/\/register/, { timeout: 5000 });
    expect(page.url()).toContain('/register');
  });

  test('forgot password link shows reset mode', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('¿Olvidaste tu contraseña?').click();
    await expect(page.getByText('Enviar enlace de recuperación')).toBeVisible();
    await page.getByText('Volver al inicio de sesión').click();
    await expect(page.getByText('Iniciar sesión').first()).toBeVisible();
  });

});
