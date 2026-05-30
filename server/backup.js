require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { admin, db } = require('./src/config/firebase');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SUBCOLLECTIONS = {
  pastryShops: ['schedules', 'categories'],
  products: ['variants'],
  orders: ['items'],
  customers: ['addresses'],
  users: ['addresses'],
  supportTickets: ['messages'],
};

const ALL_COLLECTIONS = [
  'users', 'customers', 'pastryShops', 'products',
  'orders', 'payments', 'reviews', 'notifications',
  'reports', 'promotions', 'chatSessions', 'supportTickets',
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
  const hasSub = !!SUBCOLLECTIONS[collectionName];
  console.log(`  \u2713 ${collectionName}: ${docs.length} docs` + (hasSub ? ' (con subcolecciones)' : ''));
  return docs;
}

function compress(dir, timestamp) {
  try {
    const zipPath = path.join(__dirname, 'backups', `backup-${timestamp}.zip`);
    execSync(
      `powershell Compress-Archive -Path "${dir}\\*" -DestinationPath "${zipPath}" -Force`,
      { timeout: 30000 }
    );
    console.log(`  \uD83D\uDCE6 Comprimido: backup-${timestamp}.zip`);
    return zipPath;
  } catch {
    console.log('  \u26A0 No se pudo comprimir (requiere PowerShell en Windows)');
    return null;
  }
}

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(__dirname, 'backups', timestamp);
  fs.mkdirSync(dir, { recursive: true });

  console.log(`\n\uD83D\uDCE6 Backup iniciado: ${timestamp}\n`);

  const collections = process.argv[2]
    ? process.argv[2].split(',').map(c => c.trim())
    : ALL_COLLECTIONS;

  const invalid = collections.filter(c => !ALL_COLLECTIONS.includes(c));
  if (invalid.length) {
    console.error(`Colecciones inv\u00E1lidas: ${invalid.join(', ')}`);
    console.error(`V\u00E1lidas: ${ALL_COLLECTIONS.join(', ')}`);
    process.exit(1);
  }

  const summary = {};
  for (const name of collections) {
    try {
      const docs = await exportCollection(name, dir);
      summary[name] = docs.length;
    } catch (err) {
      console.error(`  \u2717 ${name}: ERROR \u2014 ${err.message}`);
      summary[name] = 'ERROR';
    }
  }

  const meta = {
    timestamp,
    collections: summary,
    total: Object.values(summary).reduce((a, b) => typeof b === 'number' ? a + b : a, 0),
  };
  fs.writeFileSync(path.join(dir, '_meta.json'), JSON.stringify(meta, null, 2));

  console.log(`\n\u2705 Backup completado: ${dir}`);
  console.log(`   Total documentos: ${meta.total}`);

  compress(dir, timestamp);
}

backup().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
