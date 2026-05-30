require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { admin, db } = require('./src/config/firebase');
const fs = require('fs');
const path = require('path');

const BACKUPS_DIR = path.join(__dirname, 'backups');
const BATCH_SIZE = 500;

const SUBFIELD_KEYS = ['_schedules', '_categories', '_variants', '_items', '_addresses'];

const pendingSubcollections = {};

function findLatestBackup() {
  const entries = fs.readdirSync(BACKUPS_DIR, { withFileTypes: true });
  const dirs = entries
    .filter(e => e.isDirectory() && /^\d{4}-\d{2}-\d{2}T/.test(e.name))
    .map(e => e.name)
    .sort()
    .reverse();

  if (!dirs.length) {
    console.error('No se encontraron backups en server/backups/');
    process.exit(1);
  }

  const latest = path.join(BACKUPS_DIR, dirs[0]);
  console.log(`\uD83D\uDD0D \u00DAltimo backup encontrado: ${dirs[0]}`);
  return latest;
}

async function importCollection(collectionName, filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const docs = JSON.parse(raw);
  if (!docs.length) return 0;

  let restored = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);

    for (const doc of chunk) {
      const { id, ...data } = doc;

      const subData = {};
      for (const key of SUBFIELD_KEYS) {
        if (data[key] !== undefined) {
          subData[key] = data[key];
          delete data[key];
        }
      }

      if (Object.keys(subData).length > 0) {
        if (!pendingSubcollections[collectionName]) {
          pendingSubcollections[collectionName] = {};
        }
        pendingSubcollections[collectionName][id] = subData;
      }

      batch.set(db.collection(collectionName).doc(id), data, { merge: false });
    }

    await batch.commit();
    restored += chunk.length;
  }

  return restored;
}

async function restoreSubcollections() {
  let total = 0;

  for (const [collectionName, docs] of Object.entries(pendingSubcollections)) {
    for (const [docId, subData] of Object.entries(docs)) {
      const docRef = db.collection(collectionName).doc(docId);

      for (const [key, items] of Object.entries(subData)) {
        if (!Array.isArray(items) || items.length === 0) continue;

        const subName = key.replace(/^_/, '');

        for (let i = 0; i < items.length; i += BATCH_SIZE) {
          const batch = db.batch();
          const chunk = items.slice(i, i + BATCH_SIZE);

          for (const item of chunk) {
            const { id, ...itemData } = item;
            batch.set(docRef.collection(subName).doc(id), itemData, { merge: false });
            total++;
          }

          await batch.commit();
        }
      }
    }
  }

  return total;
}

async function restore() {
  const arg = process.argv[2];
  const source = arg
    ? (path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg))
    : findLatestBackup();

  if (!fs.existsSync(source)) {
    console.error(`No existe: ${source}`);
    process.exit(1);
  }

  console.log(`\n\u267B Restaurando backup: ${source}\n`);

  const metaPath = path.join(source, '_meta.json');
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    console.log(`   Backup del: ${meta.timestamp}`);
    console.log(`   Colecciones: ${Object.keys(meta.collections).join(', ')}`);
    console.log('');
  }

  const files = fs.readdirSync(source)
    .filter(f => f.endsWith('.json') && f !== '_meta.json')
    .sort();

  let total = 0;

  for (const file of files) {
    const collectionName = file.replace('.json', '');
    const filePath = path.join(source, file);

    try {
      const count = await importCollection(collectionName, filePath);
      if (count > 0) {
        console.log(`  \u2713 ${collectionName}: ${count} docs restaurados`);
      } else {
        console.log(`  - ${collectionName}: vac\u00EDo, se omite`);
      }
      total += count;
    } catch (err) {
      console.error(`  \u2717 ${collectionName}: ERROR \u2014 ${err.message}`);
    }
  }

  const subTotal = await restoreSubcollections();

  console.log(`\n\u2705 Restauraci\u00F3n completada:`);
  console.log(`   Documentos principales: ${total}`);
  console.log(`   Documentos en subcolecciones: ${subTotal}`);
  console.log(`   Total: ${total + subTotal}`);
}

restore().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
