# 📊 PastelHub — Estado del Proyecto

> Documento generado: 12/06/2026

---

## 1. LO IMPLEMENTADO ✅

### Backend — API REST (Express + Firebase Admin)

| Módulo | Endpoints | Tests |
|--------|-----------|:-----:|
| **Auth** | `POST /sync`, `GET /me`, `POST /assign-role` | 11 |
| **Users** | CRUD + direcciones embebidas + activar/desactivar | 20 |
| **Shops** | CRUD + schedules + categorías + cambio de status | 32 |
| **Products** | CRUD + variantes + disponibilidad | 23 |
| **Orders** | CRUD + status history + payment status + summary | 33 |
| **Reviews** | CRUD + moderación + responder + recálculo rating | 24 |
| **Payments** | CRUD + filtros + auto-generación de facturas | 22 |
| **Notifications** | CRUD + bulk create + marcar leídas + conteo | 20 |
| **Reports** | CRUD + asignar moderador + cambiar estado | 29 |
| **Customers** | CRUD + subcolección addresses | 31 |
| **Promotions** | CRUD + toggle activo + filtro público activas | 15 |
| **Invoices** | CRUD + PDF generation + auto-generación al pagar | 12 |
| **Health** | `GET /api/health` + 404 handler | 3 |
| **Middleware** | verifyToken + requireAdmin/Owner/Moderator/Customer/OwnerOrAdmin/SelfOrAdmin | 19 |
| **Backup/Restore** | Export/import colecciones, validación, dry-run | 12 |
| **Uploads** | Upload de imágenes shop/product/profile | 8 |
| **Cache** | In-memory LRU cache con TTL y stats | 11 |
| **FCM Service** | Push notifications, save/remove tokens | 5 |
| **Payment Gateway** | Simulado + MercadoPago, preferencias, webhooks | 6 |
| **WebSocket** | Conexiones, pushNotification, broadcastToUser | 4 |
| **AI Helper** | Role rules, catalog formatting | 14 |

**Total: 433 tests unitarios** — 23 suites, todos pasando.

### Frontend — React (Vite) + Vitest — 19 ficheros, ~175 tests

| Rol | Páginas |
|-----|---------|
| **Público** | Login, Register, ShopsList, ShopDetail, ProductDetail, NotFound |
| **Cliente** | Cart, Checkout, MyOrders, OrderDetail, Profile, Notifications, Invoices, Support, SupportNew, SupportDetail |
| **Dueño** | OwnerDashboard (6 tabs: info, productos, órdenes, promociones, boletas, resumen) |
| **Moderador** | ModeratorDashboard, ModeratorNav, ModeratorUsers |
| **Admin** | Dashboard, Users, Shops, Products, Orders, Reviews, Customers, Reports, Notifications, Payments, Promotions, Invoices, Chat, AdminNav |

### E2E — Playwright — 7 specs, 42 tests

| Spec | Descripción |
|------|-------------|
| `01-health` | Health check del servidor |
| `02-auth` | Flujos de autenticación |
| `03-shops` | Navegación de tiendas |
| `04-cart` | Operaciones del carrito |
| `05-navigation` | Navegación general |
| `06-admin` | Panel de administración |
| `07-404` | Página no encontrada |

### Infraestructura

- ✅ Seguridad: helmet, CORS configurado
- ✅ Validación Zod en todos los endpoints de mutación (14 esquemas)
- ✅ Middleware de roles completo (9 middlewares)
- ✅ `app.listen()` separado de `app.js` (testeable con supertest)
- ✅ Modo LOAD_TEST con bypass de autenticación
- ✅ Dockerfiles para server y client
- ✅ nginx.conf con proxy reverso para API
- ✅ docker-compose.yml para orquestación
- ✅ Índices compuestos de Firestore configurados
- ✅ Firestore Rules con control de acceso por roles
- ✅ Ofuscación de código para producción
- ✅ Backup/restore scripts
- ✅ **Logs estructurados** — Winston con formato JSON en prod, coloreado en dev; logging HTTP automático
- ✅ **Endpoint /api/metrics** — Monitoreo interno: uptime, memoria, CPU, versión de Node
- ✅ **Firestore connection pooling** — `maxIdleChannels: 100` para alto rendimiento
- ✅ **min-instances=5** — Cloud Run escala con 5 instancias mínimas para evitar cold starts
- ✅ **Stages progresivos en k6** — Ramp-up gradual para cargas de 10000-50000 VUs con thresholds dinámicos
- ✅ **Scripts k6 expandidos** — 12 scripts npm para 100/500/1000/5000/10000/50000 VUs en modo normal y quick

---

## 2. LO QUE FALTA ❌

### Testing

- **Pruebas de integración real contra Firestore** — Todas mockeadas (Firebase Admin mockeado en Jest setup)
- **Snapshot tests** — No existen
- **Tests de páginas client** — 14 admin + 7 owner/moderator + 5 públicas + 7 customer pages sin tests (~56/75 archivos)
- **Tests de servicios client** — 9 servicios sin tests (chat, customers, invoices, promotions, reports, storage, support, users, websocket)

### Infraestructura

| Aspecto | Estado |
|---------|--------|
| Load testing hasta 5000 VUs | ✅ 0.0% fallos, P95=1.1s (pasa <5s) — 2,234 req/s desde Cloud Run Job |
| CI/CD | ✅ Configurado (Cloud Build, 10 pasos, smoke tests, rollback automático) |
| E2E Tests | ✅ 7 specs Playwright (42 tests) |
| Dominio/SSL | ❌ No configurado |
| Firestore Storage rules | ✅ Configuradas en `storage.rules` |
| MercadoPago real | ✅ Código listo, pendiente: configurar `MERCADOPAGO_ACCESS_TOKEN` |
| FCM Push | ✅ Código listo server + client, pendiente: configurar VAPID key |
| Chatbot con sesiones | ✅ Implementado (Chatbot.jsx + aiHelper.js + sesiones persistentes) |

---

## 3. ASPECTOS A MEJORAR 🔧

1. **Consistencia en nombres de campos** — Backend usa snake_case en shops/products/promotions, pero camelCase en reviews/notifications. Unificar a snake_case vía mappers.
2. **Sin store de estado global** — Solo AuthContext. Carrito usa localStorage. Considerar Zustand con persist.
3. **Estilos inline** — Todos los estilos en JS objects. Considerar CSS Modules o Tailwind para mantenibilidad.
4. **PropTypes faltantes** — Ningún componente valida props. Agregar en componentes críticos (PaymentGateway, ImageUploader, OwnerDashboard).
5. **Tests de integración** — Todos los tests mockean Firestore. Considerar Firebase Emulator para tests reales.
