# 🎂 PastelHub

> Marketplace multi-pastelería — conecta clientes con pastelerías artesanales locales.

PastelHub es una plataforma web tipo Rappi, pero especializada exclusivamente en pastelerías y reposterías. Permite que múltiples locales gestionen su negocio de forma independiente dentro de un mismo sistema centralizado, mientras los clientes exploran, personalizan y piden productos desde una sola aplicación web construida con React.

---

## Tabla de contenidos

- [Características](#características)
- [Roles del sistema](#roles-del-sistema)
- [Tech stack](#tech-stack)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Base de datos (Firestore)](#base-de-datos-firestore)
- [Autenticación](#autenticación)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Endpoints principales](#endpoints-principales)
- [Flujos clave](#flujos-clave)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Equipo](#equipo)

---

## Características

- 🏪 **Multi-tenant** — cada pastelería gestiona sus propios productos, categorías y pedidos sin interferir con otras
- 👥 **4 roles** — cliente, dueño de pastelería, moderador y administrador de plataforma
- 🛒 **Carrito multi-pastelería** — los clientes pueden explorar varias pastelerías en una sola sesión
- 🎨 **Productos personalizables** — tamaño, sabor, inscripción y otras variantes por producto
- 📦 **Seguimiento de pedidos** — estados en tiempo real desde confirmado hasta entregado
- 💳 **Pagos múltiples** — tarjeta, efectivo, Yape y Plin
- ⭐ **Reseñas verificadas** — solo clientes con pedido completado pueden reseñar (auto-aprobadas)
- 📊 **Analytics por pastelería** — ventas diarias, mensuales, productos top, ingresos por método de pago
- 🏷️ **Promociones** — descuentos, combos y 2x1 gestionados por cada dueño
- 🔔 **Notificaciones** — campanita con badge de no leídas, dropdown y página de usuario
- ✅ **Flujo de aprobación** — las nuevas pastelerías requieren validación antes de publicarse
- 🛡️ **Moderación de contenido** — revisión de reseñas, reportes y gestión de disputas
- 🔄 **Recuperación de contraseña** — flujo completo con Firebase (sin backend propio)
- 🤖 **Chatbot con IA** — asistente virtual impulsado por Gemini API para consultas sobre pedidos, productos y soporte (próximamente)
- 📊 **Monitoreo interno** — endpoint `/api/metrics` con uptime, memoria, CPU y versión de Node
- 📝 **Logs estructurados** — Winston con formato JSON en producción, coloreado en desarrollo, logging HTTP automático
- ⚡ **Firestore optimizado** — connection pooling con `maxIdleChannels: 100`
- 🔄 **Ramp-up progresivo** — Stages de load test graduales para 5000-50000 VUs con thresholds dinámicos

---

## Roles del sistema

| Rol | Descripción |
|---|---|
| `admin` | Control total de la plataforma: usuarios, pastelerías, aprobaciones, configuración global |
| `moderator` | Revisa y modera reseñas, gestiona reportes de contenido inapropiado y disputas entre usuarios y locales |
| `owner` | Gestiona su propia pastelería: productos, categorías, horarios, pedidos, reseñas |
| `customer` | Explora pastelerías, realiza pedidos, paga y deja reseñas |

> Un usuario puede tener múltiples roles asignados simultáneamente (campo `roles: []` en el documento `users` de Firestore). La autenticación y asignación de roles se gestiona vía Firebase Auth + Custom Claims.

---

## Tech stack

| Capa | Tecnología |
|---|---|
| **Frontend web** | React 19 + Vite 8 (JavaScript) |
| **UI web** | Estilos inline con objeto JS (sin librerías externas) |
| **Backend** | Node.js + Express.js |
| **Base de datos** | Firebase Firestore (NoSQL) |
| **Autenticación** | Firebase Authentication + Custom Claims (roles) |
| **Pruebas** | Jest 30 + Supertest (338 tests), k6 (carga hasta 50000 VUs) |
| **Despliegue** | Vite build → servidor Express (frontend estático + API unificados) |

---

## Arquitectura del proyecto

```
React App (navegador)
        │
        │  HTTP / REST + JSON
        ▼
Express API (Node.js)
        │
        ├── Winston Logger (HTTP logging + errores)
        ├── Firebase Auth Middleware (verifica ID Token)
        ├── Role Guard (custom claims + allow-self)
        │
        ├── /api/auth
        ├── /api/users
        ├── /api/shops
        ├── /api/products
        ├── /api/orders
        ├── /api/notifications
        ├── /api/reviews
        ├── /api/reports
        ├── /api/payments
        ├── /api/customers
        ├── /api/promotions
        ├── /api/metrics (monitoreo)
        ├── /api/health
        ├── /api/backup
        ├── /api/chat
        ├── /api/invoices
        ├── /api/support
        │
        ▼
Firebase Firestore (NoSQL)
```

---

## Base de datos (Firestore)

El esquema está diseñado como **colecciones Firestore** con modelo multi-tenant implícito: cada documento de pastelería o producto incluye el `shopId` correspondiente. Se aprovechan las **subcolecciones** para datos fuertemente acoplados.

### Colecciones principales

| Colección | Descripción |
|---|---|
| `users` | Todos los usuarios del sistema (uid = Firebase Auth UID) |
| `customers` | Perfil extendido del cliente (subcolección `addresses`) |
| `pastryShops` | Locales registrados (subcolección `schedules`, `categories`) |
| `products` | Catálogo por pastelería (subcolección `variants`) |
| `orders` | Pedidos realizados (subcolección `items`) |
| `payments` | Registro de pagos vinculados a una orden |
| `reviews` | Reseñas de clientes (auto-aprobadas al crear) |
| `notifications` | Notificaciones del sistema por usuario |
| `reports` | Reportes de contenido inapropiado gestionados por moderadores |
| `promotions` | Promociones (descuentos, combos, 2x1) por pastelería |

### Diagrama de base de datos

![Diagrama de base de datos](assets/diagramaPastelHUB.png)

> Diagrama editable disponible en [draw.io](https://app.diagrams.net) — importar `assets/diagramaPastelHUB.png` para editar.

### Estructura de documentos

```
users/{uid}
  ├── name, lastName, email, phone
  ├── profilePicture, isActive
  ├── roles: ['customer', 'owner']   ← array de roles
  └── createdAt, updatedAt

customers/{uid}
  ├── defaultAddressId
  └── addresses/ (subcolección)
        └── {addressId}
              ├── street, city, district, reference
              └── isDefault

pastryShops/{shopId}
  ├── ownerId, shopName, description
  ├── logoUrl, bannerUrl, address, city
  ├── phone, email, rating
  ├── isActive, approvalStatus
  ├── createdAt, updatedAt
  ├── schedules/ (subcolección)
  │     └── {scheduleId} → dayOfWeek, openTime, closeTime, isClosed
  └── categories/ (subcolección)
        └── {categoryId} → categoryName, description, imageUrl, isActive

products/{productId}
  ├── shopId, categoryId
  ├── productName, description, price, stock
  ├── imageUrl, isAvailable
  ├── createdAt, updatedAt
  └── variants/ (subcolección)
        └── {variantId} → variantType, variantValue, extraPrice

orders/{orderId}
  ├── customerId, shopId, addressId
  ├── status, deliveryType, scheduledAt
  ├── subtotal, deliveryFee, total, notes
  ├── createdAt, updatedAt
  └── items/ (subcolección)
        └── {itemId} → productId, quantity, unitPrice, subtotal, customizationNotes

payments/{paymentId}
  ├── orderId, paymentMethod, paymentStatus
  ├── amount, transactionRef, paidAt

reviews/{reviewId}
  ├── customerId, shopId, orderId
  ├── rating, comment
  ├── ownerReply, repliedAt
  ├── status (approved)   ← auto-aprobadas al crear
  └── createdAt

notifications/{notificationId}
  ├── userId, type, message
  ├── isRead, createdAt

chatSessions/{sessionId}
  ├── userId (nullable para anónimos), shopId (nullable)
  ├── messages: [{role, content, timestamp}]
  └── createdAt, updatedAt

reports/{reportId}
  ├── reportedBy (userId, tomado automáticamente del token), targetType (review|shop|product)
  ├── targetId, reason, status (open|resolved|dismissed)
  ├── assignedTo (moderatorId, nullable)
  └── createdAt, resolvedAt

promotions/{promotionId}
  ├── shop_id, name, type (discount|combo|bogo)
  ├── description, discount_percentage, discount_amount
  ├── combo_items, combo_price, product_ids
  ├── start_date, end_date, is_active
  └── createdAt, updatedAt
```

> **Índices compuestos recomendados:** `orders` por `(shopId, status)`, `reviews` por `(shopId, rating)`, `products` por `(shopId, isAvailable)`.

### Prompt para diagrama Firestore (LucidChart)

```
Create a NoSQL Firestore database diagram for "PastelHub" — a multi-tenant pastry shop
marketplace. Use a document-collection style diagram with crow's foot notation for
references between documents. Color-code by domain.

COLLECTIONS & DOCUMENTS:

1. users/{uid}
   - uid: string (Firebase Auth UID, PK)
   - name, lastName: string
   - email: string (unique)
   - phone: string
   - profilePicture: string (Storage URL)
   - roles: array<string> ['admin','moderator','owner','customer']
   - isActive: boolean
   - createdAt, updatedAt: timestamp

2. customers/{uid}  ← same uid as users
   - uid: string (ref → users)
   - defaultAddressId: string (nullable)
   - createdAt: timestamp
   [SUBCOLLECTION] addresses/{addressId}
     - street, city, district: string
     - reference: string
     - isDefault: boolean

3. pastryShops/{shopId}
   - shopId: string (auto-generated)
   - ownerId: string (ref → users)
   - shopName, description: string
   - logoUrl, bannerUrl: string (Storage URL)
   - address, city, phone, email: string
   - rating: number (0.0–5.0)
   - isActive: boolean
   - approvalStatus: enum(pending|approved|rejected|suspended)
   - createdAt, updatedAt: timestamp
   [SUBCOLLECTION] schedules/{scheduleId}
     - dayOfWeek: enum(Mon..Sun)
     - openTime, closeTime: string
     - isClosed: boolean
   [SUBCOLLECTION] categories/{categoryId}
     - categoryName, description: string
     - imageUrl: string
     - isActive: boolean

4. products/{productId}
   - productId: string
   - shopId: string (ref → pastryShops)
   - categoryId: string (ref → pastryShops/categories)
   - productName, description: string
   - price: number
   - stock: number
   - imageUrl: string (Storage URL)
   - isAvailable: boolean
   - createdAt, updatedAt: timestamp
   [SUBCOLLECTION] variants/{variantId}
     - variantType: string (size|flavor|inscription)
     - variantValue: string
     - extraPrice: number

5. orders/{orderId}
   - orderId: string
   - customerId: string (ref → customers)
   - shopId: string (ref → pastryShops)
   - addressId: string (ref → customers/addresses)
   - status: enum(pending|confirmed|preparing|on_the_way|delivered|cancelled)
   - deliveryType: enum(delivery|pickup)
   - scheduledAt: timestamp
   - subtotal, deliveryFee, total: number
   - notes: string
   - createdAt, updatedAt: timestamp
   [SUBCOLLECTION] items/{itemId}
     - productId: string (ref → products)
     - quantity: number
     - unitPrice, subtotal: number
     - customizationNotes: string

6. payments/{paymentId}
   - paymentId: string
   - orderId: string (ref → orders, unique)
   - paymentMethod: enum(card|cash|yape|plin)
   - paymentStatus: enum(pending|paid|refunded|failed)
   - amount: number
   - transactionRef: string
   - paidAt: timestamp

7. reviews/{reviewId}
   - reviewId: string
   - customerId: string (ref → customers)
   - shopId: string (ref → pastryShops)
   - orderId: string (ref → orders, unique)
   - rating: number (1–5)
   - comment: string
   - ownerReply: string (nullable)
   - repliedAt: timestamp (nullable)
   - status: enum(pending|approved|rejected)
   - createdAt: timestamp

8. notifications/{notificationId}
   - notificationId: string
   - userId: string (ref → users)
   - type: string (order_update|new_review|shop_approved|report_resolved)
   - message: string
   - isRead: boolean
   - createdAt: timestamp

9. chatSessions/{sessionId}
   - sessionId: string
   - userId: string (ref → users, nullable for anonymous)
   - shopId: string (ref → pastryShops, nullable)
   - messages: array<{role: string, content: string, timestamp: timestamp}>
   - createdAt, updatedAt: timestamp

10. reports/{reportId}
    - reportId: string
    - reportedBy: string (ref → users)
    - targetType: enum(review|shop|product)
    - targetId: string
    - reason: string
    - status: enum(open|resolved|dismissed)
    - assignedTo: string (ref → users/moderators, nullable)
    - createdAt, resolvedAt: timestamp

REFERENCES (non-relational, document IDs stored as strings):
- users → customers (1:1, uid shared)
- users → pastryShops (1:N via ownerId)
- users → notifications (1:N via userId)
- pastryShops → products (1:N via shopId)
- customers → orders (1:N via customerId)
- pastryShops → orders (1:N via shopId)
- orders → payments (1:1 via orderId)
- orders → reviews (1:1 via orderId)
- customers → reviews (1:N via customerId)
- users → reports (1:N via reportedBy and assignedTo)

COLOR CODING:
- Auth & Users (users, customers): Blue
- Shop Management (pastryShops + subcollections): Coral/Orange
- Catalog (products + variants): Green
- Orders & Payments (orders, payments): Amber
- Reviews & Reports (reviews, reports): Pink/Rose
- Engagement (notifications, chatSessions): Purple

STYLE:
- Show collections as containers, documents as cards
- Subcollections nested inside parent collection cards
- Show field types and reference arrows between documents
- Crow's foot on reference arrows (one-to-many, one-to-one)
- Highlight composite indexes: (shopId + status), (shopId + rating), (shopId + isAvailable)
- Add note: "No foreign keys — references stored as string document IDs"
```

---

## Autenticación

PastelHub usa **Firebase Authentication** como proveedor de identidad, combinado con **Custom Claims** para el control de acceso basado en roles.

### Flujo de autenticación

```
React App (navegador)
      │
      │  signInWithEmailAndPassword() / createUser()
      ▼
Firebase Auth
      │
      │  ID Token (JWT firmado por Google)
      ▼
Express API
      │
      ├── admin.auth().verifyIdToken(idToken)
      └── Leer custom claims → { roles: ['owner'] }
            │
            └── Role Guard middleware
                  ├── requireAdmin()
                  ├── requireModerator()
                  ├── requireOwner()
                  └── requireCustomer()
```

### Custom Claims por rol

```javascript
// Asignado por admin via Firebase Admin SDK
await admin.auth().setCustomUserClaims(uid, {
  roles: ['owner']           // o ['admin'], ['moderator'], ['customer', 'owner']
});
```

### Métodos de autenticación habilitados

| Método | Descripción |
|---|---|
| Email + Contraseña | Registro y login estándar |
| Google Sign-In | OAuth con cuenta Google |
| (Extensible) | Facebook, Apple, Phone según necesidad |

### Middleware de roles (Express)

```javascript
// middlewares/auth.js
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  const decoded = await admin.auth().verifyIdToken(token);
  req.user = decoded;   // incluye uid + custom claims
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  const userRoles = req.user.roles || [];
  if (roles.some(r => userRoles.includes(r))) return next();
  res.status(403).json({ error: 'Acceso denegado' });
};

// Uso en rutas
router.patch('/:id/status', verifyToken, requireRole('admin', 'moderator'), updateShopStatus);
```

---

## Instalación

### Requisitos previos

- Node.js >= 18
- npm o yarn
- Cuenta Firebase con proyecto creado
- Firebase CLI (`npm install -g firebase-tools`)

### Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/pastelhub.git
cd pastelhub
```

### Instalar dependencias

```bash
# Backend
cd server
npm install

# Frontend React
cd ../client
npm install
```

### Configurar Firebase

```bash
# Login y seleccionar proyecto
firebase login
firebase use --add   # seleccionar tu proyecto

# Inicializar Firestore, Storage, Hosting
firebase init
```

### Ejecutar en desarrollo

```bash
# Backend (puerto 3001)
cd server
npm run dev

# Frontend React (puerto 5173)
cd client
npm run dev
```

---

## Variables de entorno

### `server/.env`

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID="pastelhub-prod"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@pastelhub.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."

# Pasarela de pagos
PAYMENT_GATEWAY_KEY=""
PAYMENT_GATEWAY_SECRET=""

# Dialogflow / Chatbot
DIALOGFLOW_PROJECT_ID=""
DIALOGFLOW_CREDENTIALS=""

# Servidor
PORT=3001
NODE_ENV=development
```

### `client/.env`

Configura las claves del proyecto Firebase para el SDK de cliente web:

```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="pastelhub-prod.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="pastelhub-prod"
VITE_FIREBASE_STORAGE_BUCKET="pastelhub-prod.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="1:..."
```

### `client/src/config/firebase.js`

```javascript
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
```

### `client/src/config/constants.js`

```javascript
// Desarrollo local
export const API_BASE_URL = 'http://localhost:3001/api';

// Producción
// export const API_BASE_URL = 'https://tu-api.run.app/api';
```

---

## Scripts disponibles

### Backend (`/server`)

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor en modo desarrollo con hot reload |
| `npm run start` | Servidor en producción |
| `npm run start:load-test` | Servidor con ventanas de rate limit de 5s y bypass de Firebase Auth |
| `npm run test` | Tests unitarios (Jest, 338 tests) + genera `test-report.html` |
| `npm run test:coverage` | Tests unitarios con reporte de cobertura HTML |
| `npm run load-test` | Prueba de carga: 100 VUs, bypass auth |
| `npm run load-test:50` | Prueba de carga: 50 VUs, bypass auth |
| `npm run load-test:real-auth` | Prueba de carga: 100 VUs, auth Firebase real (automático) |
| `npm run load-test:k6` | k6: 1000 VUs completo |
| `npm run load-test:k6:1000` | k6: 1000 VUs completo |
| `npm run load-test:k6:5000` | k6: 5000 VUs completo |
| `npm run load-test:k6:10000` | k6: 10000 VUs completo |
| `npm run load-test:k6:50000` | k6: 50000 VUs completo |
| `npm run load-test:k6:quick` | k6: 100 VUs rápido (~45s) |
| `npm run test:rate-limit` | Test de rate limiting (automático, genera reporte HTML) |

### Frontend (`/client`) — React

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite, puerto 5173) |
| `npm run build` | Build de producción |
| `npm install` | Instalar dependencias |
| `firebase deploy --only hosting` | Desplegar a Firebase Hosting |

---

## Endpoints principales

### Auth
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `POST` | `/api/auth/sync` | Sincronizar usuario tras login (auto-crea customer) | Token |
| `GET` | `/api/auth/me` | Perfil del usuario autenticado | Token |
| `POST` | `/api/auth/assign-role` | Asignar rol a usuario | Admin |

### Pastelerías
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `GET` | `/api/shops` | Listar pastelerías | Público |
| `GET` | `/api/shops/:id` | Detalle de una pastelería | Público |
| `GET` | `/api/shops/owner/:ownerId` | Pastelerías de un dueño | Público |
| `POST` | `/api/shops` | Crear pastelería | Owner / Admin |
| `PUT` | `/api/shops/:id` | Actualizar pastelería | Owner / Admin |
| `DELETE` | `/api/shops/:id` | Eliminar pastelería | Owner / Admin |

### Promociones
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `GET` | `/api/promotions/shop/:shopId` | Promociones activas | Público |
| `POST` | `/api/promotions` | Crear promoción (descuento/combo/2x1) | Owner / Admin |
| `PUT` | `/api/promotions/:id` | Editar promoción | Owner / Admin |
| `PATCH` | `/api/promotions/:id/toggle` | Activar/desactivar | Owner / Admin |
| `DELETE` | `/api/promotions/:id` | Eliminar promoción | Owner / Admin |

### Pedidos
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `POST` | `/api/orders` | Crear pedido | Customer |
| `GET` | `/api/orders/shop/:shopId/summary` | Estadísticas de ventas (gráficas) | Owner / Admin |
| `GET` | `/api/orders/:id` | Detalle de pedido | Propio / Owner / Admin |
| `PATCH` | `/api/orders/:id/status` | Actualizar estado | Owner |
| `PATCH` | `/api/orders/:id/cancel` | Cancelar orden pendiente | Customer |

### Reviews
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `GET` | `/api/reviews/shop/:shopId` | Reseñas aprobadas de una pastelería | Público |
| `POST` | `/api/reviews` | Crear reseña (auto-aprobada) | Customer |
| `PATCH` | `/api/reviews/:id/reply` | Responder reseña | Owner |
| `PATCH` | `/api/reviews/:id/status` | Aprobar / rechazar reseña | Moderator |

### Reportes
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `GET` | `/api/reports` | Listar reportes | Moderator / Admin |
| `POST` | `/api/reports` | Crear reporte | Autenticado |
| `PATCH` | `/api/reports/:id/status` | Resolver / desestimar | Moderator |
| `PATCH` | `/api/reports/:id/assign` | Asignar moderador | Moderator |

### Notificaciones
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `GET` | `/api/notifications/user/:userId/unread/count` | Conteo de no leídas (badge) | Propio / Admin |
| `GET` | `/api/notifications/user/:userId` | Listar notificaciones | Propio / Admin |
| `PATCH` | `/api/notifications/:id/read` | Marcar como leída | Propio / Admin |
| `PATCH` | `/api/notifications/user/:userId/read-all` | Marcar todas leídas | Propio / Admin |

---

## Flujos clave

### Cliente realiza un pedido
1. Explora pastelerías en el home o buscador
2. Entra al perfil de una pastelería (ve rating, reseñas, promociones activas)
3. Agrega productos al carrito (con variantes opcionales)
4. Completa el checkout: dirección, método de pago
5. El pedido queda en estado `pending`
6. El dueño confirma → `confirmed` → `preparing` → `on_the_way` → `delivered`
7. El cliente puede cancelar si aún está `pending`
8. El cliente puede dejar una reseña tras la entrega (auto-aprobada)

### Registro de pastelería
1. El dueño se registra y solicita el rol `owner`
2. Crea su pastelería (queda en `pending` approval)
3. El admin o moderador revisa y aprueba o rechaza
4. Si aprobada, el dueño puede publicar productos y recibir pedidos

### Moderación de reseña
1. Cliente envía reseña → estado `approved` (auto-aprobada)
2. Moderador puede cambiar estado a `rejected` si es necesario
3. El dueño puede responder a la reseña

### Promociones (dueño)
1. Dueño accede al panel → pestaña Promociones
2. Crea promoción: elige tipo (descuento %, monto fijo, combo, 2x1)
3. Configura fechas de vigencia y productos aplicables
4. La promoción se muestra automáticamente en el perfil público de la pastelería
5. Puede activar/desactivar sin eliminar

### Dashboard de ventas (dueño)
1. Dueño accede al panel → pestaña Resumen
2. Ve tarjetas con ingresos: totales, hoy, esta semana, este mes
3. Gráfica de barras de ventas diarias (últimos 90 días)
4. Gráfica de ingresos mensuales
5. Órdenes por estado con barras de progreso
6. Top 10 productos más vendidos
7. Ingresos por método de pago

---

## Próximamente

### 🤖 Chatbot con IA (Gemini API)

Chatbot conversacional con inteligencia artificial que permite a clientes y dueños resolver dudas sin salir de la plataforma.

#### Endpoints planeados

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/chat/sessions` | Crear nueva sesión de chat |
| `GET` | `/api/chat/sessions` | Listar sesiones del usuario |
| `GET` | `/api/chat/sessions/:id` | Obtener sesión con mensajes |
| `POST` | `/api/chat/sessions/:id/messages` | Enviar mensaje y recibir respuesta IA |
| `DELETE` | `/api/chat/sessions/:id` | Eliminar sesión |

#### Stack planeado

| Capa | Tecnología |
|------|-----------|
| Backend | Router Express en `server/src/routes/chat.js` |
| IA | Google Gemini API (`@google/generative-ai`) — 60 req/min gratis |
| Contexto | Firestore: datos del usuario, pedidos activos, productos |
| Frontend | Burbuja flotante + panel lateral en todas las páginas |
| Almacenamiento | Colección `chatSessions/{id}/messages` en Firestore |

#### Variables de entorno

```env
# server/.env
GEMINI_API_KEY="api_key_de_Google_AI_Studio"
```

> La API key se obtiene gratis en [Google AI Studio](https://makersuite.google.com/app/apikey). Sin ella, el chatbot funcionará con respuestas predefinidas como fallback.

---

## Estructura de carpetas

```
pastelhub/
├── client/                        # Frontend React (Vite)
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.js       # URLs, keys
│   │   │   └── firebase.js        # Inicialización Firebase SDK
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # onAuthStateChanged + roles
│   │   ├── services/
│   │   │   ├── apiService.js      # Base fetch + interceptor 401 con refresh
│   │   │   ├── authService.js     # Firebase Auth (login, register, reset password)
│   │   │   ├── usersService.js
│   │   │   ├── shopsService.js
│   │   │   ├── productsService.js
│   │   │   ├── ordersService.js
│   │   │   ├── reviewsService.js
│   │   │   ├── paymentsService.js
│   │   │   ├── notificationsService.js
│   │   │   ├── reportsService.js
│   │   │   ├── customersService.js
│   │   │   └── promotionsService.js
│   │   ├── pages/
│   │   │   ├── public/            # Login, Register, NotFound, ShopsList, ShopDetail
│   │   │   ├── customer/          # Cart, Checkout, MyOrders, OrderDetail, Profile, Notifications
│   │   │   ├── owner/             # OwnerDashboard (info, productos, órdenes, promociones, resumen)
│   │   │   └── admin/             # Dashboard, Users, Shops, Products, Orders, Reviews, Reports, Notifications, Payments, Customers
│   │   ├── components/            # Navbar, ProtectedRoute, AuthLayout, ErrorBoundary
│   │   ├── styles/
│   │   │   └── theme.js           # Colores, fuentes, estilos reutilizables (inline, sin Tailwind/MUI)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   │   ├── favicon.png
│   │   └── manifest.json
│   ├── index.html
│   └── package.json
│
├── server/                        # Backend Express
│   ├── src/
│   │   ├── app.js                 # Express app (routes, cors, rate limiters)
│   │   ├── server.js              # Entry point (app.listen)
│   │   ├── routes/                # 14 routers: auth, users, shops, products, orders,
│   │   │                          #   reviews, payments, notifications, reports, customers,
│   │   │                          #   promotions, chat, invoices, support, backups
│   │   ├── middlewares/
│   │   │   └── auth.js            # verifyToken, requireAdmin, requireOwner, requireModerator,
│   │   │                          #   requireCustomer, requireOwnerOrAdmin
│   │   ├── config/
│   │   │   └── firebase.js        # Inicialización Admin SDK
│   │   ├── utils/
│   │   │   ├── logger.js          # Winston: logs estructurados (JSON/coloreado)
│   │   │   ├── paginate.js        # Paginación con count() de Firestore
│   │   │   ├── mappers.js         # Mapeo camelCase ↔ snake_case
│   │   │   ├── autoNotify.js      # Notificaciones automáticas
│   │   │   ├── auditLog.js        # Auditoría de acciones
│   │   │   ├── backupService.js   # Backup Firestore → GCS
│   │   │   └── chat.js            # Integración Gemini AI
│   │   └── validators/            # Schemas Zod por recurso
│   ├── tests/
│   │   ├── setup.js               # Mock de firebase-admin + helpers
│   │   ├── unit/                  # 13 archivos, 338 tests
│   │   │   ├── health.test.js
│   │   │   ├── middleware.test.js
│   │   │   ├── auth.test.js
│   │   │   ├── users.test.js
│   │   │   ├── shops.test.js
│   │   │   ├── products.test.js
│   │   │   ├── orders.test.js
│   │   │   ├── payments.test.js
│   │   │   ├── reviews.test.js
│   │   │   ├── notifications.test.js
│   │   │   ├── reports.test.js
│   │   │   └── customers.test.js
│   │   ├── load/
│   │   │   └── load-test.js       # k6: 100-50000 VUs, reporte HTML
│   │   └── rate-limit/
│   │       └── rate-limit-test.js
│   ├── backup.js                  # Script de backup Firestore → JSON
│   └── package.json
│
├── assets/
│   ├── diagramaPastelHUB.png
│
├── test-rate-limit.js             # Script de prueba de rate limiting
├── AGENTS.md                      # Memoria para asistentes IA
├── API_ENDPOINTS.md               # Documentación completa de endpoints
├── CLOUD_SETUP.md                 # Guía de despliegue en la nube
├── RATE_LIMITING.md               # Documentación de rate limiting
├── README.md
└── STATUS.md
```

---
