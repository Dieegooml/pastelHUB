# TESTING — PastelHub

Seis tipos de pruebas implementadas en el proyecto:

| Tipo | Herramienta | Propósito | Archivos |
|---|---|---|---|
| **Unitarias / Integración** | Jest + Supertest | Verificar que cada endpoint funcione correctamente | `tests/unit/*.test.js` (31 archivos, ~480 tests) |
| **Unitarias (Frontend)** | Vitest + jsdom | Renderizado e interacciones de componentes React | `client/src/tests/*.test.jsx` (40 archivos, 391 tests) |
| **Carga (Node.js)** | Node.js fetch | Simular 50-100 usuarios concurrentes | `tests/load/load-test-runner-*.js` |
| **Carga (k6)** | k6 | Script alternativo de carga profesional | `tests/load/load-test.js` |
| **E2E (Client)** | Playwright | Flujos críticos del frontend | `client/e2e/flows/*.spec.js` (7 archivos, 42 tests) |

---

## 1. PRUEBAS UNITARIAS — Jest + Supertest

### Descripción

Prueban la API REST directamente: disparan peticiones HTTP reales contra Express (sin necesidad de que el servidor esté corriendo) y verifican respuestas, códigos de estado, validaciones y errores.

Firebase Admin SDK está **mockeado** — no requiere `serviceAccountKey.json` ni conexión real a Firestore.

### Tests disponibles (31 archivos, ~480 tests)

| Archivo | Tests | Lo que cubre |
|---|---|---|
| `tests/unit/health.test.js` | 3 | Health check, rutas inexistentes |
| `tests/unit/middleware.test.js` | 18 | verifyToken, requireAdmin, requireModerator, requireCustomer, requireOwnerOrAdmin, requireSelfOrAdmin |
| `tests/unit/auth.test.js` | 10 | sync (nuevo/existente/sin token), me, assign-role |
| `tests/unit/users.test.js` | 18 | CRUD usuarios + direcciones |
| `tests/unit/shops.test.js` | 28 | CRUD pastelerías + schedules + categorías |
| `tests/unit/products.test.js` | 22 | CRUD productos + variantes |
| `tests/unit/orders.test.js` | 28 | CRUD órdenes + estados + cancelación + resumen + **orden cancelada no transiciona** |
| `tests/unit/reviews.test.js` | 22 | CRUD reseñas + moderación + respuestas + recálculo rating |
| `tests/unit/payments.test.js` | 18 | CRUD pagos + gateway simulado |
| `tests/unit/notifications.test.js` | 17 | CRUD notificaciones + bulk + push + **FCM null safety** |
| `tests/unit/reports.test.js` | 28 | CRUD reportes + asignación + resolución |
| `tests/unit/customers.test.js` | 21 | CRUD customers + direcciones subcollection + **addresses vacío retorna []** |
| `tests/unit/promotions.test.js` | 14 | CRUD promociones + toggle |
| `tests/unit/support.test.js` | 18 | CRUD tickets + mensajes + asignación |
| `tests/unit/chat.test.js` | 20 | Sesiones + mensajes + fallback AI |
| `tests/unit/backupRestore.test.js` | 12 | Validación + restauración de backups |
| `tests/unit/aiHelper.test.js` | 18 | AI helper, prompts, respuestas |
| `tests/unit/auditLog.test.js` | 10 | Auditoría de eventos |
| `tests/unit/autoNotify.test.js` | 12 | Auto-notificaciones (snake_case) |
| `tests/unit/cache.test.js` | 22 | Cache stores, TTL, LRU eviction |
| `tests/unit/fcmService.test.js` | 8 | FCM push notifications, null safety |
| `tests/unit/invoices.test.js` | 14 | Generación de facturas PDF |
| `tests/unit/logger.test.js` | 12 | Logging, niveles, formato |
| `tests/unit/mappers.test.js` | 16 | Mapeo camelCase/snake_case |
| `tests/unit/mercadopago.test.js` | 10 | MercadoPago SDK mock |
| `tests/unit/paginate.test.js` | 8 | Paginación Firestore |
| `tests/unit/paymentGateway.test.js` | 14 | Gateway simulado + procesos de pago |

| `tests/unit/uploads.test.js` | 10 | Upload de imágenes, validación |
| `tests/unit/validate.test.js` | 22 | Schemas Zod, errores de validación |
| `tests/unit/websocket.test.js` | 12 | Conexión WebSocket, eventos, heartbeats |
| **Total** | **~480** | |

### Ejecutar

```bash
cd server
npm test                          # Una vez (~480 tests)
npm run test:coverage             # Con reporte de cobertura HTML
npm run test:watch                # Modo watch
```

### Ver resultados

- **Terminal:** cada test muestra nombre descriptivo y tiempo
- **HTML:** se genera `test-report.html` automáticamente al ejecutar `npm test`
- **Cobertura:** `server/coverage/lcov-report/index.html` (abrir en navegador)

### Mock de Firebase

`tests/setup.js` provee helpers globales:

| Helper | Uso |
|---|---|
| `mockToken(uid, roles)` | Simula un token Firebase válido con roles |
| `mockDocExists(data)` | `doc().get()` devuelve documento existente |
| `mockDocNotExists()` | `doc().get()` devuelve documento inexistente |
| `mockCollection(docs)` | `orderBy().get()` devuelve lista de documentos |
| `mockBatch()` | Simula `db.batch()` para escrituras masivas |

---

## 2. PRUEBAS E2E — Playwright (Frontend)

### Descripción

Pruebas de extremo a extremo que simulan interacciones reales del usuario en el navegador: login, navegación, búsqueda, carrito, checkout.

### Ubicación

`client/e2e/flows/*.spec.js`

### Tests disponibles (7 archivos, 42 tests)

| Archivo | Tests | Lo que cubre |
|---|---|---|
| `01-health.spec.js` | 4 | App carga, login renderiza, health API, register link |
| `02-auth.spec.js` | 6 | Validación errores, email inválido, password toggle, register redirect |
| `03-shops.spec.js` | 6 | Lista shops, búsqueda por nombre/ciudad, filtrar, click detalle |
| `04-cart.spec.js` | 8 | Items en carrito, ajustar cantidad, remover, vaciar, localStorage |
| `05-navigation.spec.js` | 10 | Redirect protegido, navbar por rol, navegación |
| `06-admin.spec.js` | 4 | Admin routes redirect sin auth, acceso por rol |
| `07-404.spec.js` | 4 | Página 404, volver al inicio |

### Mock de Firebase Auth

El helper `client/e2e/helpers/mock-auth.js` intercepta:
- `Storage.prototype.getItem` — cuando Firebase Auth busca usuario persistido, recibe un mock
- `window.fetch` — intercepta llamadas a Firebase Auth API, retorna tokens JWT mock con `firebase.roles`

### Ejecutar

```bash
cd client
npx playwright install           # Solo primera vez
npm run test:e2e                 # Ejecuta todos los tests
npx playwright show-report       # Ver reporte HTML
```

---

## 3. PRUEBAS UNITARIAS — Vitest (Frontend)

### Descripción

Pruebas de componentes React con Vitest + jsdom. Cubren renderizado, interacciones, estados de carga/error/vacío, y lógica de negocio del frontend.

### Tests disponibles (40 archivos, 391 tests)

| Categoría | Archivos | Tests | Lo que cubre |
|-----------|----------|-------|-------------|
| Auth | Login, Register, AuthLayout, AuthContext, ProtectedRoute | 85 | Login/register flows, validación, roles, redirect |
| Layout | Navbar, Footer | 24 | Navegación por rol, enlaces, idioma |
| Pages | ShopsList, ShopDetail, ProductDetail, Cart, Checkout, Profile, NotFound | 96 | Renderizado, filtros, carrito, checkout |
| Admin | AdminUsers, AdminOrders, AdminShops | 52 | CRUD, estados, tabla de datos |
| Owner | OwnerDashboard | 28 | Tabs, productos, órdenes, promociones |
| Components | Chatbot, ImageUploader, PaymentGateway, ErrorBoundary | 106 | Upload, pagos, chat, errores |

### Ejecutar

```bash
cd client
npm test                              # 391 tests (40 archivos)
npm run test:watch                    # Modo watch
```

---

## 4. PRUEBAS DE CARGA — Node.js nativo

### Descripción

Simulan **usuarios virtuales concurrentes** haciendo peticiones a los 10 endpoints. Miden latencia (avg/min/max/p50/p95/p99), throughput y tasa de errores. Generan reporte HTML.

### Scripts disponibles

| Script | VUs | Auth | Puerto | Servidor |
|---|---|---|---|---|
| `load-test-runner-bypass-auth-100.js` | 100 | Skipeada (mock) | Manual | `npm run start:load-test` |
| `load-test-runner-bypass-auth-50.js` | 50 | Skipeada (mock) | Manual | `npm run start:load-test` |
| `load-test-runner-real-auth-100.js` | 100 | Firebase Auth real | 3003 automático | Spawnea solo |

### Ejecutar

```bash
cd server
npm run start:load-test           # Terminal 1
npm run load-test                 # Terminal 2 (100 VUs)
npm run load-test:50              # Terminal 2 (50 VUs)
npm run load-test:real-auth       # Automático (100 VUs con auth real)
```

---

## 5. PRUEBAS DE CARGA — k6 (alternativa)

### Soporte: 100 a 50000 VUs con stages progresivos y thresholds dinámicos.

| Carga | P95 | P99 | Fallos |
|-------|:---:|:---:|:------:|
| ≤10000 VUs | <5000ms | <10000ms | <2% |
| >10000 VUs | <10000ms | <20000ms | <5% |

### Ejecutar

```bash
cd server
npm run load-test:k6:quick        # 100 VUs rápido (~45s)
npm run load-test:k6:1000         # 1000 VUs completo
npm run load-test:k6:5000         # 5000 VUs completo
npm run load-test:k6:10000        # 10000 VUs completo
npm run load-test:k6:50000        # 50000 VUs completo
```

---

## Resumen de comandos

```bash
# Backend
cd server && npm test                              # ~480 tests unitarios (31 suites)
cd server && npm run test:coverage                 # Con cobertura
cd server && npm run load-test:k6:quick            # Carga k6 100 VUs

# Frontend
cd client && npm test                              # 391 tests Vitest (40 archivos)
cd client && npm run test:e2e                      # 42 tests E2E Playwright
cd client && npm run test:watch                    # Modo watch Vitest
```

---

## Reportes generados

| Reporte | Comando | Ruta |
|---|---|---|
| Unit tests (server) HTML | `npm test` | `server/test-report.html` |
| Cobertura (server) | `npm run test:coverage` | `server/coverage/` |
| Unit tests (client) | `npm test` | `client/vitest-report.html` |
| Load test | `npm run load-test` | `server/load-test-report.html` |
| E2E Playwright | `npm run test:e2e` | `client/playwright-report/` |
