# 📊 PastelHub — Estado del Proyecto

> Documento generado: 04/06/2026

---

## 1. LO IMPLEMENTADO ✅

### Backend — API REST (Express + Firebase Admin)

| Módulo | Endpoints | Tests |
|--------|-----------|:-----:|
| **Auth** | `POST /sync`, `GET /me`, `POST /assign-role` | 8 |
| **Users** | CRUD + direcciones embebidas + activar/desactivar | 18 |
| **Shops** | CRUD + schedules + categorías + cambio de status | 21 |
| **Products** | CRUD + variantes + disponibilidad | 22 |
| **Orders** | CRUD + status history + payment status + summary | 27 |
| **Reviews** | CRUD + moderación + responder + recálculo rating | 22 |
| **Payments** | CRUD + filtros + auto-generación de facturas | 18 |
| **Notifications** | CRUD + bulk create + marcar leídas + conteo | 18 |
| **Reports** | CRUD + asignar moderador + cambiar estado | 28 |
| **Customers** | CRUD + subcolección addresses | 24 |
| **Promotions** | CRUD + toggle activo + filtro público activas | — |
| **Invoices** | CRUD + PDF generation + auto-generación al pagar | — |
| **Chat** | Sessions + messages + AI (Gemini + fallback) | — |
| **Support** | Tickets + messages + asignación + estados | — |
| **Health** | `GET /api/health` + 404 handler | 3 |
| **Middleware** | verifyToken + requireAdmin/Owner/Moderator/Customer/OwnerOrAdmin/SelfOrAdmin | 5 |

**Total: 338 tests unitarios** — 15 suites, todos pasando.

### Frontend — React (Vite) — 23 páginas funcionales

| Rol | Páginas |
|-----|---------|
| **Público** | Login, Register, ShopsList, ShopDetail, NotFound |
| **Cliente** | Cart, Checkout, MyOrders, OrderDetail, Profile, Notifications, Support, SupportNew, SupportDetail, Invoices |
| **Dueño** | OwnerDashboard (5 tabs: info, productos, órdenes, promociones, resumen), OwnerTabBoletas |
| **Moderador** | ModeratorDashboard, ModeratorNav |
| **Admin** | Dashboard, Users, Shops, Products, Orders, Reviews, Customers, Reports, Notifications, Payments, Promotions, Invoices, AdminNav |

### Infraestructura

- ✅ Rate limiting (100 req/15min general, 10 req/15min auth, ajustable en dev/test)
- ✅ Seguridad: helmet, CORS configurado
- ✅ Validación Zod en todos los endpoints de mutación
- ✅ Middleware de roles completo (7 middlewares)
- ✅ `app.listen()` separado de `app.js` (testeable con supertest)
- ✅ Modo LOAD_TEST con bypass de autenticación
- ✅ Dockerfiles para server y client
- ✅ nginx.conf con proxy reverso para API
- ✅ docker-compose.yml para orquestación
- ✅ Índices compuestos de Firestore configurados
- ✅ Firestore Rules con control de acceso por roles
- ✅ Ofuscación de código para producción
- ✅ Backup/restore scripts

---

## 2. LO QUE FALTA ❌

### Load Testing
- ❌ P95=6.6s con 5000 VUs desde Windows local (threshold <5s). Ejecutar desde GCP (Cloud Run Job) debería resolverlo.
- ❌ Rate limiting forzó 429 en un punto del test de 5000 VUs — ajustado a 100k/5s, monitorizar si es suficiente.
- ❌ Docker Desktop no corriendo localmente impidió usar deploy.sh con docker build.

### Funcionalidades Pendientes

| Funcionalidad | Prioridad | Descripción |
|---------------|-----------|-------------|
| 🖼️ **Firebase Storage** | Media | Subida de imágenes no implementada (solo URLs externas) |
| 🔔 **FCM Notifications** | Media | Firebase Cloud Messaging no integrado |
| 💳 **Pasarela de pagos real** | Baja | No integrada (payments es solo registro) |
| 🤖 **Chatbot con sesiones persistentes** | Baja | Chat funciona pero sin UI completa en frontend |

### Testing

- **Pruebas E2E** — No existen (Cypress/Playwright)
- **Pruebas de integración real contra Firestore** — Todas mockeadas
- **Snapshot tests** — No existen
- **Tests para chat, support, invoices, promotions** — Faltan tests unitarios

### Infraestructura

| Aspecto | Estado |
|---------|--------|
| Load testing hasta 5000 VUs | ✅ 0.0% fallos, P95=1.1s (pasa <5s) — 2,234 req/s desde Cloud Run Job. Opción QUICK mode (~75s) disponible |
| CI/CD | ❌ No configurado |
| Dominio/SSL | ❌ No configurado |
| Firestore Storage rules | ❌ No configuradas |

---

## 3. ASPECTOS A MEJORAR 🔧

1. **Consistencia en nombres de campos** — Backend usa snake_case en shops/products/promotions, pero camelCase en reviews/notifications. Unificar a snake_case.
2. **Sin store de estado global** — Solo AuthContext. Carrito usa localStorage. Considerar Zustand.
3. **Estilos inline** — framer-motion usado extensivamente a pesar de la convención "sin UI libs".
4. **Tests faltantes** — chat, support, invoices, promotions no tienen tests unitarios.
