const { admin, db } = require('../config/firebase');
const zlib = require('zlib');

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

let lastBackup = null;
let backupHistory = [];

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

  return {
    data: compressed,
    filename: `backup-${timestamp.replace(/[:.]/g, '-')}.json.gz`,
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
