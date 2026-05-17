# ☁️ ENTORNO CLOUD - CONFIGURACIÓN FIREBASE

## Descripción General

PastelHub utiliza **Firebase (Google Cloud Platform)** como infraestructura cloud para:

- 🔐 **Authentication:** Autenticación de usuarios con email/password y Google Sign-In
- 🗄️ **Firestore:** Base de datos NoSQL en tiempo real
- 📊 **Datos en la nube:** Almacenamiento centralizado y sincronizado
- 🔑 **Custom Claims:** Control de roles y permisos basados en Firebase Auth

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│              GOOGLE CLOUD PLATFORM (GCP)                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌───────────────┐      ┌──────────────┐                │
│  │   Firebase    │      │  Firestore   │                │
│  │   Auth        │◄────►│  Database    │                │
│  │               │      │              │                │
│  │ • Email/Pass  │      │ • Users      │                │
│  │ • Google      │      │ • Shops      │                │
│  │ • Custom      │      │ • Products   │                │
│  │   Claims      │      │ • Orders     │                │
│  │ • JWT Tokens  │      │ • Notifs     │                │
│  └───────────────┘      │ • Reports    │                │
│                          └──────────────┘                │
│                                                           │
└─────────────────────────────────────────────────────────┘
         ▲                           ▲
         │                           │
    ┌────┴──────────┐      ┌────────┴─────┐
    │   BACKEND     │      │   FRONTEND    │
    │  (Express.js) │      │  (React+Vite) │
    │   Port 3001   │      │  Port 5173    │
    └───────────────┘      └───────────────┘
```

---

## Colecciones de Firestore

### 1. **users**
```
users/
├── {uid}
│   ├── email: string
│   ├── full_name: string
│   ├── phone: string
│   ├── roles: array
│   ├── addresses: array
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

### 2. **pastryShops**
```
pastryShops/
├── {shopId}
│   ├── owner_id: string (ref a users)
│   ├── name: string
│   ├── description: string
│   ├── logo_url: string
│   ├── rating: number
│   ├── status: string (pending|approved|rejected|suspended)
│   ├── schedules: array
│   ├── categories: array
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

### 3. **products**
```
products/
├── {productId}
│   ├── shop_id: string (ref a pastryShops)
│   ├── name: string
│   ├── description: string
│   ├── price: number
│   ├── stock: number
│   ├── image_url: string
│   ├── is_available: boolean
│   ├── variants: array
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

### 4. **orders**
```
orders/
├── {orderId}
│   ├── customer: object
│   ├── shop: object
│   ├── items: array
│   ├── totals: object
│   ├── payment: object
│   ├── status: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

### 5. **notifications**
```
notifications/
├── {notifId}
│   ├── userId: string (ref a users)
│   ├── type: string
│   ├── message: string
│   ├── isRead: boolean
│   └── createdAt: timestamp
```

### 6. **reports**
```
reports/
├── {reportId}
│   ├── reportedBy: string (ref a users)
│   ├── targetType: string
│   ├── targetId: string
│   ├── reason: string
│   ├── status: string
│   ├── assignedTo: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

### 7. **reviews**
```
reviews/
├── {reviewId}
│   ├── customerId: string (ref a users)
│   ├── shopId: string (ref a pastryShops)
│   ├── orderId: string (ref a orders)
│   ├── rating: number (1-5)
│   ├── comment: string
│   ├── status: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

### 8. **payments**
```
payments/
├── {paymentId}
│   ├── orderId: string (ref a orders)
│   ├── paymentMethod: string
│   ├── paymentStatus: string
│   ├── amount: number
│   ├── transactionRef: string
│   ├── paidAt: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

### 9. **customers**
```
customers/
├── {uid}
│   ├── defaultAddressId: string
│   ├── createdAt: timestamp
│   └── addresses/ (subcollection)
│       └── {addressId}
│           ├── street: string
│           ├── city: string
│           ├── is_default: boolean
```

---

## Configuración Firebase

### Backend: `server/src/config/firebase.js`

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
```

**Archivo requerido:** `server/serviceAccountKey.json`

Obtener desde Firebase Console:
1. Ir a Project Settings > Service Accounts
2. Generar nueva clave privada (JSON)
3. Guardar en `server/serviceAccountKey.json`

### Frontend: `client/src/config/firebase.js`

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
```

---

## Variables de Entorno

### Backend: `server/.env`

```env
PORT=3001
NODE_ENV=development

# Nota: serviceAccountKey.json se carga desde archivo, no necesita env
```

### Frontend: `client/.env`

```env
VITE_API_URL=http://localhost:3001/api
VITE_FIREBASE_API_KEY=AIzaSyD...
VITE_FIREBASE_AUTH_DOMAIN=pastelhub-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pastelhub-xxxx
VITE_FIREBASE_STORAGE_BUCKET=pastelhub-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef1234567890
```

**Obtener valores desde Firebase Console > Project Settings**

---

## Índices de Firestore Configurados

Para optimizar las queries, se han deployado los siguientes índices:

```bash
firebase deploy --only firestore:indexes
```

### Índices Principales

```yaml
# users collection
- fields:
    - name: createdAt
      direction: DESCENDING

# pastryShops collection
- fields:
    - name: status
      direction: ASCENDING
    - name: createdAt
      direction: DESCENDING

# products collection
- fields:
    - name: shop_id
      direction: ASCENDING
    - name: createdAt
      direction: DESCENDING

# orders collection
- fields:
    - name: status
      direction: ASCENDING
    - name: createdAt
      direction: DESCENDING
    
- fields:
    - name: shop.shop_id
      direction: ASCENDING
    - name: createdAt
      direction: DESCENDING

# notifications collection
- fields:
    - name: userId
      direction: ASCENDING
    - name: isRead
      direction: ASCENDING
    - name: createdAt
      direction: DESCENDING

# reports collection
- fields:
    - name: status
      direction: ASCENDING
    - name: createdAt
      direction: DESCENDING
```

---

## Seguridad: Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Solo admin puede leer/escribir
    match /users/{userId} {
      allow read, write: if request.auth.token.roles.hasAny(['admin']);
    }
    
    match /pastryShops/{shopId} {
      allow read, write: if request.auth.token.roles.hasAny(['admin']);
    }
    
    match /products/{productId} {
      allow read, write: if request.auth.token.roles.hasAny(['admin']);
    }
    
    match /orders/{orderId} {
      allow read, write: if request.auth.token.roles.hasAny(['admin']);
    }
    
    match /notifications/{notifId} {
      allow read, write: if request.auth.token.roles.hasAny(['admin']);
    }
    
    match /reports/{reportId} {
      allow read, write: if request.auth.token.roles.hasAny(['admin']);
    }
  }
}
```

---

## Custom Claims (Roles)

Firebase Auth soporta Custom Claims para controlar el acceso:

```javascript
// Backend: Asignar roles
const { admin } = require('../config/firebase');

await admin.auth().setCustomUserClaims(uid, {
  roles: ['customer', 'shop_owner']
});

// Frontend: Acceder a los roles
const idTokenResult = await auth.currentUser.getIdTokenResult();
const roles = idTokenResult.claims.roles;
```

**Roles disponibles:**
- `customer` - Cliente de PastelHub
- `shop_owner` - Dueño de pastelería
- `admin` - Administrador del sistema

---

## Setup Local

### Paso 1: Crear proyecto Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Crear nuevo proyecto: "PastelHub"
3. Habilitar Firestore Database
4. Habilitar Authentication (Email/Password + Google)

### Paso 2: Descargar credenciales

1. Project Settings > Service Accounts
2. Generar nueva clave privada (JSON)
3. Guardar en `server/serviceAccountKey.json`

### Paso 3: Configurar variables de entorno

Backend (`server/.env`):
```env
PORT=3001
NODE_ENV=development
```

Frontend (`client/.env`):
```env
VITE_API_URL=http://localhost:3001/api
VITE_FIREBASE_API_KEY=<copiar del Firebase Console>
VITE_FIREBASE_AUTH_DOMAIN=<proyecto>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<proyecto>
VITE_FIREBASE_STORAGE_BUCKET=<proyecto>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<número>
VITE_FIREBASE_APP_ID=<id>
```

### Paso 4: Deploy de índices

```bash
firebase login
firebase deploy --only firestore:indexes
```

### Paso 5: Iniciar aplicación

```bash
# Terminal 1: Backend
cd server
npm install
npm run dev

# Terminal 2: Frontend
cd client
npm install
npm run dev
```

---

## Monitoreo

### Firebase Console

1. Firestore Database - Ver colecciones y documentos en tiempo real
2. Authentication - Gestionar usuarios
3. Rules - Ver y actualizar reglas de seguridad
4. Indexes - Ver estado de índices

### Comandos Firebase CLI

```bash
# Listar proyectos
firebase projects:list

# Usar un proyecto específico
firebase use pastelhub-xxxx

# Ver reglas actuales
firebase firestore:rules:list

# Deploy de reglas
firebase deploy --only firestore:rules

# Ver índices
firebase firestore:indexes:list

# Backup de datos
firebase firestore:export gs://pastelhub-backup/backup-$(date +%s)
```

---

## Costos Estimados (GCP)

Para un MVP con 100 usuarios activos:

- **Firestore:** ~$0-5/mes (read/write/delete gratis hasta 100k ops/día)
- **Firebase Auth:** Gratis hasta 4000 MAU
- **Storage:** ~$0-1/mes (pequeños archivos)

**Total:** ~$0-10/mes en desarrollo

---

## Checklist de Setup Cloud ✅

- [x] Proyecto Firebase creado en GCP
- [x] Firestore Database habilitado
- [x] Authentication configurada (Email + Google)
- [x] Colecciones diseñadas y documentadas
- [x] Índices deployados
- [x] Security Rules configuradas
- [x] serviceAccountKey.json descargado
- [x] Variables de entorno configuradas
- [x] Backend conectado a Firebase
- [x] Frontend conectado a Firebase
- [x] Custom Claims implementados
- [x] Rate limiting en backend

---

**Documento generado:** 17/05/2026  
**Estado:** ✅ Entorno Cloud Preparado y Documentado
