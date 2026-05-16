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
- ⭐ **Reseñas verificadas** — solo clientes con pedido completado pueden reseñar
- 📊 **Analytics por pastelería** — ventas, productos top, órdenes por categoría
- 🔔 **Notificaciones en tiempo real** — alertas push/in-app con Firebase Cloud Messaging
- ✅ **Flujo de aprobación** — las nuevas pastelerías requieren validación antes de publicarse
- 🤖 **Chatbot de asistencia** — bot integrado que ayuda a clientes con pedidos, productos y FAQ
- 🛡️ **Moderación de contenido** — revisión de reseñas, reportes y gestión de disputas

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
| **Frontend web** | React (JavaScript/TypeScript) |
| **UI web** | React + Tailwind CSS / Material UI |
| **Backend** | Node.js + Express.js |
| **Base de datos** | Firebase Firestore (NoSQL) |
| **Autenticación** | Firebase Authentication + Custom Claims (roles) |
| **Almacenamiento de archivos** | Firebase Storage (imágenes de productos y banners) |
| **Notificaciones** | Firebase Cloud Messaging (FCM) |
| **Chatbot** | Dialogflow CX / Vertex AI + Firebase Functions |
| **Pagos** | Integración con pasarela de pagos (configurable) |
| **Despliegue** | Firebase Hosting (frontend React) + Cloud Run / Railway (backend) |

---

## Arquitectura del proyecto

```
React App (navegador)
        │
        │  HTTP / REST + JSON
        ▼
Express API (Node.js)
        │
        ├── Firebase Auth Middleware (verifica ID Token)
        ├── Role Guard (custom claims: admin / moderator / owner / customer)
        │
        ├── /api/auth
        ├── /api/shops
        ├── /api/products
        ├── /api/orders
        ├── /api/payments
        ├── /api/reviews
        └── /api/chat
        │
        ▼
Firebase Firestore (NoSQL)
Firebase Storage
Firebase Cloud Messaging
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
| `reviews` | Reseñas de clientes |
| `notifications` | Notificaciones del sistema por usuario |
| `chatSessions` | Historial de conversaciones del chatbot |
| `reports` | Reportes de contenido inapropiado gestionados por moderadores |

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
  ├── status (pending | approved | rejected)   ← gestionado por moderadores
  └── createdAt

notifications/{notificationId}
  ├── userId, type, message
  ├── isRead, createdAt

chatSessions/{sessionId}
  ├── userId (nullable para anónimos), shopId (nullable)
  ├── messages: [{role, content, timestamp}]
  └── createdAt, updatedAt

reports/{reportId}
  ├── reportedBy (userId), targetType (review|shop|product)
  ├── targetId, reason, status (open|resolved|dismissed)
  ├── assignedTo (moderatorId, nullable)
  └── createdAt, resolvedAt
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
| `npm run seed` | Poblar Firestore con datos de prueba |

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
| `POST` | `/api/auth/register` | Registrar nuevo usuario | Público |
| `POST` | `/api/auth/assign-role` | Asignar rol a usuario | Admin |
| `GET` | `/api/auth/me` | Perfil del usuario autenticado | Autenticado |

### Pastelerías
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `GET` | `/api/shops` | Listar pastelerías activas | Público |
| `GET` | `/api/shops/:id` | Detalle de una pastelería | Público |
| `POST` | `/api/shops` | Crear pastelería | Owner |
| `PUT` | `/api/shops/:id` | Actualizar pastelería | Owner |
| `PATCH` | `/api/shops/:id/status` | Cambiar estado de aprobación | Admin / Moderator |

### Productos
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `GET` | `/api/shops/:shopId/products` | Productos de una pastelería | Público |
| `POST` | `/api/shops/:shopId/products` | Crear producto | Owner |
| `PUT` | `/api/products/:id` | Actualizar producto | Owner |
| `DELETE` | `/api/products/:id` | Eliminar producto | Owner |

### Pedidos
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `POST` | `/api/orders` | Crear pedido | Customer |
| `GET` | `/api/orders/:id` | Detalle de pedido | Customer / Owner |
| `GET` | `/api/orders/my` | Mis pedidos | Customer |
| `PATCH` | `/api/orders/:id/status` | Actualizar estado | Owner |

### Reviews
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `POST` | `/api/orders/:orderId/review` | Crear reseña | Customer |
| `POST` | `/api/reviews/:id/reply` | Responder reseña | Owner |
| `PATCH` | `/api/reviews/:id/status` | Aprobar / rechazar reseña | Moderator |

### Moderación
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `GET` | `/api/reports` | Listar reportes abiertos | Moderator / Admin |
| `POST` | `/api/reports` | Crear reporte | Customer / Owner |
| `PATCH` | `/api/reports/:id` | Resolver / desestimar reporte | Moderator |

### Chatbot
| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| `POST` | `/api/chat/message` | Enviar mensaje al bot | Público / Customer |
| `GET` | `/api/chat/session/:id` | Historial de sesión | Customer |

---

## Flujos clave

### Cliente realiza un pedido
1. Explora pastelerías en el home o buscador
2. Entra al perfil de una pastelería
3. Agrega productos al carrito (con variantes opcionales)
4. Puede consultar al chatbot sobre productos o disponibilidad
5. Completa el checkout: dirección, fecha/hora, método de pago
6. El pedido queda en estado `pending`
7. El dueño confirma → `confirmed` → `preparing` → `on_the_way` → `delivered`
8. El cliente puede dejar una reseña tras la entrega
9. La reseña pasa por revisión del moderador antes de publicarse

### Registro de pastelería
1. El dueño se registra y solicita el rol `owner`
2. Crea su pastelería (queda en `pending` approval)
3. El admin o moderador revisa y aprueba o rechaza
4. Si aprobada, el dueño puede publicar productos y recibir pedidos

### Moderación de reseña
1. Cliente envía reseña → estado `pending`
2. Moderador la revisa en el panel de moderación
3. Si aprueba → visible en el perfil de la pastelería
4. Si rechaza → notificación al cliente con motivo

### Chatbot de asistencia
1. Cliente abre el chat flotante en cualquier pantalla
2. El bot responde preguntas sobre: horarios, productos, estado de pedidos, pagos
3. Si el bot no puede resolver → deriva al dueño o soporte
4. El historial queda guardado en `chatSessions` para análisis

---

## Qué más podrías agregar

| Funcionalidad | Descripción |
|---|---|
| 🤖 **Chatbot** | Ya incluido — Dialogflow CX con integración a Firestore para consultas de pedidos en tiempo real |
| 🛡️ **Moderador** | Ya incluido — rol con acceso a panel de reportes y moderación de reseñas |
| 📊 **Dashboard analytics** | Ventas por período, productos más vendidos, tasa de conversión por pastelería |
| 🎁 **Cupones y descuentos** | Colección `coupons` con código, porcentaje, límite de uso y expiración |
| 🔍 **Búsqueda avanzada** | Integración con Algolia o Typesense para búsqueda de productos por nombre, categoría o ubicación |
| 📍 **Geolocalización** | Mostrar pastelerías cercanas al cliente usando GeoFirestore |
| 🌐 **Internacionalización** | Soporte multi-idioma (react-i18next) |
| 📱 **PWA** | React como Progressive Web App con soporte offline básico (Vite PWA plugin) |
| 🔄 **Suscripciones** | Pedidos recurrentes (ej. torta cada mes) con Firebase Scheduled Functions |

---

## Estructura de carpetas

```
pastelhub/
├── client/                        # Frontend React
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.js       # URLs, keys
│   │   │   └── firebase.js        # Inicialización Firebase SDK
│   │   ├── models/                # Tipos/interfaces: Shop, Product, Order...
│   │   ├── services/
│   │   │   ├── apiService.js      # Llamadas al backend Express
│   │   │   ├── authService.js     # Firebase Auth
│   │   │   ├── storageService.js  # Firebase Storage
│   │   │   └── chatService.js     # Chatbot API
│   │   ├── store/                 # Estado global (auth, carrito) — Zustand / Redux
│   │   ├── pages/
│   │   │   ├── customer/          # Vistas del cliente
│   │   │   ├── owner/             # Vistas del dueño
│   │   │   ├── moderator/         # Vistas del moderador
│   │   │   └── admin/             # Vistas del admin
│   │   ├── components/            # Componentes reutilizables
│   │   ├── hooks/                 # Custom hooks
│   │   └── main.jsx
│   ├── public/                    # Assets estáticos
│   ├── index.html
│   └── package.json
│
├── server/                        # Backend Express
│   ├── src/
│   │   ├── routes/                # Definición de rutas
│   │   ├── controllers/           # Lógica de negocio
│   │   ├── middlewares/
│   │   │   ├── auth.js            # Verificación Firebase ID Token
│   │   │   └── roles.js           # Guard por custom claims
│   │   ├── services/
│   │   │   ├── firebase.js        # Inicialización Admin SDK
│   │   │   ├── storage.js         # Firebase Storage
│   │   │   ├── fcm.js             # Notificaciones push
│   │   │   └── chat.js            # Integración Dialogflow
│   │   └── utils/
│   └── .env.example
│
├── firebase.json                  # Configuración Firebase Hosting + Rules
├── firestore.rules                # Reglas de seguridad Firestore
├── firestore.indexes.json         # Índices compuestos
├── storage.rules                  # Reglas Firebase Storage
│
└── docs/                          # Documentación
    ├── erd-firestore.png
    └── schema.md
```

---
