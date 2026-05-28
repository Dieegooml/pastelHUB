# 📡 API ENDPOINTS — DOCUMENTACIÓN COMPLETA

## Resumen Ejecutivo

PastelHub implementa una API REST completa con **11 módulos principales** y **80+ endpoints** desarrollados y funcionales.

**Base URL:** `http://localhost:3001/api`  
**Autenticación:** Firebase ID Token en header `Authorization: Bearer <token>`  
**Formato:** JSON

---

## 1️⃣ USERS — Gestión de Usuarios

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/users` | Listar todos los usuarios | ✅ Admin | 200 |
| GET | `/users/:id` | Obtener un usuario | ✅ Admin / Propio usuario | 200, 404 |
| POST | `/users` | Crear usuario | ✅ Admin | 201, 400, 404 |
| PUT | `/users/:id` | Actualizar usuario (roles solo admin) | ✅ Admin / Propio usuario | 200, 404 |
| DELETE | `/users/:id` | Eliminar usuario | ✅ Admin | 200, 404 |
| PATCH | `/users/:id/status` | Cambiar estado activo/inactivo | ✅ Admin | 200, 404 |

### Sub-recursos — Direcciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/users/:id/addresses` | Listar direcciones |
| POST | `/users/:id/addresses` | Agregar dirección |
| PUT | `/users/:id/addresses/:addressId` | Actualizar dirección |
| DELETE | `/users/:id/addresses/:addressId` | Eliminar dirección |

---

## 2️⃣ SHOPS — Gestión de Pastelerías

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/shops` | Listar pastelerías | ✅ Público | 200 |
| GET | `/shops/owner/:ownerId` | Pastelerías por dueño | ✅ Público | 200 |
| GET | `/shops/:id` | Obtener una pastelería | ✅ Público | 200, 404 |
| POST | `/shops` | Crear pastelería | ✅ Owner / Admin | 201, 400, 404 |
| PUT | `/shops/:id` | Actualizar pastelería | ✅ Owner / Admin | 200, 404 |
| PATCH | `/shops/:id/status` | Cambiar estado aprobación | ✅ Admin | 200, 400, 404 |
| DELETE | `/shops/:id` | Eliminar pastelería | ✅ Owner / Admin | 200, 404 |

### Sub-recursos — Schedules (Horarios)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/shops/:id/schedules` | Listar horarios |
| POST | `/shops/:id/schedules` | Agregar horario |
| PUT | `/shops/:id/schedules/:day` | Actualizar horario |
| DELETE | `/shops/:id/schedules/:day` | Eliminar horario |

### Sub-recursos — Categories (Categorías)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/shops/:id/categories` | Listar categorías |
| POST | `/shops/:id/categories` | Agregar categoría |
| PUT | `/shops/:id/categories/:categoryId` | Actualizar categoría |
| DELETE | `/shops/:id/categories/:categoryId` | Eliminar categoría |

---

## 3️⃣ PRODUCTS — Gestión de Productos

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/products` | Listar todos los productos | ✅ Público | 200 |
| GET | `/products/shop/:shopId` | Productos por pastelería | ✅ Público | 200 |
| GET | `/products/:id` | Obtener un producto | ✅ Público | 200, 404 |
| POST | `/products` | Crear producto | ✅ Owner / Admin | 201, 400, 404 |
| PUT | `/products/:id` | Actualizar producto | ✅ Owner / Admin | 200, 404 |
| DELETE | `/products/:id` | Eliminar producto | ✅ Owner / Admin | 200, 404 |
| PATCH | `/products/:id/availability` | Cambiar disponibilidad | ✅ Owner / Admin | 200, 400, 404 |

### Sub-recursos — Variants (Variantes)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/products/:id/variants` | Listar variantes |
| POST | `/products/:id/variants` | Agregar variante |
| PUT | `/products/:id/variants/:variantId` | Actualizar variante |
| DELETE | `/products/:id/variants/:variantId` | Eliminar variante |

---

## 4️⃣ ORDERS — Gestión de Órdenes

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/orders` | Listar todas las órdenes | ✅ Admin | 200 |
| GET | `/orders/shop/:shopId` | Órdenes por pastelería | ✅ Owner / Admin | 200 |
| **GET** | **`/orders/shop/:shopId/summary`** | **Estadísticas de ventas** | **✅ Owner / Admin** | **200** |
| GET | `/orders/customer/:userId` | Órdenes por cliente | ✅ Propio usuario / Admin | 200 |
| GET | `/orders/status/:status` | Filtrar por estado | ✅ Admin | 200, 400 |
| GET | `/orders/:id` | Obtener una orden | ✅ Propio usuario / Owner / Admin | 200, 404 |
| POST | `/orders` | Crear orden | ✅ Customer | 201, 400, 404 |
| DELETE | `/orders/:id` | Eliminar orden | ✅ Admin | 200, 404 |
| PATCH | `/orders/:id/status` | Cambiar estado | ✅ Owner / Admin | 200, 400, 404 |
| PATCH | `/orders/:id/payment-status` | Actualizar estado de pago | ✅ Admin | 200, 400, 404 |
| **PATCH** | **`/orders/:id/cancel`** | **Cancelar orden pendiente** | **✅ Customer** | **200, 400, 404** |
| PATCH | `/orders/:id/review` | Agregar reseña a orden | ✅ Customer | 200, 400, 404 |
| PATCH | `/orders/:id/review/reply` | Responder reseña desde orden | ✅ Owner | 200, 400, 404 |

### Summary — Campos de Respuesta

```json
{
  "totalOrders": 42,
  "totalRevenue": 1234.56,
  "avgOrderValue": 29.39,
  "revenueToday": 45.00,
  "revenueThisWeek": 234.00,
  "revenueThisMonth": 890.00,
  "ordersByStatus": { "pending": 5, "delivered": 28, "cancelled": 3 },
  "dailySales": [{ "date": "2026-05-01", "revenue": 120, "orders": 4 }],
  "topProducts": [{ "name": "Pastel Chocolate", "quantity": 15, "revenue": 225 }],
  "revenueByMethod": { "yape": 500, "card": 400, "cash": 334.56 },
  "monthlyRevenue": [{ "month": "2026-05", "revenue": 890, "orders": 20 }]
}
```

---

## 5️⃣ NOTIFICATIONS — Gestión de Notificaciones

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/notifications` | Listar todas | ✅ Admin | 200 |
| GET | `/notifications/user/:userId` | Por usuario | ✅ Propio usuario / Admin | 200 |
| GET | `/notifications/user/:userId/unread` | No leídas por usuario | ✅ Propio usuario / Admin | 200 |
| **GET** | **`/notifications/user/:userId/unread/count`** | **Conteo de no leídas** | **✅ Propio usuario / Admin** | **200** |
| GET | `/notifications/:id` | Obtener una | ✅ Propio usuario / Admin | 200, 404 |
| POST | `/notifications` | Crear notificación | ✅ Admin | 201, 400, 404 |
| POST | `/notifications/bulk` | Crear múltiples | ✅ Admin | 201, 400 |
| DELETE | `/notifications/:id` | Eliminar una | ✅ Propio usuario / Admin | 200, 404 |
| DELETE | `/notifications/user/:userId` | Eliminar todas de usuario | ✅ Admin | 200, 404 |
| PATCH | `/notifications/:id/read` | Marcar como leída | ✅ Propio usuario / Admin | 200, 404 |
| PATCH | `/notifications/user/:userId/read-all` | Marcar todas como leídas | ✅ Propio usuario / Admin | 200, 404 |

---

## 6️⃣ REPORTS — Gestión de Reportes

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/reports` | Listar todos | ✅ Moderator / Admin | 200 |
| GET | `/reports/status/:status` | Filtrar por estado | ✅ Moderator / Admin | 200, 400 |
| GET | `/reports/target/:targetType` | Filtrar por tipo de objetivo | ✅ Moderator / Admin | 200, 400 |
| GET | `/reports/moderator/:moderatorId` | Por moderador asignado | ✅ Moderator / Admin | 200 |
| GET | `/reports/user/:userId` | Por usuario que reportó | ✅ Propio usuario / Admin | 200 |
| GET | `/reports/:id` | Obtener uno | ✅ Moderator / Admin | 200, 404 |
| **POST** | **`/reports`** | **Crear reporte** | **✅ Público (autenticado)** | **201, 400, 404** |
| PUT | `/reports/:id` | Editar reporte | ✅ Moderator / Admin | 200, 404 |
| DELETE | `/reports/:id` | Eliminar reporte | ✅ Admin | 200, 404 |
| PATCH | `/reports/:id/assign` | Asignar moderador | ✅ Moderator / Admin | 200, 404 |
| PATCH | `/reports/:id/status` | Cambiar estado | ✅ Moderator / Admin | 200, 400, 404 |

---

## 7️⃣ REVIEWS — Gestión de Reseñas

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/reviews` | Listar todas | ✅ Moderator / Admin | 200 |
| GET | `/reviews/shop/:shopId` | Reseñas aprobadas de una pastelería | ✅ Público | 200 |
| GET | `/reviews/customer/:customerId` | Reseñas de un cliente | ✅ Propio usuario / Admin | 200 |
| GET | `/reviews/status/:status` | Filtrar por estado (moderación) | ✅ Moderator / Admin | 200, 400 |
| GET | `/reviews/:id` | Obtener una reseña | ✅ Autor / Owner / Admin | 200, 404 |
| POST | `/reviews` | Crear reseña (auto-aprobada) | ✅ Customer | 201, 400, 404 |
| PUT | `/reviews/:id` | Editar reseña (solo pending) | ✅ Autor / Admin | 200, 400, 404 |
| DELETE | `/reviews/:id` | Eliminar reseña | ✅ Autor / Admin | 200, 404 |
| PATCH | `/reviews/:id/status` | Aprobar/rechazar reseña | ✅ Moderator / Admin | 200, 400, 404 |
| PATCH | `/reviews/:id/reply` | Responder reseña (dueño) | ✅ Owner / Admin | 200, 400, 404 |

---

## 8️⃣ PROMOTIONS — Gestión de Promociones

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/promotions/shop/:shopId` | Promociones activas y vigentes | ✅ Público | 200 |
| GET | `/promotions/shop/:shopId/all` | Todas las promociones (incluye inactivas/vencidas) | ✅ Owner / Admin | 200 |
| GET | `/promotions/:id` | Obtener una promoción | ✅ Público | 200, 404 |
| POST | `/promotions` | Crear promoción | ✅ Owner / Admin | 201, 400, 404 |
| PUT | `/promotions/:id` | Actualizar promoción | ✅ Owner / Admin | 200, 404 |
| PATCH | `/promotions/:id/toggle` | Activar/desactivar promoción | ✅ Owner / Admin | 200, 404 |
| DELETE | `/promotions/:id` | Eliminar promoción | ✅ Owner / Admin | 200, 404 |

### Tipos de Promoción Válidos

```
'discount'  → Descuento por porcentaje o monto fijo
'combo'     → Productos agrupados a precio especial
'bogo'      → 2x1 (compra uno, llévate otro gratis)
```

### Estructura de Datos

```json
{
  "id": "promo123",
  "shop_id": "shop123",
  "name": "Descuento de Verano",
  "type": "discount",
  "description": "20% en todos los pasteles",
  "discount_percentage": 20,
  "discount_amount": null,
  "combo_items": [],
  "combo_price": null,
  "product_ids": [],
  "start_date": "2026-06-01T00:00:00Z",
  "end_date": "2026-06-30T23:59:59Z",
  "is_active": true,
  "createdAt": "2026-05-20T10:30:00Z",
  "updatedAt": "2026-05-20T10:30:00Z"
}
```

---

## 9️⃣ PAYMENTS — Gestión de Pagos

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/payments` | Listar todos los pagos | ✅ Admin | 200 |
| GET | `/payments/order/:orderId` | Pago de una orden | ✅ Propio usuario / Admin | 200, 404 |
| GET | `/payments/:id` | Obtener un pago | ✅ Propio usuario / Admin | 200, 404 |
| POST | `/payments` | Crear pago | ✅ Customer | 201, 400, 404 |
| PUT | `/payments/:id` | Actualizar pago | ✅ Admin | 200, 404 |

---

## 🔟 CUSTOMERS — Perfiles de Cliente

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/customers` | Listar todos los clientes | ✅ Admin | 200 |
| GET | `/customers/:id` | Obtener perfil de cliente | ✅ Propio usuario / Admin | 200, 404 |
| **POST** | **`/customers`** | **Crear perfil (auto usando req.user.uid)** | **✅ Autenticado** | **201, 400** |
| PUT | `/customers/:id` | Actualizar perfil | ✅ Propio usuario / Admin | 200, 404 |
| PATCH | `/customers/:id` | Actualizar parcialmente | ✅ Propio usuario / Admin | 200, 404 |
| DELETE | `/customers/:id` | Eliminar perfil | ✅ Admin | 200, 404 |

### Sub-recursos — Addresses (Direcciones de envío)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/customers/:id/addresses` | Listar direcciones |
| POST | `/customers/:id/addresses` | Agregar dirección |
| PUT | `/customers/:id/addresses/:addressId` | Actualizar dirección |
| DELETE | `/customers/:id/addresses/:addressId` | Eliminar dirección |

---

## 1️⃣1️⃣ AUTH — Autenticación

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| POST | `/auth/sync` | Sincronizar usuario tras login (auto-crea customer) | ✅ Token | 200 |
| GET | `/auth/me` | Obtener perfil del usuario autenticado | ✅ Token | 200 |
| POST | `/auth/assign-role` | Asignar roles a usuario | ✅ Admin | 201, 400, 404 |

---

## Rate Limiting

| Limiter | Ventana | Límite (dev) | Límite (prod) |
|---------|---------|-------------|---------------|
| General | 15 min | 500 | 100 |
| Auth | 15 min | 100 | 10 |

---

## Códigos de Estado HTTP

| Código | Significado | Ejemplo |
|--------|------------|---------|
| **200** | OK — Solicitud exitosa | GET, PUT, PATCH exitoso |
| **201** | Created — Recurso creado | POST exitoso |
| **400** | Bad Request — Datos inválidos | Falta parámetro requerido |
| **403** | Forbidden — Sin permisos | Rol insuficiente |
| **404** | Not Found — Recurso no existe | ID inválido |
| **429** | Too Many Requests — Rate limit | Demasiadas solicitudes |
| **500** | Server Error — Error interno | Error del servidor |

---

## Capa de Servicios en Frontend

Todos los endpoints están consumidos por servicios en `client/src/services/`:

| Servicio | Archivo | Métodos |
|----------|---------|---------|
| `apiService.js` | Base HTTP con fetch + interceptor 401 con refresh automático | — |
| `authService.js` | Login, registro, sync, reset password | `login`, `register`, `sync`, `assignRole`, `getMe`, `resetPassword` |
| `usersService.js` | CRUD usuarios + direcciones | `getAll`, `getById`, `create`, `update`, `delete`, `updateStatus`, addresses |
| `shopsService.js` | CRUD pastelerías + schedules + categories | `getAll`, `getById`, `getByOwner`, `create`, `update`, `delete`, schedules, categories |
| `productsService.js` | CRUD productos + variantes | `getAll`, `getByShop`, `getById`, `create`, `update`, `delete`, `updateAvailability`, variants |
| `ordersService.js` | CRUD órdenes + cancel + review + summary | `getAll`, `getByShop`, `getSummary`, `getById`, `create`, `delete`, `cancelOrder`, `updateStatus`, `addReview`, `replyReview` |
| `paymentsService.js` | CRUD pagos | `getAll`, `getByOrder`, `getById`, `create`, `update` |
| `reviewsService.js` | CRUD reseñas + moderación | `getAll`, `getByShop`, `getByCustomer`, `getByStatus`, `getById`, `create`, `update`, `delete`, `reply`, `updateStatus` |
| `notificationsService.js` | CRUD notificaciones + conteo | `getAll`, `getByUser`, `getUnreadByUser`, `getUnreadCount`, `getById`, `create`, `createBulk`, `delete`, `deleteByUser`, `markAsRead`, `markAllAsRead` |
| `reportsService.js` | CRUD reportes + moderación | `getAll`, `getByStatus`, `getByTarget`, `getByModerator`, `getByUser`, `getById`, `create`, `update`, `delete`, `assign`, `updateStatus` |
| `customersService.js` | CRUD clientes + direcciones | `getAll`, `getById`, `create`, `update`, `patch`, `delete`, addresses |
| `promotionsService.js` | CRUD promociones | `getByShopPublic`, `getByShopAll`, `getById`, `create`, `update`, `toggle`, `delete` |

---

**Documento generado:** 28/05/2026  
**Total de Endpoints:** 80+  
**Estado:** ✅ Implementados y Documentados
