# 🧪 TESTING — PastelHub

Tres tipos de pruebas implementadas en el proyecto:

| Tipo | Herramienta | Propósito | Archivos |
|---|---|---|---|
| **Unitarias / Integración** | Jest + Supertest | Verificar que cada endpoint funcione correctamente (códigos HTTP, validaciones, errores) | `server/tests/*.test.js` |
| **Carga (50 VUs)** | k6 | Simular 50 usuarios concurrentes para medir rendimiento del servidor | `server/tests/load-test.js` |
| **Rate Limiting** | express-rate-limit + script Node | Visualizar en tiempo real los límites de peticiones por IP | `test-rate-limit.js` |

---

## 📦 1. PRUEBAS UNITARIAS — Jest + Supertest

### Descripción

Prueban la API REST directamente: disparan peticiones HTTP reales contra Express (sin necesidad de que el servidor esté corriendo) y verifican respuestas, códigos de estado, validaciones y errores.

Firebase Admin SDK está **mockeado** — no requiere `serviceAccountKey.json` ni conexión real a Firestore.

### Tests disponibles

| Archivo | Tests | Lo que cubre |
|---|---|---|
| `tests/health.test.js` | 3 | Health check, rutas inexistentes (GET y POST) |
| `tests/middleware.test.js` | 5 | verifyToken (401 sin token, inválido, malformado), requireAdmin (403 no admin, 200 admin) |
| `tests/auth.test.js` | 8 | sync (usuario nuevo + existente + sin token), me (200 + 404), assign-role (400 sin datos, roles inválidos, 200 ok) |
| `tests/shops.test.js` | 6 | GET lista vacía, GET sin token, POST 400, POST 201, GET 404, GET 200, DELETE |
| `tests/users.test.js` | 10 | GET lista, POST 400 (faltantes), POST 201, PUT 200, PUT 404, PATCH 400, PATCH 200, DELETE |

**Total: 32 tests.**

### Ejecutar

```bash
cd server

# Una vez
npm test

# Con reporte de cobertura HTML
npm run test:coverage

# En modo watch (se re-ejecuta al guardar cambios)
npm run test:watch
```

### Ver resultados

- **Terminal:** cada test muestra ✅ o ❌ con nombre descriptivo y tiempo
- **Cobertura HTML:** `server/coverage/lcov-report/index.html` (abrir en navegador)
  - Muestra % de cobertura por archivo: statements, branches, functions, lines
  - Archivos sin testear aparecen en rojo

### Ejemplo de output

```
 PASS  tests/health.test.js
 PASS  tests/middleware.test.js
 PASS  tests/auth.test.js
 PASS  tests/shops.test.js
 PASS  tests/users.test.js

Tests:       32 passed, 32 total
Time:        3.8 s
```

### Estructura de un test

```js
const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('responde 200 con status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
```

### Mock de Firebase

`tests/setup.js` provee helpers globales:

| Helper | Uso |
|---|---|
| `mockToken(uid, roles)` | Simula un token Firebase válido con roles |
| `mockDocExists(data)` | `doc().get()` devuelve documento existente |
| `mockDocNotExists()` | `doc().get()` devuelve documento inexistente |
| `mockCollection(docs)` | `orderBy().get()` devuelve lista de documentos |

---

## 🚀 2. PRUEBAS DE CARGA — k6

### Descripción

Simula **50 usuarios virtuales concurrentes** haciendo peticiones al servidor para medir latencia, tasa de errores y throughput.

### Requisito

[Instalar k6](https://grafana.com/docs/k6/get-started/installation/):

```bash
# Windows (Chocolatey)
choco install k6

# Windows (winget)
winget install k6

# O descargar desde https://grafana.com/docs/k6/get-started/installation/
```

### Script: `server/tests/load-test.js`

```javascript
export const options = {
  stages: [
    { duration: '10s', target: 25 },  // Sube a 25 usuarios
    { duration: '20s', target: 50 },  // Mantiene 50 usuarios
    { duration: '10s', target: 0 },   // Baja a 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% de requests < 500ms
    http_req_failed:   ['rate<0.01'],   // < 1% de errores
  },
};
```

### Ejecutar

```bash
# Terminal 1: arrancar servidor
cd server && npm run dev

# Terminal 2: ejecutar k6
cd server && k6 run tests/load-test.js
```

### Ver resultados

k6 muestra en terminal:

```
     data_received..................: 1.2 MB 28 kB/s
     data_sent......................: 1.1 MB 24 kB/s
     http_req_blocked...............: avg=6ms    min=0s    med=2ms
     http_req_connecting............: avg=2ms    min=0s    med=0s
     http_req_duration..............: avg=42ms   min=8ms   med=35ms
     http_req_failed................: 0.00%  ✓ 0        ✗ 100
     http_reqs......................: 100    2234/s
     vus............................: 50     min=0      max=50
     vus_max........................: 50
```

Métricas clave:
- **http_req_duration** — tiempo promedio de respuesta
- **http_req_failed** — % de peticiones que fallaron
- **http_reqs** — total de peticiones completadas
- **vus** — usuarios virtuales simultáneos

Para exportar resultados a JSON:
```bash
k6 run tests/load-test.js --out json=report.json
```

---

## 🛡️ 3. RATE LIMITING — Demo

### Descripción

Script Node.js que prueba visualmente el rate limiter del servidor, mostrando en consola cuántas peticiones quedan antes de recibir un `429 Too Many Requests`.

### Archivo: `test-rate-limit.js` (raíz del proyecto)

### Ejecutar

```bash
# Terminal 1: arrancar servidor
cd server && npm run dev

# Terminal 2: ejecutar demo
node test-rate-limit.js
```

### Ver resultados

Muestra en consola en tiempo real:

```
[1] POST /api/auth/sync → 401 | Restantes: 9 | Reset: 45s
[2] POST /api/auth/sync → 401 | Restantes: 8 | Reset: 42s
[3] POST /api/auth/sync → 401 | Restantes: 7 | Reset: 40s
...
[11] POST /api/auth/sync → 429 | Restantes: 0 | Reset: 28s
✓ Rate limiting funcionando correctamente
```

Configuración activa:
- **General:** 100 requests / 15 min por IP
- **Auth:** 10 requests / 15 min por IP (ruta `/api/auth`)

---

## 📋 Resumen de comandos

```bash
# Unitarias
cd server && npm test

# Unitarias con cobertura
cd server && npm run test:coverage

# Carga (k6) — requiere servidor corriendo
cd server && k6 run tests/load-test.js

# Rate limiting demo — requiere servidor corriendo
node test-rate-limit.js
```
