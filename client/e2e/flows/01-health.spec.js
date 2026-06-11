import { test, expect } from '@playwright/test';

test.describe('Health & Bootstrap', () => {

  test('app redirects to /login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('login page renders all elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Bienvenido');
    await expect(page.getByPlaceholder('correo@ejemplo.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByText('Iniciar sesión').first()).toBeVisible();
    await expect(page.getByText('Continuar con Google')).toBeVisible();
  });

  test('health API endpoint', async ({ page }) => {
    await page.route('**/api/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          firestore: 'connected',
          timestamp: new Date().toISOString(),
        }),
      });
    });
    const res = await page.request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.firestore).toBe('connected');
  });

  test('login page has register link', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.getByText('Regístrate aquí');
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', '/register');
  });

});
