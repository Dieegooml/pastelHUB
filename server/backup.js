const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const SUBCOLLECTIONS = {
  pastryShops: ['schedules', 'categories'],
  products: ['variants'],
  orders: ['items'],
  customers: ['addresses'],
  users: ['addresses'],
};

const ALL_COLLECTIONS = [
  'users', 'customers', 'pastryShops', 'products',
  'orders', 'payments', 'reviews', 'notifications', 'reports', 'chatSessions',
];

async function exportCollection(collectionName, dir) {
  const snap = await db.collection(collectionName).get();
  if (snap.empty) return [];

  const docs = [];
  for (const doc of snap.docs) {
    const data = { id: doc.id, ...doc.data() };

    const subs = SUBCOLLECTIONS[collectionName];
    if (subs) {
      for (const sub of subs) {
        const subSnap = await doc.ref.collection(sub).get();
        if (!subSnap.empty) {
          data[`_${sub}`] = subSnap.docs.map(sd => ({ id: sd.id, ...sd.data() }));
        }
      }
    }

    docs.push(data);
  }

  const filePath = path.join(dir, `${collectionName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
  console.log(`  ✓ ${collectionName}: ${docs.length} docs` + (docs[0] && docs[0]['_schedules'] ? ` (con subcolecciones)` : ''));
  return docs;
}

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(__dirname, 'backups', timestamp);
  fs.mkdirSync(dir, { recursive: true });

  console.log(`\n📦 Backup iniciado: ${timestamp}\n`);

  const collections = process.argv[2]
    ? process.argv[2].split(',').map(c => c.trim())
    : ALL_COLLECTIONS;

  const invalid = collections.filter(c => !ALL_COLLECTIONS.includes(c));
  if (invalid.length) {
    console.error(`Colecciones inválidas: ${invalid.join(', ')}`);
    console.error(`Válidas: ${ALL_COLLECTIONS.join(', ')}`);
    process.exit(1);
  }

  const summary = {};
  for (const name of collections) {
    try {
      const docs = await exportCollection(name, dir);
      summary[name] = docs.length;
    } catch (err) {
      console.error(`  ✗ ${name}: ERROR — ${err.message}`);
      summary[name] = 'ERROR';
    }
  }

  const meta = {
    timestamp,
    collections: summary,
    total: Object.values(summary).reduce((a, b) => typeof b === 'number' ? a + b : a, 0),
  };
  fs.writeFileSync(path.join(dir, '_meta.json'), JSON.stringify(meta, null, 2));

  console.log(`\n✅ Backup completado: ${dir}`);
  console.log(`   Total documentos: ${meta.total}`);
}

backup().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});