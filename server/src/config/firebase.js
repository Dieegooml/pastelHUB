const admin = require('firebase-admin');

let credential;

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Opción B: variable de entorno con ruta al archivo
  const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  credential = admin.credential.cert(serviceAccount);
} else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  // Opción C: variables individuales (CI/CD)
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });
} else {
  // Opción A: archivo local serviceAccountKey.json
  try {
    const serviceAccount = require('../../serviceAccountKey.json');
    credential = admin.credential.cert(serviceAccount);
  } catch {
    console.warn('No se encontró serviceAccountKey.json — usando aplicación por defecto');
  }
}

const projectId = process.env.FIREBASE_PROJECT_ID || 'pastehub-2d2b2';
const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

const initConfig = { storageBucket: bucketName };
if (credential) initConfig.credential = credential;

admin.initializeApp(initConfig);

const db = admin.firestore();
db.settings({
  maxIdleChannels: 100,
  ignoreUndefinedProperties: true,
});
const storage = admin.storage();
const bucket = storage.bucket();

module.exports = { admin, db, storage, bucket };