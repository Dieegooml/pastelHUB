import { test, expect } from '@playwright/test';

test.describe('404 Not Found', () => {

  test('shows 404 page for unknown routes', async ({ page }) => {
    await page.goto('/ruta-que-no-existe');
    await expect(page.getByText('404')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Página no encontrada')).toBeVisible();
    await expect(page.getByText('La página que buscas no existe')).toBeVisible();
  });

  test('shows 404 page for gibberish path', async ({ page }) => {
    await page.goto('/abc123/xyz/foo');
    await expect(page.getByText('404')).toBeVisible();
  });

  test('volver al inicio button navigates home', async ({ page }) => {
    await page.goto('/pagina-inexistente');
    await page.getByText('Volver al inicio').click();
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('404 page has PastelHub logo', async ({ page }) => {
    await page.goto('/no-existe');
    const logo = page.locator('img[alt="PastelHub"]');
    await expect(logo).toBeVisible();
  });

});
