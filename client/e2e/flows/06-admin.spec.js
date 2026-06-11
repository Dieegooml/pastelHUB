import { test, expect } from '@playwright/test';
import { setupAuth } from '../helpers/mock-auth.js';

test.describe('Admin Routes', () => {

  test('redirects to /login when accessing admin routes without auth', async ({ page }) => {
    const adminRoutes = ['/admin', '/admin/users', '/admin/shops', '/admin/orders',
      '/admin/reviews', '/admin/customers', '/admin/reports',
      '/admin/notifications', '/admin/payments', '/admin/promotions'];
    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForURL(/\/login/, { timeout: 8000 });
      expect(page.url(), `${route} should redirect to /login`).toContain('/login');
    }
  });

  test('redirects customer user away from admin routes', async ({ page }) => {
    await setupAuth(page, { roles: ['customer'] });
    const adminRoutes = ['/admin', '/admin/users', '/admin/shops', '/admin/orders'];
    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForURL(/\//, { timeout: 8000 });
      expect(page.url(), `${route} should redirect away`).not.toContain('/admin');
    }
  });

  test('redirects owner user away from admin routes', async ({ page }) => {
    await setupAuth(page, { roles: ['owner'] });
    await page.goto('/admin');
    await page.waitForURL(/\//, { timeout: 8000 });
    expect(page.url()).not.toContain('/admin');
  });

  test('allows admin user to access admin dashboard', async ({ page }) => {
    await setupAuth(page, { roles: ['admin'] });
    await page.route('**/api/admin/**', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    }));
    await page.route('**/api/**', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    }));
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/admin/);
  });

});
