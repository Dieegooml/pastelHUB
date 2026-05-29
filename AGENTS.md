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
  client/                     # React frontend (Vite)
    src/
      components/             # AuthLayout, ProtectedRoute, etc.
      config/                 # firebase.js (auth + googleProvider)
      context/                # AuthContext.jsx
      pages/
        admin/                # 11 pages: Dashboard, Users, Shops, Products, Orders, Reviews, Customers, Reports, Notifications, Payments, AdminNav
        customer/             # 6 pages: Cart, Checkout, MyOrders, OrderDetail, Profile, Notifications
        owner/                # 1 page: OwnerDashboard (749 lines, 5 tabs)
        public/               # 4 pages: Login, Register, ShopsList, ShopDetail, NotFound
      services/               # 12 services (apiService, authService, shopsService, ordersService, etc.)
  server/                     # Express backend
    src/
      app.js                  # Express app (all routes mounted, rate limiters)
      server.js               # Entry point (app.listen)
      config/                 # firebase.js (admin SDK init)
      middlewares/             # auth.js (6 middlewares), validate.js (Zod)
      routes/                 # 11 routers: auth, users, shops, products, orders, reviews, payments, notifications, reports, customers, promotions
      validators/             # 8 Zod validators: auth, user, review, payment, notification, report, customer, promotion
      utils/                  # paginate.js
    tests/
      unit/                   # 12 test files (239 tests)
      load/                   # k6 + Node.js load test scripts
      rate-limit/             # Rate limit demo
      setup.js                # Jest setup (mocks firebase-admin)
    TESTING.md
  assets/                     # diagramaPastelHUB.png
  *.md                        # README, API_ENDPOINTS, CLOUD_SETUP, RATE_LIMITING
```

## Key Design Decisions
1. **No `<form>` with onSubmit** — Use `onClick` on buttons instead
2. **All styles inline** — JS objects, no external UI libraries
3. **Firebase Admin mocked in tests** — No `serviceAccountKey.json` dependency; mock in `tests/setup.js`
4. **Login/Register use modular Firebase API** — `signInWithEmailAndPassword`, `createUserWithEmailAndPassword` directly from `firebase/auth`
5. **`app.listen()` separated from `app.js`** — `server.js` handles listening so `app.js` can be imported by supertest
6. **Multiple roles via array** — `roles: ['admin','moderator','owner','customer']` in Firestore + synced to Custom Claims
7. **Auth handles password hashing** — Firebase Auth manages passwords, Firestore stores `password_hash: ''`
8. **No bcrypt** — Firebase Auth handles hashing natively
9. **Rate limiting** — 100 req/15min general, 10 req/15min auth endpoints
10. **clearMocks: true** — Global in jest.config, no manual `beforeEach` in test files
11. **Validation via Zod** — All mutation endpoints use Zod schemas via `validate()` middleware
12. **Snake_case in Firestore** — Fields like `shop_id`, `is_active`, `owner_id`, `start_date`, `end_date`

## Route Structure
| Route | Mounted At | Auth Model | Notes |
|-------|-----------|-----------|-------|
| Auth | `/api/auth` | verifyToken (sync/me), admin (assign-role) | authLimiter applied |
| Users | `/api/users` | admin (list/create), self/admin (get/update), admin (delete/status) | Embedded addresses |
| Shops | `/api/shops` | **PUBLIC** (GETs), ownerOrAdmin (POST/PUT/DELETE), admin (status) | Schedules + categories subcollections |
| Products | `/api/products` | **PUBLIC** (GETs), ownerOrAdmin (POST/PUT/PATCH/DELETE) | Variants subcollection |
| Orders | `/api/orders` | admin (list), ownerOrAdmin (shop/status), customer (create/my/cancel), self/owner/admin (get/:id) | Items subcollection |
| Reviews | `/api/reviews` | **PUBLIC** (GET shop), moderator (status filter/status PATCH), customer (POST), self (PUT), owner/admin (reply) | Recalculates shop rating |
| Payments | `/api/payments` | admin (list/status), customer (POST), customer/owner/admin (get by order) | 1:1 with orders |
| Notifications | `/api/notifications` | admin (create/bulk), self/admin (read/delete) | Bulk create with batched writes |
| Reports | `/api/reports` | authenticated (POST), moderator (list/assign/status), self (PUT/DELETE) | Moderation system |
| Customers | `/api/customers` | admin (list), self/admin (get/addresses/delete) | Addresses subcollection |
| Promotions | `/api/promotions` | **PUBLIC** (GET active by shop), ownerOrAdmin (CRUD/toggle) | Types: discount, combo, bogo |

## Middlewares (server/src/middlewares/auth.js)
| Middleware | Logic | Used By |
|-----------|-------|---------|
| `verifyToken` | Verifies Firebase ID token, sets `req.user` | All protected routes |
| `requireAdmin` | `roles.includes('admin')` | Admin-only endpoints |
| `requireOwner` | `admin` or `owner` roles | Available but prefer `requireOwnerOrAdmin` |
| `requireModerator` | `admin` or `moderator` roles | Reviews (status), Reports (list/assign) |
| `requireCustomer` | `customer` or `admin` roles | Orders (create, my), Customers (create), Payments (create), Reviews (create) |
| `requireOwnerOrAdmin(fn)` | Dynamic — calls `fn(req)` to get owner ID, allows if admin or matching owner | Shops, Products, Orders, Promotions CRUD |

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
- `orders` — Orders with `items` subcollection, status history
- `payments` — 1:1 with orders, paymentStatus tracking
- `reviews` — Moderated reviews, recalculates shop rating
- `notifications` — Per-user notifications, bulk creation
- `reports` — Moderation reports (target: review, shop, product)
- `promotions` — Discounts, combos, BOGO with date range
- `chatSessions` — Dialogflow CX chatbot sessions (no routes built)

## Frontend Pages (23 total, all functional)
### Public (4)
- `/login` — Split-screen layout, email/password + Google, Firebase error mapping, password toggle
- `/register` — Full validation, password strength meter, terms checkbox, Google auth
- `/` (ShopsList) — Hero section, search bar, category filter, skeleton loading, shop cards
- `/shops/:id` (ShopDetail) — Banner, logo, products grid, add-to-cart, reviews list, schedule

### Customer (6)
- `/cart` — localStorage cart, quantity adjust, remove items, totals
- `/checkout` — Form with address, payment method selection, order submission
- `/my-orders` — Filter by status (pending/confirmed/preparing/delivered/cancelled), cancel pending
- `/my-orders/:id` (OrderDetail) — Timeline view, status tracking, review submission
- `/profile` — Edit name/phone/email, password change, address CRUD (add/edit/delete)
- `/notifications` — List with type icons, mark as read, delete

### Owner (1)
- `/owner` (OwnerDashboard) — 5 tabs: shop info (edit), products (CRUD), orders (status filter), promotions (CRUD + toggle), summary (sales analytics with charts)

### Admin (11)
- Dashboard — Stat cards, recent orders table
- Users — Full CRUD, role toggles, address management
- Shops — CRUD with schedules and categories
- Products — CRUD with variant management
- Orders — Status filter, payment status update, review management
- Reviews — Moderation (approve/reject), reply to reviews
- Customers — List and delete
- Reports — List, filter by status/type, assign moderator
- Notifications — Create single or bulk, list all
- Payments — List, filter by status, update status
- AdminNav — Sidebar navigation component

## Test Infrastructure
- **Command (server):** `npm test` — 254 tests, 13 suites
- **Command (load):** `npm run load-test` (Node.js) / `npm run load-test:k6` (k6)
- **Command (client):** `npm test` (Vitest) / `npm run test:watch`
- **Config (server):** `jest.config.js` — node env, setup file, clearMocks: true
- **Config (client):** `vite.config.js` — jsdom env, setup file, globals: true
- **Setup (server):** `tests/setup.js` — mocks firebase-admin, globals: `mockToken()`, `mockDocExists()`, `mockDocNotExists()`, `mockCollection()`, `mockFirestore`, `mockFirebaseAuth`
- **Setup (client):** `src/tests/setup.js` — imports `@testing-library/jest-dom`
- **13 test files (server):** health, middleware, auth, users, shops, products, orders, reviews, payments, notifications, reports, customers, promotions
- **1 test file (client):** ProtectedRoute (6 tests)

## Test Patterns (server)
```js
// Setup
global.mockToken('admin-uid', ['admin']);
global.mockDocExists({ email: 'test@test.com' });
global.mockDocNotExists();           // For 404 scenarios
global.mockCollection([{ id: 'r1', rating: 5 }]); // For list endpoints
global.mockFirestore.add.mockResolvedValue({ id: 'new-id' });
global.mockFirestore.update.mockResolvedValue();

// Request
const res = await request(app)
  .get('/api/endpoint')
  .set('Authorization', 'Bearer token-valido')
  .send({ /* body */ });

// Assert
expect(res.status).toBe(200);
expect(res.body.data).toHaveLength(1);
```

## Recent Git History
```
7eae6dd feat: migrar validación a Zod en todos los módulos
5ceaa60 refactor: unificar reseñas en colección reviews, eliminar endpoints duplicados en orders
638a99a feat: agregar índices compuestos faltantes a Firestore
1737022 fix: corregir middleware requireCustomer para validar roles correctamente
32c9ae8 docs: actualizar README y API_ENDPOINTS con nuevas funcionalidades (promociones, resumen, notificaciones)
90884c4 feat: agregar pestana Resumen al panel de dueno con graficas de ventas
ff41e7d feat: agregar endpoint GET summary con estadisticas de ventas por pasteleria
7b5162f feat: agregar pestana Promociones al panel de dueno con formulario de creacion/edicion
b291145 feat: agregar CRUD de promociones (descuentos, combos, 2x1) para duenos de pastelerias
31378dc feat: agregar campana de notificaciones con badge, dropdown y pagina de usuario
de50343 feat: agregar endpoint GET /unread/count para conteo de notificaciones no leidas
```

## Known Gaps
- `PATCH /api/orders/:id/cancel` uses manual uid check instead of `requireCustomer`
- No image upload (Firebase Storage)
- No real payment gateway integration
- No CI/CD or deployment config
