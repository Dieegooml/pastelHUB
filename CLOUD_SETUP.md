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

---

## 🚀 Despliegue a Producción (Firebase Hosting + Cloud Run)

### Arquitectura

```
Firebase Hosting                    Cloud Run
┌─────────────────────┐             ┌──────────────────┐
│  pastelhub.web.app  │  /api/**    │  pastelhub-server │
│                     │ ──────────► │  (Express + API)  │
│  client/dist/       │             │                   │
│  (React SPA)        │             │  Firestore Auth   │
│                     │ ◄────────── │  Gemini AI        │
│                     │  HTTP JSON  │                   │
└─────────────────────┘             └──────────────────┘
```

### Prerrequisitos

```bash
# Herramientas necesarias
gcloud auth login
gcloud config set project pastehub-2d2b2
firebase login

# APIs a habilitar (una vez)
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com cloudbuild.googleapis.com
```

### Paso 1: Crear secrets en Secret Manager

```bash
gcloud secrets create firebase-private-key --replication-policy="automatic"
gcloud secrets create gemini-api-key --replication-policy="automatic"
```

Subir los valores desde `server/.env`:
```bash
# CORTAR el valor de FIREBASE_PRIVATE_KEY desde server/.env y pegarlo:
cat <<< "-----BEGIN PRIVATE KEY-----\nMIIEvQIB...==\n-----END PRIVATE KEY-----" | gcloud secrets versions add firebase-private-key --data-file=-

# Subir Gemini API key
echo -n "AQ.Ab8RN6LAkY1..." | gcloud secrets versions add gemini-api-key --data-file=-
```

### Paso 2: Desplegar (automático)

```bash
bash deploy.sh
```

El script ejecuta:
1. Crea Artifact Registry (si no existe)
2. Build + push Docker image del servidor
3. Deploy a Cloud Run con env vars + secrets
4. Build del frontend con `VITE_API_URL=""` (same-origin)
5. Deploy a Firebase Hosting

### Paso 3: Desplegar índices de Firestore

```bash
firebase deploy --only firestore:indexes
```

### Paso 4: Verificar

```bash
# Health endpoint
curl https://pastehub-2d2b2.web.app/api/health

# SPA routing - probar en navegador
# - https://pastehub-2d2b2.web.app/login
# - https://pastehub-2d2b2.web.app/shops/1
```

### Despliegue manual (paso a paso)

Si prefieres ejecutar cada paso manualmente:

```bash
# 1. Artifact Registry
gcloud artifacts repositories create pastelhub --location=us-central1 --repository-format=docker

# 2. Build + Push (backend)
cd server
docker build -t us-central1-docker.pkg.dev/pastehub-2d2b2/pastelhub/pastelhub-server:latest .
docker push us-central1-docker.pkg.dev/pastehub-2d2b2/pastelhub/pastelhub-server:latest
cd ..

# 3. Deploy Cloud Run
gcloud run deploy pastelhub-server \
  --image=us-central1-docker.pkg.dev/pastehub-2d2b2/pastelhub/pastelhub-server:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --cpu=8 --memory=4Gi \
  --min-instances=2 --max-instances=25 \
  --concurrency=500 --timeout=600 \
  --set-env-vars="NODE_ENV=production,CLIENT_URL=https://pastehub-2d2b2.web.app,FIREBASE_PROJECT_ID=pastehub-2d2b2,FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@pastehub-2d2b2.iam.gserviceaccount.com" \
  --update-secrets="FIREBASE_PRIVATE_KEY=firebase-private-key:latest,GEMINI_API_KEY=gemini-api-key:latest"

# 4. Build frontend
cd client
npm ci
npm run build
cd ..

# 5. Deploy hosting
firebase deploy --only hosting

# 6. Deploy indices
firebase deploy --only firestore:indexes
```

### Variable de entorno CLIENT_URL

La variable `CLIENT_URL` en el backend controla CORS. Debe coincidir exactamente con el dominio de Firebase Hosting:

| Entorno | CLIENT_URL |
|---------|-----------|
| Local | `http://localhost` (default) |
| Producción | `https://pastehub-2d2b2.web.app` |

### Consideraciones de producción

| Aspecto | Nota |
|---------|------|
| **Backups** | El backup automático (cron 3 AM) funciona en Cloud Run pero es efímero. Para persistencia real, migrar a Cloud Scheduler + Cloud Storage |
| **Rate limiting** | 500 req/15min general, 50 req/15min auth. En modo LOAD_TEST: 100k/5s general, 20k/5s auth (para soportar 5000 VUs) |
| **Escalado** | Mínimo 1 instancia (evita cold start). Máximo 50. Concurrency 250 por instancia. Capaz de ~12,500 req/s en pico |
| **Memoria** | 2 GB para soportar picos de ~250 requests concurrentes por instancia |
| **CPU** | 4 vCPU para manejar 5000 VUs en load tests y picos de producción |
| **Firebase Admin** | Usa Opción C (variables de entorno individuales) con `FIREBASE_PRIVATE_KEY` desde Secret Manager |
| **Gemini AI** | El chat usa `gemini-2.0-flash-exp`. API key desde Secret Manager |

### Load Testing con k6 (Cloud Run Job)

El proyecto incluye un script de k6 (`server/tests/load/load-test.js`) que soporta hasta **5000 VUs**.

#### Ejecutar localmente

```bash
cd server

# 1000 VUs con Node.js runner (bypass auth)
npm run load-test:1000

# 5000 VUs con Node.js runner
npm run load-test:5000

# Smoke test rápido (~75s, 100 VUs)
npm run load-test:k6:quick

# 1000 VUs con k6 (completo ~3.5min con 1min steady)
k6 run tests/load/load-test.js -e MAX_VUS=1000 -e STEADY_MINUTES=1

# 5000 VUs con k6 (completo ~3.5min)
k6 run tests/load/load-test.js -e MAX_VUS=5000 -e STEADY_MINUTES=1

# 5000 VUs modo rápido (~75s)
k6 run tests/load/load-test.js -e QUICK=true -e MAX_VUS=5000 -e STEADY_MINUTES=0
```

#### Cloud Run Job (k6)

```bash
# Smoke test rápido (~75s)
gcloud run jobs execute k6-load-test --region=us-central1 \
  --update-env-vars=MAX_VUS=100,STEADY_MINUTES=0,QUICK=true

# 1000 VUs (completo ~3.5min con 1min steady)
gcloud run jobs execute k6-load-test --region=us-central1 \
  --update-env-vars=MAX_VUS=1000,STEADY_MINUTES=1

# 5000 VUs (completo ~3.5min)
gcloud run jobs execute k6-load-test --region=us-central1 \
  --cpu=4 --memory=4Gi \
  --update-env-vars=MAX_VUS=5000,STEADY_MINUTES=1

# 5000 VUs modo rápido (~75s, solo para validación)
gcloud run jobs execute k6-load-test --region=us-central1 \
  --cpu=4 --memory=4Gi \
  --update-env-vars=MAX_VUS=5000,STEADY_MINUTES=0,QUICK=true
```

#### Reportes

- k6 genera reportes HTML automáticos via `handleSummary()` en `/tmp/k6-report-*.html`
- Si `REPORT_BUCKET` está configurado, el reporte se sube a `gs://<bucket>/load-reports/`
- Los runners Node.js generan `load-test-report.html` en la raíz del server

#### Recursos del servidor

Para 5000 VUs el servidor Cloud Run está configurado con:
| Recurso | Valor |
|---------|-------|
| CPU | 8 vCPU |
| RAM | 4 GB |
| Concurrency | 500 req/instancia |
| Min instances | 2 (5 si se necesitan más pre-calentadas) |
| Max instances | 25 |
| Rate limit (LOAD_TEST) | 100k req/5s general, 20k req/5s auth |

---

**Documento generado:** 17/05/2026  
**Última actualización:** 04/06/2026  
**Estado:** ✅ Entorno Cloud Preparado y Documentado
