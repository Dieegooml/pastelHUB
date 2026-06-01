const { initializeApp, cert, applicationDefault } = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

function init() {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }
  try {
    return cert(require('../../serviceAccountKey.json'));
  } catch {}
  try {
    return applicationDefault();
  } catch {}
  throw new Error('No se encontraron credenciales. Descarga serviceAccountKey.json en server/');
}

const credential = init();
const app = initializeApp({ credential });
const db = getFirestore(app);
const auth = getAuth(app);

const USERS = [
  { uid: 'admin-001',       email: 'admin@pastelhub.com',          full_name: 'Admin PastelHub', phone: '+51 999 000 001', roles: ['admin'] },
  { uid: 'owner-001',       email: 'owner@dulcearomas.com',        full_name: 'Carlos Dulce',    phone: '+51 999 000 002', roles: ['owner'] },
  { uid: 'customer-001',    email: 'cliente@ejemplo.com',          full_name: 'María Pérez',     phone: '+51 999 000 003', roles: ['customer'] },
  { uid: 'admin-diego-001', email: 'diegomedinalop123@gmail.com',  full_name: 'Diego Medina',    phone: '',                 roles: ['admin'] },
];

function getPassword(email) {
  if (email === 'diegomedinalop123@gmail.com') return '27deJuliodel2005**';
  return 'Test123!';
}

async function fix() {
  for (const u of USERS) {
    const password = getPassword(u.email);

    try {
      await auth.getUser(u.uid);
      console.log(`[Auth] Ya existe: ${u.email}`);
      await auth.setCustomUserClaims(u.uid, { roles: u.roles });
      console.log(`  → Claims actualizados: ${u.roles}`);
    } catch {
      const record = await auth.createUser({ uid: u.uid, email: u.email, password });
      await auth.setCustomUserClaims(u.uid, { roles: u.roles });
      console.log(`[Auth] Creado: ${record.email} — ${u.roles}`);
    }

    const userRef = db.collection('users').doc(u.uid);
    const doc = await userRef.get();
    const now = new Date().toISOString();

    if (!doc.exists) {
      await userRef.set({
        email: u.email,
        full_name: u.full_name,
        phone: u.phone,
        roles: u.roles,
        isActive: true,
        addresses: [],
        password_hash: '',
        createdAt: now,
        updatedAt: now,
      });
      console.log(`[Firestore] Creado: ${u.email}`);
      // También crear customer profile para user con rol customer
      if (u.roles.includes('customer')) {
        await db.collection('customers').doc(u.uid).set({
          defaultAddressId: '',
          createdAt: now,
        });
        console.log(`  → Customer profile creado`);
      }
    } else {
      await userRef.update({ roles: u.roles, updatedAt: now });
      console.log(`[Firestore] Actualizado: ${u.email} → roles: ${u.roles}`);
    }
  }

  console.log('\n=== LISTO ===');
  for (const u of USERS) {
    console.log(`  ${u.email} / ${getPassword(u.email)}  → ${u.roles}`);
  }
  process.exit(0);
}

fix().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
