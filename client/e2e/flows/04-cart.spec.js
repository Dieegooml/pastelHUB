import { test, expect } from '@playwright/test';
import { setupAuth } from '../helpers/mock-auth.js';

test.describe('Cart Flow', () => {

  const cartItems = [
    { id: 'prod-1', name: 'Torta de Chocolate', price: 45.00, quantity: 1, image_url: null },
    { id: 'prod-2', name: 'Alfajores de Maicena', price: 12.00, quantity: 2, image_url: null },
  ];

  test.beforeEach(async ({ page }) => {
    await setupAuth(page, { roles: ['customer'] });
    await page.goto('/cart');
    await page.evaluate(() => {
      localStorage.setItem('cart', JSON.stringify([
        { id: 'prod-1', name: 'Torta de Chocolate', price: 45.00, quantity: 1, image_url: null },
        { id: 'prod-2', name: 'Alfajores de Maicena', price: 12.00, quantity: 2, image_url: null },
      ]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('displays cart items', async ({ page }) => {
    await expect(page.getByText('Torta de Chocolate')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Alfajores de Maicena')).toBeVisible();
    await expect(page.getByText('2 productos')).toBeVisible();
  });

  test('shows correct total price', async ({ page }) => {
    const expectedTotal = 45.00 * 1 + 12.00 * 2;
    await expect(page.getByText(`S/ ${expectedTotal.toFixed(2)}`)).toBeVisible();
  });

  test('increases item quantity', async ({ page }) => {
    const plusButtons = page.locator('button:has-text("+")');
    await plusButtons.first().click();
    await page.waitForTimeout(200);
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
    expect(cart[0].quantity).toBe(2);
  });

  test('decreases item quantity (minimum 1)', async ({ page }) => {
    const minusButtons = page.locator('button:has-text("−")');
    await minusButtons.first().click();
    await page.waitForTimeout(200);
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
    expect(cart[1].quantity).toBe(1);
  });

  test('does not decrease quantity below 1', async ({ page }) => {
    const minusButtons = page.locator('button:has-text("−")');
    await minusButtons.first().click();
    await page.waitForTimeout(200);
    await minusButtons.first().click();
    await page.waitForTimeout(200);
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
    expect(cart[0].quantity).toBe(1);
  });

  test('removes item from cart', async ({ page }) => {
    const removeButtons = page.locator('button:has-text("✕")');
    await removeButtons.first().click();
    await page.waitForTimeout(200);
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe('prod-2');
  });

  test('clear cart empties all items', async ({ page }) => {
    await page.getByText('Vaciar carrito').click();
    await page.waitForTimeout(200);
    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
    expect(cart).toHaveLength(0);
  });

  test('empty cart shows empty message', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('cart', '[]'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Tu carrito está vacío')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Explora las pastelerías')).toBeVisible();
  });

  test('navigates to checkout', async ({ page }) => {
    await page.getByText('Ir a pagar').click();
    await page.waitForURL(/\/checkout/, { timeout: 5000 });
    expect(page.url()).toContain('/checkout');
  });

});
