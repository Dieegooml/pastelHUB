# PastelHub — Memory File for AI Agents

## Project Overview
Multi-tenant pastry shop marketplace ("Rappi for bakeries"). Customers order from local bakeries; admins manage everything; owners manage their shops/products/orders.

## Tech Stack
- **Frontend:** React 19 + Vite 8 + react-router-dom 7
- **Backend:** Node.js + Express 5 + Firebase Admin SDK
- **Database:** Firestore (NoSQL)
- **Auth:** Firebase Auth (email/password + Google) + Custom Claims for roles
- **Testing:** Jest 30 + Supertest (unit/integration), k6 (load)

## Project Structure
```
/
  client/          # React frontend (Vite)
    src/
      components/  # AuthLayout, ProtectedRoute, RateLimitDemo
      config/      # firebase.js (auth + googleProvider)
      context/     # AuthContext.jsx (onAuthStateChanged + roles)
      pages/       # Login, Register, NotFound, admin/Users, admin/Shops
      services/    # apiService, authService, shopsService, usersService, etc.
  server/          # Express backend
    src/
      app.js       # Express app (all routes mounted, rate limiters)
      server.js    # Entry point (app.listen)
      config/      # firebase.js (admin SDK init)
      middlewares/  # auth.js (verifyToken, requireAdmin)
      routes/      # 10 routers: auth, users, shops, products, orders, reviews, payments, notifications, reports, customers
    tests/         # setup.js + 6 test files
    TESTING.md     # Documentation for all 3 test types
  assets/          # diagramaPastelHUB.png (BD diagram)
  test-rate-limit.js  # Rate limiting demo script
  *.md             # README, API_ENDPOINTS, CLOUD_SETUP, RATE_LIMITING
```

## Key Design Decisions
1. **No `<form>` with onSubmit** — Use `onClick` on buttons instead
2. **All styles inline** — JS objects, no external UI libraries (Tailwind/MUI were in README but not actually used)
3. **Firebase Admin mocked in tests** — No `serviceAccountKey.json` dependency; mock in `tests/setup.js`
4. **Login/Register use modular Firebase API** — `signInWithEmailAndPassword`, `createUserWithEmailAndPassword` directly from `firebase/auth`
5. **`app.listen()` separated from `app.js`** — `server.js` handles listening so `app.js` can be imported by supertest
6. **Multiple roles via array** — `roles: ['admin','moderator','owner','customer']` in Firestore + synced to Custom Claims
7. **Auth handles password hashing** — Firebase Auth manages passwords, Firestore stores `password_hash: ''`
8. **No bcrypt** — Firebase Auth handles hashing natively
9. **Rate limiting** — 100 req/15min general, 10 req/15min auth endpoints
10. **clearMocks: true** — Global in jest.config, no manual `beforeEach` in test files

## Route Structure
| Route | Mounted At | Auth | Notes |
|-------|-----------|------|-------|
| Auth | `/api/auth` | verifyToken (sync/me), verifyToken+requireAdmin (assign-role) | authLimiter applied |
| Users | `/api/users` | verifyToken + requireAdmin | All routes |
| Shops | `/api/shops` | verifyToken + requireAdmin | All routes |
| Products | `/api/products` | verifyToken + requireAdmin | All routes |
| Orders | `/api/orders` | verifyToken + requireAdmin | All routes |
| Reviews | `/api/reviews` | verifyToken + requireAdmin | Recalculates shop rating on status change/delete |
| Payments | `/api/payments` | verifyToken + requireAdmin | 1:1 with orders |
| Notifications | `/api/notifications` | verifyToken + requireAdmin | Bulk create with batched writes |
| Reports | `/api/reports` | verifyToken + requireAdmin | Moderation system |
| Customers | `/api/customers` | verifyToken + requireAdmin | Separate from users (has own addresses subcollection) |

## Auth Flow
1. Frontend: Firebase Auth `signInWithEmailAndPassword` / `signInWithPopup(googleProvider)`
2. Frontend: Call `authService.sync()` → `POST /api/auth/sync` with Firebase ID token
3. Backend: `verifyToken` middleware decodes and verifies token via Firebase Admin
4. Backend: Auto-creates Firestore user doc on first sync
5. Frontend: `AuthContext` listens to `onAuthStateChanged`, reads roles from `getIdTokenResult`
6. `ProtectedRoute` checks `user.roles.includes(requiredRole)`, redirects to `/login` if unauthorized

## Firebase Collections
- `users` — Auth users with roles array, embedded addresses, isActive status
- `customers` — Customer profiles with `addresses` subcollection
- `pastryShops` — Shops with `schedules` and `categories` subcollections
- `products` — Products with `variants` subcollection
- `orders` — Orders with `items` subcollection, status history, embedded review
- `payments` — 1:1 with orders
- `reviews` — Linked to orders, moderation status, recalculates shop rating
- `notifications` — Per-user notifications
- `reports` — Moderation reports (target: review, shop, product)
- `chatSessions` — Dialogflow CX chatbot sessions

## Test Infrastructure
- **Command:** `npm test` (from server/)
- **Config:** `jest.config.js` — node env, setup file, clearMocks: true
- **Setup:** `tests/setup.js` — mocks firebase-admin, provides globals: `mockToken()`, `mockDocExists()`, `mockDocNotExists()`, `mockCollection()`
- **32 tests** across: health (3), middleware (5), auth (8), shops (6), users (10)
- **Missing tests:** reviews, payments, customers, notifications, products, orders, reports
- **Load test (Node.js):** `tests/load-test-runner.js` — 50 VUs (default), prueba todos los endpoints, genera HTML. Comando: `npm run load-test`
- **Load test (k6):** `tests/load-test.js` — k6 script (50 VUs, ramp stages). Comando: `npm run load-test:k6`
- **Rate limit test:** `test-rate-limit.js` — simulates 100+ requests

## Frontend Pages Built
- `/login` — Split-screen layout (AuthLayout), email/password + Google, Firebase error mapping, password toggle
- `/register` — Full validation, password strength meter, terms checkbox, Google auth
- `/admin/users` — Placeholder (`<h1>Gestion de Usuarios</h1>`)
- `/admin/shops` — Full CRUD UI with form and table via shopsService
- `/*` — 404 page with "En desarrollo"

## Frontend Pages Missing (Placeholders/Not Built)
- Shop detail page (public)
- Product detail page
- Cart / Checkout
- Order history / tracking
- Owner dashboard
- Profile / settings
- Admin dashboard

## State of Authentication
**WARNING:** `requireAdmin` middleware is applied to ALL routes (including shops, products, orders, etc.). In production, this should be relaxed for public endpoints:
- `GET /api/shops` — should be public or require only customer role
- `GET /api/products/shop/:shopId` — should be public
- `POST /api/orders` — should require customer role, not admin
- etc.

Role-specific middleware (`requireOwner`, `requireModerator`, `requireCustomer`) exists conceptually in README but is NOT implemented in `server/src/middlewares/auth.js`.

## Git History (most recent)
```
bb72709 feat: Montados routers de reviews, payments y customers
845bfa0 docs: Agregado diagrama de base de datos al README
7c1a1f9 docs: Agregado TESTING.md con documentacion de pruebas
e300f68 test: test unitarios (Jest) + script de carga (k6)
40ad814 test: Configuracion de Jest + separacion de server.js para testing
556de4b fix: Metodos CRUD arreglados, apiService enlazada y authenticacion arreglada
3e268a5 feat: Auth route
0bed9e6 Merge branch 'main' of https://github.com/Dieegooml/pastelHUB
93d9241 feat: CRUD para todas las colecciones realizadas
1e3c542 Update README.md
b229434 Add comprehensive README for PastelHub project
fe10f63 Primer commit: Modelos de BD subidos
```
