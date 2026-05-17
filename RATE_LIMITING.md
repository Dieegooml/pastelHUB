# 🛡️ RATE LIMITING - DOCUMENTACIÓN

## Descripción General

El proyecto PastelHub implementa **rate limiting** usando `express-rate-limit` para proteger el servidor de abuso y ataques.

**Instalado:** `npm install express-rate-limit`  
**Versión:** Ver `server/package.json`

---

## Configuración Implementada

### Archivo: `server/src/app.js`

```javascript
const rateLimit = require('express-rate-limit');

// Limiter General: 100 requests por IP cada 15 minutos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 100,                   // 100 requests
  message: { error: 'Demasiadas peticiones, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter Estricto para Autenticación: 10 requests por IP cada 15 minutos
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 10,                    // 10 requests
  message: { error: 'Demasiados intentos de autenticación, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicación de limiters:
app.use(limiter);  // ← Aplica a TODAS las rutas
app.use('/api/auth', authLimiter, require('./routes/auth'));  // ← Limiter estricto en /api/auth
```

---

## Límites Configurados

| Ruta | Límite | Ventana | Mensaje |
|------|--------|---------|---------|
| **Todas las rutas** | 100 req/IP | 15 min | `Demasiadas peticiones, intenta en 15 minutos` |
| **/api/auth** | 10 req/IP | 15 min | `Demasiados intentos de autenticación, intenta en 15 minutos` |

---

## Ejemplos de Uso

### Ejemplo 1: Superar límite general

```bash
# Hacer 101 requests en 15 minutos desde la misma IP
for i in {1..101}; do
  curl -X GET http://localhost:3001/api/users \
    -H "Authorization: Bearer <token>"
done

# Respuesta en la solicitud 101:
HTTP/1.1 429 Too Many Requests
{
  "error": "Demasiadas peticiones, intenta en 15 minutos"
}
```

### Ejemplo 2: Superar límite de autenticación

```bash
# Hacer 11 intentos de login en 15 minutos desde la misma IP
for i in {1..11}; do
  curl -X POST http://localhost:3001/api/auth/sync \
    -H "Authorization: Bearer <token>"
done

# Respuesta en la solicitud 11:
HTTP/1.1 429 Too Many Requests
{
  "error": "Demasiados intentos de autenticación, intenta en 15 minutos"
}
```

---

## Headers de Rate Limiting

Cada respuesta HTTP incluye headers estándar de rate limiting:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1684395600
```

- **RateLimit-Limit:** Máximo de requests permitidos
- **RateLimit-Remaining:** Requests restantes en esta ventana
- **RateLimit-Reset:** Timestamp UNIX cuando se reinicia el contador

---

## Beneficios Implementados

✅ **Protección contra fuerza bruta** en `/api/auth`  
✅ **Protección general** contra DDoS y abuso  
✅ **Headers estándar** para que el cliente sepa el estado del límite  
✅ **Mensajes claros** para el usuario final  
✅ **Por IP:** Cada IP tiene su propio contador  

---

## Testing del Rate Limiting

### Con Postman:
1. Crear una request a `GET /api/users`
2. Ejecutarla 101 veces seguidas
3. En la solicitud 101, deberías recibir `429 Too Many Requests`

### Con Curl (Bash):
```bash
#!/bin/bash
for i in {1..105}; do
  echo "Request #$i"
  curl -s -X GET http://localhost:3001/api/users \
    -H "Authorization: Bearer <token>" \
    -w "\nStatus: %{http_code}\n"
  sleep 1
done
```

### Con Script Node.js:
```javascript
const fetch = require('node-fetch');

async function testRateLimit() {
  const token = 'tu_firebase_token';
  
  for (let i = 1; i <= 105; i++) {
    const res = await fetch('http://localhost:3001/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`Request ${i}: ${res.status}`);
    
    if (res.status === 429) {
      const data = await res.json();
      console.log('Rate limit alcanzado:', data.error);
      break;
    }
  }
}

testRateLimit();
```

---

## Configuración en Producción

Cuando despliegues a producción, considera:

```javascript
// Cambiar estos valores según necesidad
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // Puedes cambiar a 10 o 60 minutos
  max: 100,                   // Ajustar según el tráfico esperado
  // ... rest of config
});
```

---

## Notas Importantes

- El rate limiting se resetea **cada 15 minutos** automáticamente
- Cada **IP diferente** tiene su propio contador
- El `/api/auth` tiene límite más estricto para prevenir ataques de fuerza bruta
- Los headers de rate limiting están habilitados (`standardHeaders: true`)

---

**Documento generado:** 17/05/2026  
**Estado:** ✅ Rate Limiting Implementado y Documentado
