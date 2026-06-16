const { admin, db } = require('../config/firebase');
const { Storage } = require('@google-cloud/storage');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const BACKUP_BUCKET = process.env.BACKUP_BUCKET || '';
const storage = BACKUP_BUCKET ? new Storage() : null;
const BACKUPS_DIR = path.join(__dirname, '..', '..', 'backups');
const BATCH_SIZE = 500;

const SUBCOLLECTION_KEYS = ['_schedules', '_categories', '_variants', '_items', '_addresses', '_messages'];

const COLLECTION_ORDER = [
  'users', 'customers', 'pastryShops', 'products',
  'orders', 'payments', 'reviews', 'notifications',
  'reports', 'promotions', 'chatSessions', 'supportTickets',
  'invoices',
];

async function listBackups(options = {}) {
  const backups = [];

  if (BACKUP_BUCKET && storage) {
    try {
      const bucket = storage.bucket(BACKUP_BUCKET);
      const [files] = await bucket.getFiles({ prefix: 'backup-' });
      const gcsBackups = files
        .filter(f => f.name.endsWith('.json.gz'))
        .map(f => ({
          filename: f.name,
          size: f.metadata.size,
          updated: f.metadata.updated,
          source: 'gcs',
          bucket: BACKUP_BUCKET,
        }));
      backups.push(...gcsBackups);
    } catch (e) {
      logger.warn('Could not list GCS backups', { error: e.message });
    }
  }

  if (fs.existsSync(BACKUPS_DIR)) {
    const localFiles = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.json.gz'))
      .map(f => {
        const stat = fs.statSync(path.join(BACKUPS_DIR, f));
        return {
          filename: f,
          size: stat.size,
          updated: stat.mtime.toISOString(),
          source: 'local',
          path: path.join(BACKUPS_DIR, f),
        };
      });
    backups.push(...localFiles);
  }

  backups.sort((a, b) => new Date(b.updated) - new Date(a.updated));

  if (options.limit) {
    return backups.slice(0, options.limit);
  }

  return backups;
}

async function getBackup(filename) {
  const localPath = path.join(BACKUPS_DIR, filename);

  if (fs.existsSync(localPath)) {
    logger.info('Loading backup from local', { filename, path: localPath });
    const data = fs.readFileSync(localPath);
    return decompressAndParse(data, filename);
  }

  if (BACKUP_BUCKET && storage) {
    try {
      const bucket = storage.bucket(BACKUP_BUCKET);
      const file = bucket.file(filename);
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error(`Backup "${filename}" not found in GCS or locally`);
      }
      const [data] = await file.download();
      logger.info('Loading backup from GCS', { filename, bucket: BACKUP_BUCKET });
      return decompressAndParse(data, filename);
    } catch (e) {
      if (e.message.includes('not found')) throw e;
      throw new Error(`Error downloading from GCS: ${e.message}`);
    }
  }

  throw new Error(`Backup "${filename}" not found. Checked local (${localPath}) and GCS (${BACKUP_BUCKET})`);
}

function decompressAndParse(data, filename) {
  try {
    const decompressed = zlib.gunzipSync(data);
    const parsed = JSON.parse(decompressed.toString('utf-8'));

    if (!parsed || !parsed.collections || !Array.isArray(parsed.collections)) {
      throw new Error('Invalid backup format: missing collections array');
    }

    return parsed;
  } catch (e) {
    if (e.message.includes('Invalid backup format')) throw e;
    throw new Error(`Failed to decompress/parse backup "${filename}": ${e.message}`);
  }
}

async function validateBackup(filename) {
  const result = {
    filename,
    valid: false,
    version: null,
    timestamp: null,
    totalDocs: 0,
    collections: [],
    errors: [],
    warnings: [],
  };

  let backup;
  try {
    backup = await getBackup(filename);
  } catch (e) {
    result.errors.push(e.message);
    return result;
  }

  result.version = backup.version;
  result.timestamp = backup.timestamp;
  result.totalDocs = backup.total || 0;

  if (!backup.version) {
    result.errors.push('Missing backup version');
  }

  if (!backup.timestamp) {
    result.errors.push('Missing backup timestamp');
  }

  const collectionNames = new Set();

  for (const col of backup.collections) {
    const entry = {
      name: col.name,
      count: col.count || col.docs?.length || 0,
      valid: true,
      errors: [],
    };

    collectionNames.add(col.name);

    if (!col.name) {
      entry.errors.push('Collection missing name');
      entry.valid = false;
    }

    if (!Array.isArray(col.docs)) {
      if (col.count > 0) {
        entry.errors.push(`Collection "${col.name}" has count ${col.count} but no docs array`);
        entry.valid = false;
      }
    } else {
      for (let i = 0; i < col.docs.length; i++) {
        const doc = col.docs[i];
        if (!doc.id) {
          entry.errors.push(`Doc at index ${i} missing id`);
          entry.valid = false;
        }
      }
    }

    if (col.error) {
      entry.errors.push(`Export error: ${col.error}`);
      entry.valid = false;
    }

    result.collections.push(entry);

    if (!entry.valid) {
      result.errors.push(`Collection "${col.name}" has validation errors`);
    }
  }

  const expected = new Set(COLLECTION_ORDER);
  for (const name of collectionNames) {
    if (!expected.has(name)) {
      result.warnings.push(`Unknown collection "${name}" in backup`);
    }
  }

  result.valid = result.errors.length === 0;
  return result;
}

async function getBackupStats(filename) {
  const backup = await getBackup(filename);

  const stats = {
    filename,
    timestamp: backup.timestamp,
    version: backup.version,
    totalDocs: backup.total || 0,
    collections: backup.collections.map(c => ({
      name: c.name,
      docCount: c.count || c.docs?.length || 0,
      hasError: !!c.error,
      error: c.error || null,
    })),
    collectionCount: backup.collections.length,
    subcollectionSummary: {},
  };

  for (const col of backup.collections) {
    if (!Array.isArray(col.docs)) continue;
    for (const key of SUBCOLLECTION_KEYS) {
      if (!stats.subcollectionSummary[key]) {
        stats.subcollectionSummary[key] = 0;
      }
      const totalInCol = col.docs.reduce((sum, doc) => {
        return sum + (Array.isArray(doc[key]) ? doc[key].length : 0);
      }, 0);
      stats.subcollectionSummary[key] += totalInCol;
    }
  }

  return stats;
}

async function restoreBackup(filename, options = {}) {
  const {
    collections: filterCollections,
    dryRun = false,
    conflictStrategy = 'overwrite',
  } = options;

  const backup = await getBackup(filename);
  const validation = await validateBackup(filename);

  if (!validation.valid) {
    throw new Error(`Backup validation failed: ${validation.errors.join('; ')}`);
  }

  let collectionsToRestore = backup.collections;

  if (filterCollections && filterCollections.length > 0) {
    const filterSet = new Set(filterCollections);
    collectionsToRestore = collectionsToRestore.filter(c => filterSet.has(c.name));
    if (collectionsToRestore.length === 0) {
      throw new Error(`No matching collections found for filter: ${filterCollections.join(', ')}`);
    }
  }

  collectionsToRestore.sort((a, b) => {
    const ai = COLLECTION_ORDER.indexOf(a.name);
    const bi = COLLECTION_ORDER.indexOf(b.name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const result = {
    filename,
    timestamp: backup.timestamp,
    dryRun,
    conflictStrategy,
    collections: [],
    mainDocs: 0,
    subDocs: 0,
    totalDocs: 0,
    errors: [],
  };

  if (dryRun) {
    logger.info('DRY RUN - Backup restore simulation', { filename, collections: collectionsToRestore.map(c => c.name) });

    for (const col of collectionsToRestore) {
      const docs = col.docs || [];
      let subCount = 0;
      for (const key of SUBCOLLECTION_KEYS) {
        subCount += docs.reduce((s, d) => s + (Array.isArray(d[key]) ? d[key].length : 0), 0);
      }

      const entry = {
        name: col.name,
        mainDocs: docs.length,
        subDocs: subCount,
        totalDocs: docs.length + subCount,
        status: 'simulated',
      };

      result.collections.push(entry);
      result.mainDocs += docs.length;
      result.subDocs += subCount;
    }

    result.totalDocs = result.mainDocs + result.subDocs;
    return result;
  }

  logger.info('Starting backup restore', {
    filename,
    collections: collectionsToRestore.map(c => c.name),
    conflictStrategy,
  });

  for (const col of collectionsToRestore) {
    const docs = col.docs || [];
    if (docs.length === 0) {
      result.collections.push({
        name: col.name,
        mainDocs: 0,
        subDocs: 0,
        totalDocs: 0,
        status: 'empty',
      });
      continue;
    }

    const subDataMap = {};
    const mainDocs = [];

    for (const doc of docs) {
      const { id, ...data } = doc;
      const subs = {};

      for (const key of SUBCOLLECTION_KEYS) {
        if (data[key] !== undefined) {
          subs[key] = data[key];
          delete data[key];
        }
      }

      mainDocs.push({ id, data });
      if (Object.keys(subs).length > 0) {
        subDataMap[id] = subs;
      }
    }

    let restored = 0;

    for (let i = 0; i < mainDocs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = mainDocs.slice(i, i + BATCH_SIZE);

      for (const { id, data } of chunk) {
        if (conflictStrategy === 'skip') {
          batch.set(db.collection(col.name).doc(id), data, { merge: false });
        } else {
          batch.set(db.collection(col.name).doc(id), data, { merge: true });
        }
      }

      try {
        await batch.commit();
        restored += chunk.length;
        logger.info(`Restored ${restored}/${mainDocs.length} docs in "${col.name}"`);
      } catch (e) {
        result.errors.push(`Error restoring "${col.name}" batch: ${e.message}`);
        logger.error('Batch restore error', { collection: col.name, error: e.message });
        break;
      }
    }

    let subRestored = 0;

    for (const [docId, subs] of Object.entries(subDataMap)) {
      const docRef = db.collection(col.name).doc(docId);

      for (const [key, items] of Object.entries(subs)) {
        if (!Array.isArray(items) || items.length === 0) continue;

        const subName = key.replace(/^_/, '');

        for (let i = 0; i < items.length; i += BATCH_SIZE) {
          const batch = db.batch();
          const chunk = items.slice(i, i + BATCH_SIZE);

          for (const item of chunk) {
            const { id, ...itemData } = item;
            if (conflictStrategy === 'skip') {
              batch.set(docRef.collection(subName).doc(id), itemData, { merge: false });
            } else {
              batch.set(docRef.collection(subName).doc(id), itemData, { merge: true });
            }
          }

          try {
            await batch.commit();
            subRestored += chunk.length;
          } catch (e) {
            result.errors.push(`Error restoring subcollection "${col.name}/${docId}/${subName}": ${e.message}`);
          }
        }
      }
    }

    result.collections.push({
      name: col.name,
      mainDocs: restored,
      subDocs: subRestored,
      totalDocs: restored + subRestored,
      status: 'restored',
    });

    result.mainDocs += restored;
    result.subDocs += subRestored;
  }

  result.totalDocs = result.mainDocs + result.subDocs;

  logger.info('Backup restore completed', {
    filename,
    mainDocs: result.mainDocs,
    subDocs: result.subDocs,
    totalDocs: result.totalDocs,
    errors: result.errors.length,
  });

  return result;
}

module.exports = {
  listBackups,
  getBackup,
  validateBackup,
  getBackupStats,
  restoreBackup,
};
