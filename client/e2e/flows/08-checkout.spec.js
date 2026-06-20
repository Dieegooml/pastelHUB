import { test, expect } from '@playwright/test';
import { setupAuth, setupApiMocks } from '../helpers/mock-auth.js';
import { mockOrders } from '../helpers/mock-data.js';

test.describe('Checkout Flow', () => {

  const cartItems = [
    { id: 'prod-1', name: 'Torta de Chocolate', price: 45.00, quantity: 1, image_url: null, shopId: 'shop-1', shopName: 'Pastelería Delicias' },
    { id: 'prod-2', name: 'Alfajores de Maicena', price: 12.00, quantity: 2, image_url: null, shopId: 'shop-1', shopName: 'Pastelería Delicias' },
  ];

  test.beforeEach(async ({ page }) => {
    await setupAuth(page, { roles: ['customer'] });
    await setupApiMocks(page, {
      'POST:/api/orders': async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(mockOrders.data[0]),
        });
      },
    });
    await page.goto('/checkout');
    await page.evaluate(() => {
      localStorage.setItem('cart', JSON.stringify([
        { id: 'prod-1', name: 'Torta de Chocolate', price: 45.00, quantity: 1, image_url: null, shopId: 'shop-1', shopName: 'Pastelería Delicias' },
        { id: 'prod-2', name: 'Alfajores de Maicena', price: 12.00, quantity: 2, image_url: null, shopId: 'shop-1', shopName: 'Pastelería Delicias' },
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('displays cart items on checkout page', async ({ page }) => {
    await expect(page.getByText('1x Torta de Chocolate')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('2x Alfajores de Maicena')).toBeVisible();
    await expect(page.getByText('Resumen del pedido')).toBeVisible();
  });

  test('shows correct total and delivery fee', async ({ page }) => {
    const expectedSubtotal = 45.00 * 1 + 12.00 * 2;
    const expectedDelivery = 5;
    const expectedTotal = expectedSubtotal + expectedDelivery;
    await expect(page.getByText(`S/ ${expectedTotal.toFixed(2)}`)).toBeVisible();
  });

  test('allows selecting cash payment method', async ({ page }) => {
    await page.selectOption('select', 'cash');
    await expect(page.getByText(/Pagarás en efectivo/)).toBeVisible({ timeout: 5000 });
  });

  test('completes order with cash payment and shows success', async ({ page }) => {
    await page.fill('input[placeholder="Tu nombre"]', 'Cliente Test');
    await page.fill('input[placeholder="Av. Ejemplo 123"]', 'Av. Principal 456');
    await page.fill('input[placeholder="Lima"]', 'Lima');
    await page.selectOption('select', 'cash');

    await page.getByText(/Confirmar pedido/).click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Pedido confirmado')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Ver mis órdenes')).toBeVisible();
  });

  test('shows validation error when form is incomplete', async ({ page }) => {
    await page.getByText(/Confirmar pedido/).click();
    await expect(page.getByText('Completa los campos obligatorios')).toBeVisible({ timeout: 5000 });
  });

  test('redirects to cart when cart is empty', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('cart', '[]'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForURL(/\/cart/, { timeout: 5000 });
    expect(page.url()).toContain('/cart');
  });

});
