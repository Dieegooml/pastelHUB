const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
  createTraceMiddleware: jest.fn(() => (req, res, next) => next()),
  childLogger: jest.fn(() => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), log: jest.fn() })),
}));

jest.mock('@google-cloud/storage', () => {
  const mockFile = {
    exists: jest.fn(),
    download: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const mockBucket = {
    file: jest.fn(() => mockFile),
    getFiles: jest.fn(),
  };
  return {
    Storage: jest.fn(() => ({
      bucket: jest.fn(() => mockBucket),
    })),
  };
});

const restoreService = require('../../src/utils/restoreService');

const {
  createValidBackupBuffer,
  createInvalidBackupBuffer,
  createLargeBackupBuffer,
  createMockBackupData,
  compressBackup,
} = require('../setup-backup');

describe('restoreService', () => {
  beforeAll(() => {
    process.env.BACKUP_BUCKET = '';
  });

  describe('validateBackup', () => {
    test('validates correct backup successfully', async () => {
      const buf = createValidBackupBuffer();

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(buf);

      const result = await restoreService.validateBackup('valid-backup.json.gz');
      expect(result.valid).toBe(true);
      expect(result.version).toBe('1.0');
      expect(result.timestamp).toBeDefined();
      expect(result.collections).toHaveLength(2);
      expect(result.errors).toHaveLength(0);

      jest.restoreAllMocks();
    });

    test('fails for backup without collections', async () => {
      const buf = createInvalidBackupBuffer('no-collections');

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(buf);

      const result = await restoreService.validateBackup('no-cols.json.gz');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      jest.restoreAllMocks();
    });

    test('handles non-existent file gracefully', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = await restoreService.validateBackup('nonexistent.json.gz');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      jest.restoreAllMocks();
    });

    test('detects docs without ids', async () => {
      const data = createMockBackupData({
        collections: [{
          name: 'users',
          count: 1,
          docs: [{ name: 'No ID' }],
        }],
      });
      const buf = compressBackup(data);

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(buf);

      const result = await restoreService.validateBackup('no-id.json.gz');
      expect(result.valid).toBe(false);
      expect(result.collections[0].errors.length).toBeGreaterThan(0);

      jest.restoreAllMocks();
    });

    test('warns on unknown collection', async () => {
      const data = createMockBackupData({
        collections: [{
          name: 'unknownCol',
          count: 1,
          docs: [{ id: 'doc1', name: 'test' }],
        }],
      });
      const buf = compressBackup(data);

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(buf);

      const result = await restoreService.validateBackup('unknown-col.json.gz');
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);

      jest.restoreAllMocks();
    });
  });

  describe('getBackupStats', () => {
    test('returns correct stats for valid backup', async () => {
      const buf = createValidBackupBuffer();

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(buf);

      const stats = await restoreService.getBackupStats('stats-test.json.gz');
      expect(stats.timestamp).toBeDefined();
      expect(stats.version).toBe('1.0');
      expect(stats.totalDocs).toBe(3);
      expect(stats.collectionCount).toBe(2);
      expect(stats.collections).toHaveLength(2);
      expect(stats.subcollectionSummary['_addresses']).toBe(1);
      expect(stats.subcollectionSummary['_schedules']).toBe(1);

      jest.restoreAllMocks();
    });
  });

  describe('listBackups', () => {
    test('returns empty array when no backups exist', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const backups = await restoreService.listBackups();
      expect(Array.isArray(backups)).toBe(true);
      expect(backups.length).toBe(0);

      jest.restoreAllMocks();
    });
  });

  describe('restoreBackup', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('dry run does not write to firestore', async () => {
      const buf = createValidBackupBuffer();

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(buf);

      const result = await restoreService.restoreBackup('dry-run-test.json.gz', {
        dryRun: true,
        conflictStrategy: 'overwrite',
      });

      expect(result.dryRun).toBe(true);
      expect(result.mainDocs).toBe(3);
      expect(result.collections).toHaveLength(2);

      jest.restoreAllMocks();
    });

    test('restores with overwrite strategy', async () => {
      const buf = createValidBackupBuffer();

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(buf);

      const batch = { set: jest.fn(), commit: jest.fn().mockResolvedValue() };
      global.mockFirestore.batch = jest.fn(() => batch);

      const result = await restoreService.restoreBackup('overwrite-test.json.gz', {
        dryRun: false,
        conflictStrategy: 'overwrite',
      });

      expect(result.mainDocs).toBe(3);
      expect(result.errors).toHaveLength(0);

      jest.restoreAllMocks();
    });

    test('rejects invalid backup', async () => {
      const buf = createInvalidBackupBuffer('no-collections');

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(buf);

      await expect(
        restoreService.restoreBackup('invalid-restore.json.gz')
      ).rejects.toThrow(/missing collections array/);

      jest.restoreAllMocks();
    });

    test('filters collections when specified', async () => {
      const buf = createValidBackupBuffer();

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(buf);

      const result = await restoreService.restoreBackup('filter-test.json.gz', {
        dryRun: true,
        collections: ['users'],
      });

      expect(result.collections).toHaveLength(1);
      expect(result.collections[0].name).toBe('users');
      expect(result.mainDocs).toBe(2);

      jest.restoreAllMocks();
    });

    test('handles large backups with batched writes', async () => {
      const buf = createLargeBackupBuffer(100);

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(buf);

      const batch = { set: jest.fn(), commit: jest.fn().mockResolvedValue() };
      global.mockFirestore.batch = jest.fn(() => batch);

      const result = await restoreService.restoreBackup('large-test.json.gz', {
        dryRun: false,
        conflictStrategy: 'overwrite',
      });

      expect(result.mainDocs).toBe(100);

      jest.restoreAllMocks();
    });
  });
});
