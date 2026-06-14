const { admin, db } = require('../config/firebase');
const { Storage } = require('@google-cloud/storage');
const zlib = require('zlib');
const logger = require('./logger');

const BACKUP_BUCKET = process.env.BACKUP_BUCKET || '';
const storage = BACKUP_BUCKET ? new Storage() : null;

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
  'invoices',
];

const BACKUP_HISTORY_COLLECTION = 'backupHistory';
let lastBackup = null;
let backupHistory = [];

async function loadBackupHistoryFromFirestore() {
  try {
    const snap = await db.collection(BACKUP_HISTORY_COLLECTION)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();
    if (!snap.empty) {
      backupHistory = snap.docs.map(d => d.data()).reverse();
      lastBackup = backupHistory[backupHistory.length - 1] || null;
      logger.info('Backup history loaded from Firestore', { count: backupHistory.length });
    }
  } catch (e) {
    logger.warn('Could not load backup history from Firestore, using in-memory only', { error: e.message });
  }
}

async function persistBackupToFirestore(entry) {
  try {
    const ref = db.collection(BACKUP_HISTORY_COLLECTION).doc(entry.timestamp);
    await ref.set({
      ...entry,
      persistedAt: new Date().toISOString(),
    });
    logger.info('Backup entry persisted to Firestore', { timestamp: entry.timestamp, total: entry.total });
  } catch (e) {
    logger.warn('Could not persist backup to Firestore, keeping in memory only', { error: e.message });
  }
}

loadBackupHistoryFromFirestore();

async function uploadToGCS(filename, data, meta) {
  if (!BACKUP_BUCKET || !storage) return false;
  try {
    const bucket = storage.bucket(BACKUP_BUCKET);
    await bucket.file(filename).save(data);
    const metaFilename = filename.replace('.json.gz', '.meta.json');
    await bucket.file(metaFilename).save(JSON.stringify(meta, null, 2));
    logger.info('Backup subido a GCS', { bucket: BACKUP_BUCKET, filename });
    return true;
  } catch (e) {
    logger.error('Error subiendo backup a GCS', { error: e.message, bucket: BACKUP_BUCKET });
    return false;
  }
}

async function exportCollection(collectionName) {
  const snap = await db.collection(collectionName).get();
  if (snap.empty) return { name: collectionName, docs: [], count: 0 };

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

  return { name: collectionName, docs, count: docs.length };
}

async function createBackup(collections) {
  const timestamp = new Date().toISOString();
  const results = [];

  for (const name of collections) {
    try {
      const result = await exportCollection(name);
      results.push(result);
    } catch (err) {
      results.push({ name, docs: [], count: 0, error: err.message });
    }
  }

  const data = {
    timestamp,
    version: '1.0',
    collections: results,
    total: results.reduce((sum, r) => sum + r.count, 0),
  };

  const json = JSON.stringify(data);
  const compressed = zlib.gzipSync(json);

  const entry = { timestamp, total: data.total, collections: results.map(r => ({ name: r.name, count: r.count, error: r.error })) };
  lastBackup = entry;
  backupHistory.push(entry);
  await persistBackupToFirestore(entry);

  const filename = `backup-${timestamp.replace(/[:.]/g, '-')}.json.gz`;

  await uploadToGCS(filename, compressed, entry);

  return {
    data: compressed,
    filename,
    meta: entry,
  };
}

function getLastBackup() {
  return lastBackup;
}

function getBackupHistory(limit = 10) {
  return backupHistory.slice(-limit);
}

module.exports = { createBackup, getLastBackup, getBackupHistory, ALL_COLLECTIONS };
