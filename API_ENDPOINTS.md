# 📡 API ENDPOINTS - DOCUMENTACIÓN COMPLETA

## Resumen Ejecutivo

PastelHub implementa una API REST completa con **7 módulos principales** y **40+ endpoints** desarrollados y funcionales.

**Base URL:** `http://localhost:3001/api`  
**Autenticación:** Firebase ID Token en header `Authorization: Bearer <token>`  
**Formato:** JSON

---

## 1️⃣ USERS - Gestión de Usuarios

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/users` | Listar todos los usuarios | ✅ Admin | 200 |
| GET | `/users/:id` | Obtener un usuario | ✅ Admin | 200, 404 |
| POST | `/users` | Crear usuario | ✅ Admin | 201, 400, 404 |
| PUT | `/users/:id` | Actualizar usuario | ✅ Admin | 200, 404 |
| DELETE | `/users/:id` | Eliminar usuario | ✅ Admin | 200, 404 |
| PATCH | `/users/:id/status` | Cambiar estado activo/inactivo | ✅ Admin | 200, 404 |

### Estructura de Datos

```json
{
  "id": "uid_firebase",
  "email": "user@example.com",
  "full_name": "Nombre Completo",
  "phone": "+51999999999",
  "roles": ["customer", "admin"],
  "addresses": [],
  "createdAt": "2026-05-17T10:30:00Z",
  "updatedAt": "2026-05-17T10:30:00Z"
}
```

### Ejemplos de Requests

```bash
# GET todos los usuarios
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer <token>"

# POST crear usuario
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "password123",
    "phone": "+51999999999",
    "roles": ["customer"]
  }'

# PUT actualizar usuario
curl -X PUT http://localhost:3001/api/users/user123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Juan Carlos Pérez",
    "phone": "+51998888888"
  }'
```

---

## 2️⃣ SHOPS - Gestión de Pastelerías

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/shops` | Listar todas las pastelerías | ✅ Admin | 200 |
| GET | `/shops/:id` | Obtener una pastelería | ✅ Admin | 200, 404 |
| POST | `/shops` | Crear pastelería | ✅ Admin | 201, 400, 404 |
| PUT | `/shops/:id` | Actualizar pastelería | ✅ Admin | 200, 404 |
| DELETE | `/shops/:id` | Eliminar pastelería | ✅ Admin | 200, 404 |
| PATCH | `/shops/:id/status` | Cambiar estado (pending\|approved\|rejected\|suspended) | ✅ Admin | 200, 400, 404 |

### Estructura de Datos

```json
{
  "id": "shop123",
  "owner_id": "uid_firebase",
  "name": "La Delicia Pastelera",
  "description": "Pasteles y tortas artesanales",
  "logo_url": "https://...",
  "rating": 4.8,
  "status": "approved",
  "schedules": [],
  "categories": [],
  "createdAt": "2026-05-17T10:30:00Z",
  "updatedAt": "2026-05-17T10:30:00Z"
}
```

### Sub-recursos

#### Schedules (Horarios)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/shops/:id/schedules` | Listar horarios |
| POST | `/shops/:id/schedules` | Agregar horario |
| PUT | `/shops/:id/schedules/:day` | Actualizar horario |
| DELETE | `/shops/:id/schedules/:day` | Eliminar horario |

#### Categories (Categorías)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/shops/:id/categories` | Listar categorías |
| POST | `/shops/:id/categories` | Agregar categoría |
| PUT | `/shops/:id/categories/:categoryId` | Actualizar categoría |
| DELETE | `/shops/:id/categories/:categoryId` | Eliminar categoría |

---

## 3️⃣ PRODUCTS - Gestión de Productos

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/products` | Listar todos los productos | ✅ Admin | 200 |
| GET | `/products/shop/:shopId` | Productos por pastelería | ✅ Admin | 200 |
| GET | `/products/:id` | Obtener un producto | ✅ Admin | 200, 404 |
| POST | `/products` | Crear producto | ✅ Admin | 201, 400, 404 |
| PUT | `/products/:id` | Actualizar producto | ✅ Admin | 200, 404 |
| DELETE | `/products/:id` | Eliminar producto | ✅ Admin | 200, 404 |
| PATCH | `/products/:id/availability` | Cambiar disponibilidad | ✅ Admin | 200, 400, 404 |

### Estructura de Datos

```json
{
  "id": "prod123",
  "shop_id": "shop123",
  "name": "Torta de Chocolate",
  "description": "Deliciosa torta con cobertura de chocolate",
  "price": 45.99,
  "stock": 10,
  "image_url": "https://...",
  "is_available": true,
  "variants": [],
  "createdAt": "2026-05-17T10:30:00Z",
  "updatedAt": "2026-05-17T10:30:00Z"
}
```

### Sub-recursos

#### Variants (Variantes)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/products/:id/variants` | Listar variantes |
| POST | `/products/:id/variants` | Agregar variante |
| PUT | `/products/:id/variants/:variantId` | Actualizar variante |
| DELETE | `/products/:id/variants/:variantId` | Eliminar variante |

---

## 4️⃣ ORDERS - Gestión de Órdenes

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/orders` | Listar todas las órdenes | ✅ Admin | 200 |
| GET | `/orders/shop/:shopId` | Órdenes por pastelería | ✅ Admin | 200 |
| GET | `/orders/customer/:userId` | Órdenes por cliente | ✅ Admin | 200 |
| GET | `/orders/status/:status` | Filtrar por estado | ✅ Admin | 200, 400 |
| GET | `/orders/:id` | Obtener una orden | ✅ Admin | 200, 404 |
| POST | `/orders` | Crear orden | ✅ Admin | 201, 400, 404 |
| DELETE | `/orders/:id` | Eliminar orden | ✅ Admin | 200, 404 |
| PATCH | `/orders/:id/status` | Cambiar estado | ✅ Admin | 200, 400, 404 |
| PATCH | `/orders/:id/payment-status` | Actualizar estado de pago | ✅ Admin | 200, 400, 404 |

### Estados Válidos

```
pending → confirmed → preparing → on_the_way → delivered
       ↘                              ↗ cancelled
```

### Estructura de Datos

```json
{
  "id": "order123",
  "customer": {
    "user_id": "uid123",
    "name": "Juan Pérez"
  },
  "shop": {
    "shop_id": "shop123",
    "name": "La Delicia Pastelera"
  },
  "items": [
    {
      "product_id": "prod123",
      "name": "Torta de Chocolate",
      "quantity": 2,
      "price_at_purchase": 45.99
    }
  ],
  "totals": {
    "subtotal": 91.98,
    "delivery_fee": 5.00,
    "total": 96.98
  },
  "payment": {
    "method": "card",
    "transaction_ref": "txn_123456"
  },
  "status": "pending",
  "createdAt": "2026-05-17T10:30:00Z"
}
```

---

## 5️⃣ NOTIFICATIONS - Gestión de Notificaciones

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/notifications` | Listar todas | ✅ Admin | 200 |
| GET | `/notifications/user/:userId` | Por usuario | ✅ Admin | 200 |
| GET | `/notifications/user/:userId/unread` | No leídas por usuario | ✅ Admin | 200 |
| GET | `/notifications/:id` | Obtener una | ✅ Admin | 200, 404 |
| POST | `/notifications` | Crear notificación | ✅ Admin | 201, 400, 404 |
| POST | `/notifications/bulk` | Crear múltiples | ✅ Admin | 201, 400 |
| DELETE | `/notifications/:id` | Eliminar una | ✅ Admin | 200, 404 |
| DELETE | `/notifications/user/:userId` | Eliminar todas de usuario | ✅ Admin | 200, 404 |
| PATCH | `/notifications/:id/read` | Marcar como leída | ✅ Admin | 200, 404 |
| PATCH | `/notifications/user/:userId/read-all` | Marcar todas como leídas | ✅ Admin | 200, 404 |

### Tipos de Notificación Válidos

```
'order_update' | 'new_review' | 'shop_approved' | 'shop_rejected' | 
'shop_suspended' | 'report_resolved' | 'new_order' | 'payment_confirmed'
```

---

## 6️⃣ REPORTS - Gestión de Reportes

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| GET | `/reports` | Listar todos | ✅ Admin | 200 |
| GET | `/reports/status/:status` | Filtrar por estado | ✅ Admin | 200, 400 |
| GET | `/reports/target/:targetType` | Filtrar por tipo | ✅ Admin | 200, 400 |
| GET | `/reports/moderator/:moderatorId` | Por moderador | ✅ Admin | 200 |
| GET | `/reports/user/:userId` | Por usuario que reportó | ✅ Admin | 200 |
| GET | `/reports/:id` | Obtener uno | ✅ Admin | 200, 404 |
| POST | `/reports` | Crear reporte | ✅ Admin | 201, 400, 404 |
| PUT | `/reports/:id` | Editar reporte | ✅ Admin | 200, 404 |
| DELETE | `/reports/:id` | Eliminar reporte | ✅ Admin | 200, 404 |
| PATCH | `/reports/:id/assign` | Asignar moderador | ✅ Admin | 200, 404 |
| PATCH | `/reports/:id/status` | Cambiar estado | ✅ Admin | 200, 400, 404 |

### Estados Válidos

```
open → resolved
    ↘ dismissed
```

### Tipos de Objetivo Válidos

```
'review' | 'shop' | 'product'
```

---

## 7️⃣ AUTH - Autenticación

### Endpoints

| Método | Ruta | Descripción | Auth | Status |
|--------|------|-------------|------|--------|
| POST | `/auth/sync` | Sincronizar usuario tras login | ✅ Token | 200 |
| GET | `/auth/me` | Obtener perfil del usuario | ✅ Token | 200 |
| POST | `/auth/assign-role` | Asignar roles a usuario | ✅ Admin | 201, 400, 404 |

---

## Códigos de Estado HTTP

| Código | Significado | Ejemplo |
|--------|------------|---------|
| **200** | OK - Solicitud exitosa | GET, PUT, PATCH exitoso |
| **201** | Created - Recurso creado | POST exitoso |
| **400** | Bad Request - Datos inválidos | Falta parámetro requerido |
| **404** | Not Found - Recurso no existe | ID inválido |
| **429** | Too Many Requests - Rate limit | Demasiadas solicitudes |
| **500** | Server Error - Error interno | Error del servidor |

---

## Respuestas de Error Estándar

```json
{
  "error": "Mensaje descriptivo del error"
}
```

### Ejemplos

```json
// 400 Bad Request
{
  "error": "shop_id, name y price son requeridos"
}

// 404 Not Found
{
  "error": "Producto no encontrado"
}

// 429 Too Many Requests
{
  "error": "Demasiadas peticiones, intenta en 15 minutos"
}

// 500 Server Error
{
  "error": "Error interno del servidor"
}
```

---

## Capa de Servicios en Frontend

Todos los endpoints están consumidos por servicios Node.js en `client/src/services/`:

- `apiService.js` - Base con fetch + token
- `usersService.js` - Endpoints de usuarios
- `shopsService.js` - Endpoints de pastelerías
- `productsService.js` - Endpoints de productos
- `ordersService.js` - Endpoints de órdenes
- `notificationsService.js` - Endpoints de notificaciones
- `reportsService.js` - Endpoints de reportes
- `authService.js` - Endpoints de autenticación

---

## Testing con Postman

Se proporciona colección Postman con todos los endpoints en: `docs/PastelHub.postman_collection.json`

Pasos:
1. Importar colección en Postman
2. Configurar variable `{{token}}` con un Firebase ID Token válido
3. Ejecutar requests contra `{{baseUrl}}` (http://localhost:3001/api)

---

**Documento generado:** 17/05/2026  
**Total de Endpoints:** 40+  
**Estado:** ✅ Implementados y Documentados
