# TESTING — PastelHub

Cinco tipos de pruebas implementadas en el proyecto:

| Tipo | Herramienta | Propósito | Archivos |
|---|---|---|---|
| **Unitarias / Integración** | Jest + Supertest | Verificar que cada endpoint funcione correctamente | `tests/unit/*.test.js` |
| **Carga (Node.js)** | Node.js fetch | Simular 50-100 usuarios concurrentes | `tests/load/load-test-runner-*.js` |
| **Carga (k6)** | k6 | Script alternativo de carga profesional | `tests/load/load-test.js` |
| **Rate Limiting** | Node.js + fetch | Verificar limitadores | `tests/rate-limit/rate-limit-test.js` |
| **E2E (Client)** | Playwright | Flujos críticos del frontend | `client/e2e/flows/*.spec.js` |

---

## 1. PRUEBAS UNITARIAS — Jest + Supertest

### Descripción

Prueban la API REST directamente: disparan peticiones HTTP reales contra Express (sin necesidad de que el servidor esté corriendo) y verifican respuestas, códigos de estado, validaciones y errores.

Firebase Admin SDK está **mockeado** — no requiere `serviceAccountKey.json` ni conexión real a Firestore.

### Tests disponibles (17 archivos, ~450+ tests)

| Archivo | Tests | Lo que cubre |
|---|---|---|
| `tests/unit/health.test.js` | 3 | Health check, rutas inexistentes |
| `tests/unit/middleware.test.js` | 18 | verifyToken, requireAdmin, requireModerator, requireCustomer, requireOwnerOrAdmin, requireSelfOrAdmin |
| `tests/unit/auth.test.js` | 10 | sync (nuevo/existente/sin token), me, assign-role |
| `tests/unit/users.test.js` | 18 | CRUD usuarios + direcciones |
| `tests/unit/shops.test.js` | 28 | CRUD pastelerías + schedules + categorías |
| `tests/unit/products.test.js` | 22 | CRUD productos + variantes |
| `tests/unit/orders.test.js` | 27 | CRUD órdenes + estados + cancelación + resumen |
| `tests/unit/reviews.test.js` | 22 | CRUD reseñas + moderación + respuestas + recálculo rating |
| `tests/unit/payments.test.js` | 18 | CRUD pagos + gateway simulado |
| `tests/unit/notifications.test.js` | 16 | CRUD notificaciones + bulk + push |
| `tests/unit/reports.test.js` | 28 | CRUD reportes + asignación + resolución |
| `tests/unit/customers.test.js` | 20 | CRUD customers + direcciones subcollection |
| `tests/unit/promotions.test.js` | 14 | CRUD promociones + toggle |
| `tests/unit/support.test.js` | 18 | CRUD tickets + mensajes + asignación |
| `tests/unit/chat.test.js` | 20 | Sesiones + mensajes + rate limit + fallback AI |
| `tests/unit/backupRestore.test.js` | 12 | Validación + restauración de backups |
| **Total** | **~450+** | |

### Ejecutar

```bash
cd server
npm test                          # Una vez (~450+ tests)
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

## 3. PRUEBAS DE CARGA — Node.js nativo

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

## 4. PRUEBAS DE CARGA — k6 (alternativa)

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

## 5. PRUEBAS DE RATE LIMITING

Verifica que los rate limiters bloqueen en el número esperado.

```bash
cd server
npm run test:rate-limit           # Spawnea servidores, genera reporte HTML
```

---

## Resumen de comandos

```bash
# Backend
cd server && npm test                              # ~450+ tests unitarios
cd server && npm run test:coverage                 # Con cobertura
cd server && npm run test:rate-limit               # Rate limiting
cd server && npm run load-test:k6:quick            # Carga k6 100 VUs

# Frontend
cd client && npm test                              # ~175+ tests Vitest
cd client && npm run test:e2e                      # 42 tests E2E Playwright
cd client && npm run test:watch                    # Modo watch Vitest
```

---

## Reportes generados

| Reporte | Comando | Ruta |
|---|---|---|
| Unit tests HTML | `npm test` | `server/test-report.html` |
| Cobertura | `npm run test:coverage` | `server/coverage/` |
| Load test | `npm run load-test` | `server/load-test-report.html` |
| Rate limit | `npm run test:rate-limit` | `server/rate-limit-test-report.html` |
| E2E Playwright | `npm run test:e2e` | `client/playwright-report/` |
