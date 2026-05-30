# RUNBOOK — Ejecución de Tests

Todos los comandos se ejecutan desde `cd server`.

---

## Backup y Restauración de Firestore

### Backup manual

```bash
# Backup completo (todas las colecciones)
npm run backup

# Backup de colecciones específicas
npm run backup:users          # solo users
npm run backup:shops          # solo pastryShops
npm run backup:orders         # orders, payments, reviews

# Backup personalizado
node backup.js users,products,promotions
```

Los backups se guardan en `server/backups/<timestamp>/`:
- Un archivo `.json` por colección (con subcolecciones incluidas)
- `_meta.json` con resumen del backup
- Archivo `.zip` comprimido del backup

### Restauración

```bash
# Restaurar el backup más reciente
npm run restore

# Restaurar un backup específico
node restore.js backups/2026-05-30T12-00-00
```

**Advertencia:** La restauración sobrescribe documentos existentes. No hay confirmación interactiva.

---

## Tests Unitarios

| Comando | Qué hace |
|---|---|
| `npm test` | Ejecuta 232 tests (Jest), genera `test-report.html` |
| `npm run test:coverage` | Tests + reporte de cobertura HTML |
| `npm run test:watch` | Tests en modo watch |

**No requiere servidor corriendo** — mockea Firebase.

---

## Tests de Carga

### Bypass auth (mock)

| Comando | VUs | Requiere |
|---|---|---|
| `npm run load-test` | 100 | Servidor en otra terminal con `npm run start:load-test` |
| `npm run load-test:50` | 50 | Servidor en otra terminal con `npm run start:load-test` |

Reportes: `load-test-report.html`, `load-test-report-50.html`

### Auth real (Firebase)

| Comando | VUs | Requiere |
|---|---|---|
| `npm run load-test:real-auth` | 100 | Nada — spawnea servidor solo en puerto 3003 |

Requiere credenciales en `server/.env`:
```
FIREBASE_WEB_API_KEY=AIzaSy...
TEST_USER_EMAIL=loadtester@...
TEST_USER_PASSWORD=password123
```

Reporte: `load-test-report-real-auth.html`

### k6 (alternativa)

```bash
k6 run tests/load/load-test.js
```
Requiere servidor corriendo y k6 instalado.

---

## Test de Rate Limiting

| Comando | Qué verifica | Esperado |
|---|---|---|
| `npm run test:rate-limit` | Límite general (100 req/5s) | Bloquea en #101 |
| | Límite auth (10 req/5s) | Bloquea en #11 |

**No requiere servidor aparte** — spawnea servidores en puertos 3001 y 3002.

Reporte: `rate-limit-test-report.html`

---

## Resumen rápido

```bash
cd server

# Unitarios
npm test

# Carga (100 VUs, bypass auth)
npm run start:load-test   # terminal 1
npm run load-test         # terminal 2

# Carga (50 VUs, bypass auth)
npm run load-test:500

# Carga (100 VUs, auth real)
npm run load-test:real-auth

# Rate limiting
npm run test:rate-limit
```
