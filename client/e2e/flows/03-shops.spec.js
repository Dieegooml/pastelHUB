import { test, expect } from '@playwright/test';
import { setupPage } from '../helpers/mock-auth.js';
import { mockShops, mockProducts } from '../helpers/mock-data.js';

const apiHandlers = {
  'GET:/api/shops': (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockShops),
  }),
  'GET:/api/auth/sync': (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'synced' }),
  }),
  default: (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [] }),
  }),
};

test.describe('Shops List', () => {

  test.beforeEach(async ({ page }) => {
    await setupPage(page, { roles: ['customer'], apiHandlers });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('displays shops from API', async ({ page }) => {
    await expect(page.getByText('Pastelería Delicias')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Dulce Tentación')).toBeVisible();
    await expect(page.getByText('Panadería El Trigal')).toBeVisible();
  });

  test('search filters shops by name', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por nombre, ciudad...');
    await searchInput.fill('Delicias');
    await expect(page.getByText('Pastelería Delicias')).toBeVisible();
    await expect(page.getByText('Dulce Tentación')).not.toBeVisible();
    await expect(page.getByText('Panadería El Trigal')).not.toBeVisible();
  });

  test('search filters shops by city', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por nombre, ciudad...');
    await searchInput.fill('Arequipa');
    await expect(page.getByText('Pastelería Delicias')).not.toBeVisible();
    await expect(page.getByText('Dulce Tentación')).toBeVisible();
    await expect(page.getByText('Panadería El Trigal')).not.toBeVisible();
  });

  test('clear search button works', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por nombre, ciudad...');
    await searchInput.fill('Delicias');
    await expect(page.getByText('Pastelería Delicias')).toBeVisible();
    await expect(page.getByText('Dulce Tentación')).not.toBeVisible();
    const clearBtn = page.locator('button:has-text("✕")');
    await clearBtn.click();
    await expect(page.getByText('Pastelería Delicias')).toBeVisible();
    await expect(page.getByText('Dulce Tentación')).toBeVisible();
    await expect(page.getByText('Panadería El Trigal')).toBeVisible();
  });

  test('no results message shows for unmatched search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por nombre, ciudad...');
    await searchInput.fill('xyzzy');
    await expect(page.getByText('Sin resultados')).toBeVisible();
    await expect(page.getByText('No encontramos nada para "xyzzy"')).toBeVisible();
  });

  test('clicking shop navigates to detail', async ({ page }) => {
    const apiHandlersWithShop = {
      ...apiHandlers,
      'GET:/api/shops/shop-1': (route) => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockShops.data[0]),
      }),
      'GET:/api/products': (route) => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockProducts }),
      }),
    };
    await page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      const method = route.request().method();
      const key = `${method}:${path}`;
      if (apiHandlersWithShop[key]) return apiHandlersWithShop[key](route);
      if (apiHandlersWithShop.default) return apiHandlersWithShop.default(route);
      route.fulfill({ status: 404, body: '{}' });
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByText('Pastelería Delicias').click();
    await page.waitForURL(/\/shops\/shop-1/, { timeout: 5000 });
    expect(page.url()).toContain('/shops/shop-1');
  });

});
