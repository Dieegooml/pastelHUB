import { test, expect } from '@playwright/test';
import { setupAuth } from '../helpers/mock-auth.js';

test.describe('Navigation', () => {

  test('redirects to /login when accessing protected routes without auth', async ({ page }) => {
    const routes = ['/', '/cart', '/checkout', '/my-orders', '/profile', '/notifications'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForURL(/\/login/, { timeout: 8000 });
      expect(page.url()).toContain('/login');
    }
  });

  test.describe('Authenticated as customer', () => {

    test.beforeEach(async ({ page }) => {
      await setupAuth(page, { roles: ['customer'] });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('navbar shows customer navigation buttons', async ({ page }) => {
      await expect(page.getByText('PastelHub').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Inicio')).toBeVisible();
      await expect(page.getByText('Carrito')).toBeVisible();
      await expect(page.getByText('Mis órdenes')).toBeVisible();
      await expect(page.getByText('Perfil')).toBeVisible();
    });

    test('navbar does not show owner/admin buttons for customer', async ({ page }) => {
      await expect(page.getByText('Dueño')).not.toBeVisible();
      await expect(page.getByText('Administrar')).not.toBeVisible();
      await expect(page.getByText('Moderar')).not.toBeVisible();
    });

    test('click Inicio stays on home page', async ({ page }) => {
      await page.getByText('Inicio').click();
      await expect(page).toHaveURL(/\/$/);
    });

    test('click Carrito navigates to cart', async ({ page }) => {
      await page.getByText('Carrito').click();
      await page.waitForURL(/\/cart/, { timeout: 5000 });
      expect(page.url()).toContain('/cart');
    });

    test('click Perfil navigates to profile', async ({ page }) => {
      await page.getByText('Perfil').click();
      await page.waitForURL(/\/profile/, { timeout: 5000 });
      expect(page.url()).toContain('/profile');
    });

    test('click Mis órdenes navigates to orders', async ({ page }) => {
      await page.getByText('Mis órdenes').click();
      await page.waitForURL(/\/my-orders/, { timeout: 5000 });
      expect(page.url()).toContain('/my-orders');
    });

  });

  test.describe('Authenticated as admin', () => {

    test.beforeEach(async ({ page }) => {
      await setupAuth(page, { roles: ['admin'] });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('navbar shows admin button', async ({ page }) => {
      await expect(page.getByText('Administrar')).toBeVisible({ timeout: 10000 });
    });

    test('click Administrar navigates to admin dashboard', async ({ page }) => {
      await page.getByText('Administrar').click();
      await page.waitForURL(/\/admin/, { timeout: 5000 });
      expect(page.url()).toContain('/admin');
    });

  });

  test.describe('Authenticated as owner', () => {

    test.beforeEach(async ({ page }) => {
      await setupAuth(page, { roles: ['owner'] });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('navbar shows owner button', async ({ page }) => {
      await expect(page.getByText('Dueño')).toBeVisible({ timeout: 10000 });
    });

  });

});
