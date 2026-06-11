const zlib = require('zlib');

function createMockBackupData(overrides = {}) {
  const data = {
    timestamp: overrides.timestamp || '2025-06-10T12:00:00.000Z',
    version: overrides.version || '1.0',
    total: overrides.total || 0,
    collections: overrides.collections || [],
  };
  data.total = data.collections.reduce((sum, c) => sum + (c.docs ? c.docs.length : 0), 0);
  return data;
}

function compressBackup(data) {
  return zlib.gzipSync(JSON.stringify(data));
}

function createValidBackupBuffer() {
  const data = createMockBackupData({
    collections: [
      {
        name: 'users',
        count: 2,
        docs: [
          { id: 'user1', name: 'Admin', email: 'admin@test.com', roles: ['admin'], is_active: true },
          { id: 'user2', name: 'Customer', email: 'cust@test.com', roles: ['customer'], is_active: true, _addresses: [{ id: 'addr1', street: '123 Main' }] },
        ],
      },
      {
        name: 'pastryShops',
        count: 1,
        docs: [
          { id: 'shop1', name: 'Panadería Central', owner_id: 'user1', is_active: true, _schedules: [{ id: 'sched1', day: 'Mon', open: '08:00', close: '18:00' }] },
        ],
      },
    ],
  });
  return compressBackup(data);
}

function createInvalidBackupBuffer(reason = 'no-collections') {
  if (reason === 'no-collections') {
    return compressBackup({ timestamp: '2025-01-01', version: '1.0' });
  }
  if (reason === 'bad-json') {
    return zlib.gzipSync(Buffer.from('not-json-at-all'));
  }
  if (reason === 'not-gzip') {
    return Buffer.from('plain text backup data');
  }
  return compressBackup({});
}

function createLargeBackupBuffer(docCount = 1000) {
  const docs = [];
  for (let i = 0; i < docCount; i++) {
    docs.push({
      id: `doc-${i}`,
      name: `Document ${i}`,
      value: Math.random(),
      tags: ['test', 'large', `batch-${Math.floor(i / 100)}`],
    });
  }
  const data = createMockBackupData({
    collections: [{ name: 'orders', count: docCount, docs }],
  });
  return compressBackup(data);
}

global.createMockBackupData = createMockBackupData;
global.compressBackup = compressBackup;
global.createValidBackupBuffer = createValidBackupBuffer;
global.createInvalidBackupBuffer = createInvalidBackupBuffer;
global.createLargeBackupBuffer = createLargeBackupBuffer;

module.exports = {
  createMockBackupData,
  compressBackup,
  createValidBackupBuffer,
  createInvalidBackupBuffer,
  createLargeBackupBuffer,
};
