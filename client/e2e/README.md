# PastelHub E2E Tests

Playwright end-to-end tests for the PastelHub frontend.

## Prerequisites

- Vite dev server running on `http://localhost:5173`
- (Optional) Express server running on `http://localhost:3001` for real API calls

The `webServer` config in `playwright.config.js` auto-starts Vite if not running and `reuseExistingServer: true` lets you keep your own dev server.

## Quick Start

```bash
cd client
npm run test:e2e
```

This runs all tests in headless Chromium.

## Test Structure

```
client/e2e/
  playwright.config.js     # Playwright configuration
  global-setup.js          # Pre-test environment check
  helpers/
    mock-auth.js           # Firebase Auth mocking utilities
    mock-data.js           # Mock data for API responses
  flows/
    01-health.spec.js      # App boot, login page render, health API
    02-auth.spec.js        # Login form validation, password toggle, forgot password
    03-shops.spec.js       # Shops list, search, navigation to detail
    04-cart.spec.js        # Cart CRUD, quantity adjust, localStorage sync
    05-navigation.spec.js  # Navbar, protected routes, role-based visibility
    06-admin.spec.js       # Admin route protection, role gating
    07-404.spec.js         # 404 page render and navigation
  README.md
```

## How Firebase Auth Is Mocked

Firebase Auth can't use real credentials in CI. Each test that needs authentication uses `page.addInitScript()` to:

1. **Override `Storage.prototype.getItem`** — when Firebase Auth checks sessionStorage for a persisted user, it finds a mock user object with the correct roles.

2. **Override `window.fetch`** — intercepts calls to `identitytoolkit.googleapis.com` (sign-in) and `securetoken.googleapis.com` (token refresh), returning mock JWT tokens with proper claims.

3. **Mock JWT tokens** — base64-encoded header + payload (with `firebase.roles` array) + signature. Firebase Auth does not verify signatures client-side.

This makes the app believe a user is fully authenticated without any real Firebase calls.

## Mock Data

`helpers/mock-data.js` exports reusable mock objects for shops, products, orders, and notifications. Add more as needed.

## Writing Tests

### Basic test without auth (public pages)

```js
test('public page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('h1')).toContainText('Bienvenido');
});
```

### Test with auth (protected pages)

```js
import { setupAuth } from '../helpers/mock-auth.js';

test('protected page loads', async ({ page }) => {
  await setupAuth(page, { roles: ['customer'] });
  await page.goto('/');
  await expect(page.getByText('Pastelería Delicias')).toBeVisible();
});
```

### Test with API mocking

```js
import { setupPage } from '../helpers/mock-auth.js';
import { mockShops } from '../helpers/mock-data.js';

test('with API mocks', async ({ page }) => {
  await setupPage(page, {
    roles: ['customer'],
    apiHandlers: {
      'GET:/api/shops': (route) => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockShops),
      }),
    },
  });
  await page.goto('/');
});
```

### Test different roles

```js
await setupAuth(page, { roles: ['admin'] });           // Admin
await setupAuth(page, { roles: ['owner'] });            // Owner
await setupAuth(page, { roles: ['moderator'] });        // Moderator
await setupAuth(page, { roles: ['customer'] });         // Customer (default)
```

## Configuration

| Setting      | Value                  |
|-------------|------------------------|
| Browser     | Chromium (headless)    |
| Base URL    | http://localhost:5173   |
| Timeout     | 30s per test           |
| Retries     | 2 per test             |
| Reporter    | HTML (`playwright-report/`) |
| Trace       | On first retry         |

## CLI Commands

```bash
npm run test:e2e                  # Run all tests
npx playwright test --debug       # Run with Playwright inspector
npx playwright test --ui          # Run with Playwright UI mode
npx playwright test 01-health     # Run specific test file
npx playwright show-report        # View HTML report
```
