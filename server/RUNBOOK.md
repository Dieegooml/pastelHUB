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

| Comando | VUs | Ramp | Steady | Requiere |
|---|---|---|---|---|
| `npm run load-test` | 100 | 20s | 10s | Servidor con `npm run start:load-test` |
| `npm run load-test:50` | 50 | 20s | 10s | Servidor con `npm run start:load-test` |
| `npm run load-test:1000` | 1000 | 60s | 60s | Servidor con `npm run start:load-test` |
| `npm run load-test:5000` | 5000 | 120s | 120s | Servidor con `npm run start:load-test` |
| `npm run load-test:custom` | (env) | (env) | (env) | `set CONCURRENCY=N&& set RAMP_SECONDS=S&& set STEADY_SECONDS=S&& npm run load-test:custom` |

Reportes: `load-test-report.html`, `load-test-report-50.html`, etc.

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
# Smoke test rápido (~75s, 100 VUs)
npm run load-test:k6:quick

# Default: 1000 VUs (completo ~3.5min con 1min steady)
k6 run tests/load/load-test.js -e STEADY_MINUTES=1

# 5000 VUs completo (~3.5min)
k6 run tests/load/load-test.js -e MAX_VUS=5000 -e STEADY_MINUTES=1

# 5000 VUs modo rápido (~75s)
k6 run tests/load/load-test.js -e QUICK=true -e MAX_VUS=5000 -e STEADY_MINUTES=0

# Con reporte subido a GCS
k6 run tests/load/load-test.js -e MAX_VUS=1000 -e STEADY_MINUTES=1 -e REPORT_BUCKET=pastehub-2d2b2-backups
```

Requiere servidor corriendo y k6 instalado. Genera reporte HTML auto-contenido via `handleSummary()`.  
El modo `QUICK` usa rampas mínimas (5s→10s→15s + steady + 10s→5s bajada) para validación rápida.

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
