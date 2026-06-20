# PastelHub — Memory File for AI Agents

## Project Overview
Multi-tenant pastry shop marketplace ("Rappi for bakeries"). Customers order from local bakeries; admins manage everything; owners manage their shops/products/orders.

## Tech Stack
- **Frontend:** React 19 + Vite 8 + react-router-dom 6 + Chakra UI 2 + framer-motion 11
- **Backend:** Node.js + Express 5 + Firebase Admin SDK
- **Database:** Firestore (NoSQL)
- **Auth:** Firebase Auth (email/password + Google) + Custom Claims for roles
- **Testing:** Jest 30 + Supertest (unit/integration), Vitest 4 (client), Playwright (E2E), k6 (load)
- **Cloud Run:** `pastelhub-server` (us-central1, 8 CPU, 4GB RAM, 500 concurrency, **5-25 min-instances**), backups + load tests
- **Cloud Storage:** `pastehub-2d2b2-backups` (us-central1, 30-day lifecycle)
- **Cloud Scheduler:** `daily-backup` (0 3 * * * → POST /api/admin/backup)
- **Artifact Registry:** `us-central1-docker.pkg.dev/pastehub-2d2b2/pastelhub/`
- **Service Accounts:** `scheduler-sa` (run.invoker + storage.objectAdmin)
- **Payments:** MercadoPago SDK integration (optional, falls back to simulated gateway)
- **Chat:** WebSocket (ws) for real-time messaging + Gemini AI chatbot
- **i18n:** Custom zero-dependency i18n (ES/EN) with 200+ translation keys
- **PWA:** Service Worker with cache-first for static assets + push notifications
- **Monitoring:** Cloud Monitoring dashboard + alert policies

## Project Structure
```
/
  client/                     # React frontend (Vite)
    e2e/                      # Playwright E2E tests (7 spec files, 42 tests)
      flows/                  # health, auth, shops, cart, navigation, admin, 404
      helpers/                # mock-auth.js, mock-data.js
    public/
      manifest.json           # PWA manifest
      sw.js                   # Service Worker (cache + offline)
    src/
      components/             # AuthLayout, ProtectedRoute, Chatbot, ImageUploader, PaymentGateway, etc.
      config/                 # firebase.js (auth + googleProvider + storage)
      context/                # AuthContext.jsx, I18nContext.jsx
      pages/
        admin/                # 14 pages: Dashboard, Users, Shops, Products, Orders, Reviews, Customers, Reports, Notifications, Payments, Promotions, Invoices, Chat, AdminNav
        customer/             # 10 pages: Cart, Checkout, MyOrders, OrderDetail, Profile, Notifications, Invoices, Support, SupportNew, SupportDetail
        moderator/            # 2 pages: ModeratorDashboard, ModeratorNav
        owner/                # 8 files: OwnerDashboard + 5 tabs + constants
        public/               # 6 pages: Login, Register, ShopsList, ShopDetail, ProductDetail, NotFound
      services/               # 18 services (apiService, authService, shopsService, ordersService, etc.)
      tests/                  # 13 Vitest test files (~175 tests)
      utils/                  # i18n.js (ES/EN translations), slug.js, markdown.js
      styles/                 # theme.js (inline style constants + CSS animation names)
  server/                     # Express backend
    src/
      app.js                  # Express app (16 routers, cache middleware, trace ID)
      server.js               # Entry point (app.listen + WebSocket + cron backup)
      constants.js            # Constantes centralizadas (ORDER_STATUSES, PAYMENT_METHODS, PROMOTION_TYPES, etc.)
      config/                 # firebase.js (admin SDK init), mercadopago.js
      middlewares/             # auth.js (9 middlewares), validate.js (Zod)
      routes/                 # 16 routers: auth, users, shops, products, orders, reviews, payments, notifications, reports, customers, promotions, support, invoices, chat, backups, uploads
      validators/             # 14 Zod validators: auth, user, shop, product, order, review, payment, notification, report, customer, promotion, support, invoice, chat
      utils/                  # cache.js, mappers.js, paginate.js, backupService.js, restoreService.js, websocket.js, aiHelper.js, fcmService.js, autoNotify.js, auditLog.js, logger.js
    tests/
      unit/                   # 17 test files (~450+ tests)
      load/                   # k6 + Node.js load test scripts
      setup.js                # Jest setup (mocks firebase-admin)
      setup-backup.js         # Backup test helpers
    TESTING.md
  assets/                     # diagramaPastelHUB.png
  cloud-monitoring.json       # Cloud Monitoring dashboard (10 widgets)
  deploy/                     # alert-policies.yaml (5 alerts)
  *.md                        # README, API_ENDPOINTS, CLOUD_SETUP
```

## Key Design Decisions
1. **No `<form>` with onSubmit** — Use `onClick` on buttons instead
2. **Styles via Chakra UI + inline JS objects** — Chakra UI v2 for components/theme, framer-motion for animations, custom CSS keyframes
3. **Firebase Admin mocked in tests** — No `serviceAccountKey.json` dependency; mock in `tests/setup.js`
4. **Login/Register use modular Firebase API** — `signInWithEmailAndPassword`, `createUserWithEmailAndPassword` directly from `firebase/auth`
5. **`app.listen()` separated from `app.js`** — `server.js` handles listening so `app.js` can be imported by supertest
6. **Multiple roles via array** — `roles: ['admin','moderator','owner','customer']` in Firestore + synced to Custom Claims
7. **Auth handles password hashing** — Firebase Auth manages passwords, Firestore stores `password_hash: ''`
8. **No bcrypt** — Firebase Auth handles hashing natively
10. **clearMocks: true** — Global in jest.config, no manual `beforeEach` in test files
10. **Validation via Zod** — All mutation endpoints use Zod schemas via `validate()` middleware
11. **Snake_case in Firestore** — Fields like `shop_id`, `is_active`, `owner_id`, `start_date`, `end_date`
12. **Seed masivo** — `npm run seed-data` (o `seed-data:clean` para limpiar antes) genera ~285 documentos con @faker-js/faker
13. **Cache system** — In-memory TTL cache with LRU eviction, 5 named stores (shops, products, promotions, reviews, notificationCount), per-store stats, periodic cleanup
14. **Backup history persisted** — Backup metadata stored in Firestore `backupHistory` collection, survives restarts
15. **i18n internal** — Custom zero-dependency i18n with `t(key)` function and `I18nContext`
16. **WebSocket** — Real-time chat + notifications via `ws` library, auto-reconnect, heartbeat
17. **MercadoPago** — Real payment gateway with webhook HMAC verification, auto-fallback to simulated

## Route Structure (16 routers)
| Route | Mounted At | Auth Model | Notes |
|-------|-----------|-----------|-------|
| Auth | `/api/auth` | verifyToken (sync/me), admin/moderator (assign-role) |
| Users | `/api/users` | moderator/admin (list), admin (create), self/staff (get/update), admin (delete/status) | Embedded addresses |
| Shops | `/api/shops` | **PUBLIC** (GETs), ownerOrAdmin (POST/PUT/DELETE), admin (status) | Schedules + categories subcollections |
| Products | `/api/products` | **PUBLIC** (GETs), ownerOrAdmin (POST/PUT/PATCH/DELETE) | Variants subcollection |
| Orders | `/api/orders` | admin (list), ownerOrAdmin (shop/status), customer (create/my/cancel), self/owner/admin (get) | Status machine |
| Reviews | `/api/reviews` | **PUBLIC** (GET shop), moderator (status), customer (POST), self (PUT), owner/admin (reply) | Recalculates shop rating |
| Payments | `/api/payments` | admin (list/status), customer (POST), owner/admin (update/delete/gateway) | MercadoPago integration |
| Notifications | `/api/notifications` | admin (create/bulk), self/admin (read/delete) | WebSocket push |
| Reports | `/api/reports` | authenticated (POST), moderator (list/assign/status), self (PUT/DELETE) | Moderation system |
| Customers | `/api/customers` | admin (list), self/admin (get/addresses/delete) | Addresses subcollection |
| Promotions | `/api/promotions` | **PUBLIC** (GET active), ownerOrAdmin (CRUD/toggle) | Types: discount, combo, bogo |
| Support | `/api/support` | authenticated (tickets), moderator (status/assign) | Messages subcollection |
| Invoices | `/api/invoices` | admin (generate), authenticated (list), ownerOrAdmin (by-shop) | PDF via PDFKit |
| Chat | `/api/chat` | verifyToken | Gemini AI + WebSocket |
| Backups | `/api/admin/backup` | admin only | GCS upload + Firestore history + restore |
| Uploads | `/api/uploads` | verifyToken (self), admin | Firebase Storage images (base64) |

## Middlewares (server/src/middlewares/)
### auth.js (9 middlewares)
| Middleware | Logic | Used By |
|-----------|-------|---------|
| `verifyToken` | Verifies Firebase ID token, sets `req.user` | All protected routes |
| `requireAdmin` | `roles.includes('admin')` | Admin-only endpoints |
| `requireOwner` | `roles.includes('admin')` or `roles.includes('owner')` | Simple role gate |
| `requireModerator` | `admin` or `moderator` roles | Reviews (status), Reports (list/assign), Users (list) |
| `requireCustomer` | `customer` or `admin` roles | Orders (create, my), Customers (create), Payments (create) |
| `requireOwnerOrAdmin(fn)` | Dynamic — calls `fn(req)` to get owner ID | Shops, Products, Orders, Promotions CRUD |
| `requireSelfOrAdmin(param)` | Factory: admin or `uid === param` | Customers, Notifications |
| `requireAssignRole` | admin (any), moderator (except admin) | Auth (assign-role) |
| `requireSelfOrStaff(param)` | Factory: admin/moderator or `uid === param` | Users (get/update) |



## Cache System (server/src/utils/cache.js)
- `createStore(name, { ttl, maxEntries })` — Creates a named cache store
- `get(store, key)` / `set(store, key, data)` / `del(store, key)` / `clear(store)`
- `invalidatePrefix(store, prefix)` — Invalidate by key prefix
- `stats(store)` / `allStats()` — Per-store hit/miss/eviction stats
- LRU eviction when max entries exceeded
- 30s periodic cleanup of expired entries
- Stores: `shops` (60s), `products` (60s), `promotions` (60s), `reviews` (30s), `notificationCount` (15s)

## WebSocket (server/src/utils/websocket.js)
- Attached to HTTP server, authenticated via `?token=` query (Firebase ID token)
- Events: `chat:message`, `chat:typing`, `chat:read`, `notification:read`, `notification:new`
- Heartbeat: server ping every 30s, disconnect stale
- `pushNotification(userId, data)` — Push to all user's WS connections

## Auth Flow
1. Frontend: Firebase Auth `signInWithEmailAndPassword` / `signInWithPopup(googleProvider)`
2. Frontend: Call `authService.sync()` → `POST /api/auth/sync` with Firebase ID token
3. Backend: `verifyToken` middleware decodes and verifies token via Firebase Admin
4. Backend: Auto-creates Firestore user doc on first sync
5. Frontend: `AuthContext` listens to `onAuthStateChanged`, reads roles from `getIdTokenResult`
6. `ProtectedRoute` checks `user.roles.includes(requiredRole)`, redirects to `/login` if unauthorized

## Firebase Collections
- `users` — Auth users with roles array, embedded addresses, isActive status, fcmTokens subcollection
- `customers` — Customer profiles with `addresses` subcollection
- `pastryShops` — Shops with `schedules` and `categories` subcollections
- `products` — Products with `variants` subcollection
- `orders` — Orders with items embedidos, status history, payment tracking
- `payments` — 1:1 with orders, MercadoPago fields (mp_preference_id, mp_payment_id)
- `reviews` — Moderated reviews, recalculates shop rating
- `notifications` — Per-user notifications, bulk creation, WebSocket push
- `reports` — Moderation reports (target: review, shop, product)
- `promotions` — Discounts, combos, BOGO with date range
- `chatSessions` — Chatbot sessions with `messages` subcollection (Gemini AI)
- `supportTickets` — Support tickets with `messages` subcollection
- `invoices` — Auto-generated PDF invoices with MercadoPago data
- `backupHistory` — Persisted backup metadata (timestamp, total, collections)

## Frontend Pages (~28 total)
### Public (6)
- `/login` — Split-screen, email/password + Google, Firebase error mapping, password toggle
- `/register` — Full validation, password strength meter, terms checkbox, Google auth
- `/` (ShopsList) — Hero section, search, skeleton loading, shop cards (CSS animations)
- `/shops/:id` (ShopDetail) — Banner, logo, products grid, add-to-cart, reviews, schedule
- `/producto/:shop/:id` (ProductDetail) — Full product view with variants, add to cart
- `*` (NotFound) — 404 page with link back to home

### Customer (10)
- `/cart` — localStorage cart, quantity adjust, remove items, totals
- `/checkout` — Address form + PaymentGateway (MercadoPago/Card/Yape/Plin/Cash)
- `/my-orders`, `/my-orders/:id` — Order list + timeline detail with review submission
- `/profile` — Edit profile, photo upload (ImageUploader), address CRUD, password change
- `/notifications` — Real-time notifications via WebSocket, mark read, delete
- `/invoices` — Invoice list with PDF download
- `/support`, `/support/new`, `/support/:id` — Support tickets with messages

### Owner (1)
- `/owner` (OwnerDashboard) — 5 tabs: shop info (edit + ImageUploader), products (CRUD + ImageUploader), orders (status filter), promotions (CRUD + toggle), summary (sales analytics)

### Moderator (2)
- `/moderator` (ModeratorDashboard) — Review moderation + report management
- `/moderator/usuarios` (ModeratorUsers) — User listing and role management

### Admin (14)
- Dashboard, Users, Shops, Products, Orders, Reviews, Customers, Reports, Notifications, Payments, Promotions, Invoices, Chat, AdminNav

## Test Infrastructure
- **Server tests:** `npm test` — 30 suites, ~490+ tests (Jest 30 + Supertest)
- **Client tests:** `npm test` (Vitest) — ~39 suites, ~380+ tests
- **E2E tests:** `npm run test:e2e` (Playwright) — 7 spec files, 42 tests
- **Load tests:** `npm run load-test:k6:*` (k6, 100-50000 VUs) / `npm run load-test` (Node.js)


## CI/CD Pipeline (Cloud Build)
- 10-step pipeline: test server → test client → build image → push → deploy staging → smoke tests → promote/rollback → build frontend → deploy hosting
- **Rollback automático:** Restaura revisión anterior si smoke tests fallan
- **Gating:** Pre-deploy tests (server + client lint + client unit)
- **Smoke tests:** 6 tests post-deploy (health, products, shops, 404, response time, frontend)

## Backups & Restore
- **Endpoint:** POST `/api/admin/backup` (require admin)
- **Service:** `backupService.js` — exporta 12 colecciones + subcolecciones, comprime gzip, sube a GCS
- **History:** Persistida en Firestore `backupHistory` (sobrevive reinicios)
- **Restore:** `restoreService.js` — REST endpoints + CLI (`restore.js`), dry-run, conflict strategy, collection filter
- **Bucket:** `pastehub-2d2b2-backups` (us-central1, lifecycle 30 días)
- **Scheduler:** `daily-backup` — 0 3 * * * → POST /api/admin/backup (OIDC con scheduler-sa)
- **Validate:** `POST /api/admin/backup/validate` + `GET /api/admin/backup/info/:filename`

## Deployment (deploy.sh)
- `--min-instances=5` en Cloud Run para reducir cold start
- Cache, trace ID en headers/logs

## Monitoring (cloud-monitoring.json)
10 widgets: P50/P95/P99 latency, error rate by endpoint, request count, Firestore R/W, CPU/memory, active instances, concurrent requests, status distribution, top slowest endpoints.

## Alert Policies (deploy/alert-policies.yaml)
5 alerts: high latency (P99>5s/5min), high error rate (>5%/3min), instance surge (>20/5min), memory high (>80%/5min), backup missing (36h).

## MercadoPago Integration
- `mercadopago.js` — SDK config with access token
- `paymentGateway.js` — `createPreference()`, `processPayment()`, `handleWebhook()`, `getPaymentStatus()`
- Webhook with HMAC SHA256 signature verification (x-signature header)
- Auto-fallback to simulated gateway if no token configured
- Auto-generates invoice on payment confirmation

## Image Upload
- Client: `storageService.js` — compress (Canvas, max 1024px), upload via Admin SDK (secure)
- Component: `ImageUploader.jsx` — drag & drop, preview, progress, validate (jpg/png/webp, max 5MB)
- Server: `routes/uploads.js` — 3 endpoints (shop/product/profile), type/size validation
- Admin SDK upload for production security

## i18n
- Custom zero-dependency i18n (no react-i18next)
- 200+ translation keys across 16 domains (common, auth, nav, shops, products, cart, orders, admin, owner, error, notifications, checkout, support, reviews, promotions, payments, reports, customers, chat, footer)
- Languages: ES (default), EN
- `I18nContext` + `LanguageToggle` in Navbar
- Persisted to localStorage

## PWA
- `manifest.json` — standalone display, theme/meta colors, icons
- `sw.js` — cache-first for static assets, network-first for API, offline fallback
- Merged with `firebase-messaging-sw.js` for push notifications + caching

## Known Gaps
- No WebSocket fallback for server-less (Firebase Functions) deployments
- No SQL database (Firestore-only, no relational queries)
- No micro-frontends — single React SPA
- No A/B testing infrastructure
