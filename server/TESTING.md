# TESTING — PastelHub

Tres tipos de pruebas implementadas en el proyecto:

| Tipo | Herramienta | Propósito | Archivos |
|---|---|---|---|
| **Unitarias / Integración** | Jest + Supertest | Verificar que cada endpoint funcione correctamente | `tests/unit/*.test.js` |
| **Carga** | Node.js nativo | Simular 50 o 100 usuarios concurrentes, medir latencia y throughput | `tests/load/load-test-runner-*.js` |
| **Carga (k6)** | k6 | Script alternativo de carga para quienes tengan k6 instalado | `tests/load/load-test.js` |
| **Rate Limiting** | Node.js + fetch | Verificar que los limitadores bloquean en el número esperado | `tests/rate-limit/rate-limit-test.js` |

---

## 1. PRUEBAS UNITARIAS — Jest + Supertest

### Descripción

Prueban la API REST directamente: disparan peticiones HTTP reales contra Express (sin necesidad de que el servidor esté corriendo) y verifican respuestas, códigos de estado, validaciones y errores.

Firebase Admin SDK está **mockeado** — no requiere `serviceAccountKey.json` ni conexión real a Firestore.

### Tests disponibles

| Archivo | Tests | Lo que cubre |
|---|---|---|
| `tests/unit/health.test.js` | 3 | Health check, rutas inexistentes |
| `tests/unit/middleware.test.js` | 5 | verifyToken (401), requireAdmin (403) |
| `tests/unit/auth.test.js` | 8 | sync (nuevo + existente + sin token), me, assign-role |
| `tests/unit/users.test.js` | 18 | CRUD usuarios + direcciones |
| `tests/unit/shops.test.js` | 21 | CRUD pastelerías + schedules + categorías |
| `tests/unit/products.test.js` | 22 | CRUD productos + variantes |
| `tests/unit/orders.test.js` | 27 | CRUD órdenes + estados + reseñas + replies |
| `tests/unit/reviews.test.js` | 22 | CRUD reseñas + moderación + respuestas |
| `tests/unit/payments.test.js` | 18 | CRUD pagos + estados |
| `tests/unit/notifications.test.js` | 18 | CRUD notificaciones + bulk |
| `tests/unit/reports.test.js` | 28 | CRUD reportes + asignación + resolución |
| `tests/unit/customers.test.js` | 24 | CRUD customers + direcciones |
| `tests/unit/promotions.test.js` | 22 | CRUD promociones + toggle |
| **Total** | **338** | |

### Ejecutar

```bash
cd server
npm test                          # Una vez
npm run test:coverage             # Con reporte de cobertura HTML
npm run test:watch                # Modo watch
```

### Ver resultados

- **Terminal:** cada test muestra nombre descriptivo y tiempo
- **HTML:** se genera `test-report.html` automáticamente al ejecutar `npm test`
- **Cobertura:** `server/coverage/lcov-report/index.html` (abrir en navegador)

### Ejemplo de output

```
 PASS  tests/unit/health.test.js
 PASS  tests/unit/middleware.test.js
 PASS  tests/unit/auth.test.js
 ...

Tests:       338 passed, 338 total
Time:        6.2 s
```

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

## 2. PRUEBAS DE CARGA — Node.js nativo

### Descripción

Simulan **usuarios virtuales concurrentes** haciendo peticiones a los 10 endpoints simultáneamente. Miden latencia (avg/min/max/p50/p95/p99), throughput y tasa de errores. Generan reporte HTML.

### Scripts disponibles

| Script | VUs | Auth | Puerto | Servidor |
|---|---|---|---|---|
| `load-test-runner-bypass-auth-100.js` | 100 | Skipeada (mock) | Manual | `npm run start:load-test` |
| `load-test-runner-bypass-auth-50.js` | 50 | Skipeada (mock) | Manual | `npm run start:load-test` |
| `load-test-runner-real-auth-100.js` | 100 | Firebase Auth real | 3003 automático | Spawnea solo |

### Endpoints que golpean

- Health Check, Products, Shops, Users, Orders, Reviews, Payments, Notifications, Reports, Customers

### Ejecutar

```bash
# Con auth bypass (100 VUs) — requiere servidor aparte
cd server
npm run start:load-test           # Terminal 1
npm run load-test                 # Terminal 2

# Con auth bypass (50 VUs)
npm run load-test:50

# Con auth real (100 VUs) — automático, no requiere servidor aparte
npm run load-test:real-auth
```

### Requisito para auth real

En `server/.env` (NO se sube a git):

```
FIREBASE_WEB_API_KEY=AIzaSy...
TEST_USER_EMAIL=loadtester@tudominio.com
TEST_USER_PASSWORD=password123
```

El usuario debe existir en Firebase Auth y tener `roles: ['admin']` en Firestore.

### Reportes HTML generados

| Comando | Reporte |
|---|---|
| `npm run load-test` | `load-test-report.html` |
| `npm run load-test:50` | `load-test-report-50.html` |
| `npm run load-test:real-auth` | `load-test-report-real-auth.html` |

---

## 3. PRUEBAS DE CARGA — k6 (alternativa)

### Descripción

Script alternativo de carga para quienes tengan k6 instalado.

### Script

`tests/load/load-test.js` — Soporta de 100 a 50000 VUs con stages progresivos y thresholds dinámicos.

### Ejecutar

```bash
cd server

# 100 VUs (smoke test rápido)
k6 run tests/load/load-test.js -e QUICK=true -e MAX_VUS=100 -e LOAD_TEST=true

# 1000 VUs (completo ~7 min)
k6 run tests/load/load-test.js -e MAX_VUS=1000

# 5000 VUs (completo ~10 min)
k6 run tests/load/load-test.js -e MAX_VUS=5000 -e LOAD_TEST=true

# 10000 VUs (alta carga)
k6 run tests/load/load-test.js -e MAX_VUS=10000 -e LOAD_TEST=true

# 50000 VUs (máxima carga)
k6 run tests/load/load-test.js -e MAX_VUS=50000 -e LOAD_TEST=true
```

### Scripts npm disponibles

| Comando | VUs | Modo |
|---------|:---:|:----:|
| `npm run load-test:k6:quick` | 100 | Rápido (~45s) |
| `npm run load-test:k6:500` | 500 | Completo |
| `npm run load-test:k6:500:quick` | 500 | Rápido |
| `npm run load-test:k6:1000` | 1000 | Completo |
| `npm run load-test:k6:1000:quick` | 1000 | Rápido |
| `npm run load-test:k6:5000` | 5000 | Completo |
| `npm run load-test:k6:5000:quick` | 5000 | Rápido |
| `npm run load-test:k6:10000` | 10000 | Completo |
| `npm run load-test:k6:10000:quick` | 10000 | Rápido |
| `npm run load-test:k6:50000` | 50000 | Completo |
| `npm run load-test:k6:50000:quick` | 50000 | Rápido |

### Variables de entorno k6

| Variable | Default | Descripción |
|----------|---------|-------------|
| `TARGET_URL` | `http://localhost:3001` | URL del servidor |
| `MAX_VUS` | `1000` | Usuarios virtuales concurrentes |
| `STEADY_MINUTES` | `5` | Duración del estado estable |
| `QUICK` | `false` | Modo rápido (stages acortados) |
| `LOAD_TEST` | `false` | Bypass de autenticación |

### Thresholds dinámicos

| Carga | P95 | P99 | Fallos |
|-------|:---:|:---:|:------:|
| ≤10000 VUs | <5000ms | <10000ms | <2% |
| >10000 VUs | <10000ms | <20000ms | <5% |

---

## 4. PRUEBAS DE RATE LIMITING

### Descripción

Script Node.js que verifica automáticamente que los rate limiters del servidor bloqueen en el número esperado de requests.

### Script

`tests/rate-limit/rate-limit-test.js`

### Qué verifica

| Límite | Max | Ventana | Esperado | Resultado |
|---|---|---|---|---|
| General (todas las rutas) | 100k req | 5s (LOAD_TEST) | Bloqueo en #100001 | PASA |
| Auth (/api/auth) | 20k req | 5s (LOAD_TEST) | Bloqueo en #20001 | PASA |

### Ejecutar

```bash
cd server
npm run test:rate-limit
```

Genera `rate-limit-test-report.html`.

---

## Resumen de comandos

```bash
# Unitarias (Jest)
cd server && npm test                             # 338 tests, genera HTML
cd server && npm run test:coverage                # Con cobertura
cd server && npm run test:watch                   # Modo watch

# Carga (Node.js, bypass auth)
cd server && npm run start:load-test              # Terminal 1: servidor
cd server && npm run load-test                    # Terminal 2: 100 VUs
cd server && npm run load-test:50                 # Terminal 2: 50 VUs

# Carga (Node.js, auth real) — automático
cd server && npm run load-test:real-auth          # Spawnea servidor solo

# Carga (k6) — requiere servidor corriendo
cd server && npm run load-test:k6:quick           # 100 VUs rápido (~45s)
cd server && npm run load-test:k6:1000            # 1000 VUs completo
cd server && npm run load-test:k6:5000            # 5000 VUs completo
cd server && npm run load-test:k6:10000           # 10000 VUs completo
cd server && npm run load-test:k6:50000           # 50000 VUs completo

# Rate limiting — automático
cd server && npm run test:rate-limit              # Spawnea servidores
```
