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
| **Total** | **232** | |

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

Tests:       232 passed, 232 total
Time:        5.3 s
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

`tests/load/load-test.js`

### Ejecutar

```bash
cd server && k6 run tests/load/load-test.js
```

---

## 4. PRUEBAS DE RATE LIMITING

### Descripción

Script Node.js que verifica automáticamente que los rate limiters del servidor bloqueen en el número esperado de requests.

### Script

`tests/rate-limit/rate-limit-test.js`

### Qué verifica

| Límite | Max | Ventana | Esperado | Resultado |
|---|---|---|---|---|
| General (todas las rutas) | 100 req | 5s (LOAD_TEST) | Bloqueo en #101 | PASA |
| Auth (/api/auth) | 10 req | 5s (LOAD_TEST) | Bloqueo en #11 | PASA |

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
cd server && npm test                             # 232 tests, genera HTML
cd server && npm run test:coverage                # Con cobertura
cd server && npm run test:watch                   # Modo watch

# Carga (Node.js, bypass auth)
cd server && npm run start:load-test              # Terminal 1: servidor
cd server && npm run load-test                    # Terminal 2: 100 VUs
cd server && npm run load-test:50                 # Terminal 2: 50 VUs

# Carga (Node.js, auth real) — automático
cd server && npm run load-test:real-auth          # Spawnea servidor solo

# Carga (k6) — requiere servidor corriendo
cd server && k6 run tests/load/load-test.js

# Rate limiting — automático
cd server && npm run test:rate-limit              # Spawnea servidores
```
