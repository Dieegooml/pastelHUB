# RATE LIMITING — DOCUMENTACIÓN

## Descripción General

El proyecto PastelHub implementa **rate limiting** usando `express-rate-limit` (v8) para proteger el servidor de abuso y ataques.

---

## Configuración Implementada

### Archivo: `server/src/app.js`

```javascript
const rateLimit = require('express-rate-limit');

// Modo LOAD_TEST: ventanas de 5s para pruebas
const isLoadTest = process.env.LOAD_TEST === 'true' ||
                   process.env.LOAD_TEST_REAL_AUTH === 'true';

// Limiter General: 500 requests por IP (100k en LOAD_TEST)
const limiter = rateLimit({
  windowMs: isLoadTest ? 5 * 1000 : 15 * 60 * 1000,  // 5s (test) / 15 min
  max: isLoadTest ? 100000 : 500,
  message: { error: 'Demasiadas peticiones, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter Estricto para Autenticación: 50 requests por IP (20k en LOAD_TEST)
const authLimiter = rateLimit({
  windowMs: isLoadTest ? 5 * 1000 : 15 * 60 * 1000,  // 5s (test) / 15 min
  max: isLoadTest ? 20000 : 50,
  message: { error: 'Demasiados intentos de autenticación, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicación:
app.use(limiter);                                         // Todas las rutas
app.use('/api/auth', authLimiter, require('./routes/auth'));  // Auth
```

---

## Límites Configurados

| Ruta | Límite (prod/dev) | Límite (LOAD_TEST) | Ventana (prod) | Ventana (test) |
|---|---|---|---|---|---|
| **Todas las rutas** | 500 req/IP | 100k req/IP | 15 min | 5s |
| **/api/auth** | 50 req/IP | 20k req/IP | 15 min | 5s |

---

## Modos de operación

### Variable `LOAD_TEST`

| Variable | Ventanas | Auth | Uso |
|---|---|---|---|
| `LOAD_TEST=true` | 5s | Skipea verifyToken (mock) | `npm run start:load-test` |
| `LOAD_TEST_REAL_AUTH=true` | 5s | Auth real (Firebase) | `npm run load-test:real-auth` |
| (ninguna) | 15 min | Auth real | Producción |

### Mecanismo en `server/src/middlewares/auth.js`

```javascript
if (process.env.LOAD_TEST === 'true' &&
    process.env.LOAD_TEST_REAL_AUTH !== 'true') {
  // Modo bypass: asigna usuario mock
  req.user = { uid: 'load-test-user', email: 'load@test.com', roles: ['admin'] };
  return next();
}
// Modo normal: verifica token real contra Firebase Auth
```

---

## Headers de Rate Limiting

Cada respuesta incluye headers estándar (draft-6):

```
RateLimit-Policy: 100;w=900
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 842
```

---

## Test Automatizado

### Script: `server/tests/rate-limit/rate-limit-test.js`

Verifica automáticamente ambos límites usando servidores independientes (puertos 3001 y 3002) para evitar interferencia entre pruebas.

```bash
cd server
npm run test:rate-limit
```

### Resultado esperado

```
  Límite general: bloqueo en #501 (esperado: #501) ✅ PASA
  Límite auth:    bloqueo en #51 (esperado: #51) ✅ PASA
```

Genera `rate-limit-test-report.html`.

---

## Testing Manual

### Con Postman / curl

```bash
# Superar límite general (101 requests)
for i in {1..101}; do
  curl -s -X GET http://localhost:3001/api/health -o /dev/null -w "%{http_code}\n"
done
```

### Con el script de demo rápido (raíz)

```bash
node test-rate-limit.js
```

---

## Notas Importantes

- El rate limiting se resetea cada **15 minutos** en producción, cada **5 segundos** en modo LOAD_TEST
- Cada **IP diferente** tiene su propio contador
- La ruta `/api/auth` tiene límite más estricto (10 vs 100) para prevenir fuerza bruta
- Los headers de rate limiting siguen el draft-6 de la especificación IETF
- `clearMocks: true` en jest.config evita contaminación entre tests

---

**Documento generado:** 09/06/2026  
**Estado:** Rate Limiting Implementado y Documentado
