const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { createBackup, getLastBackup, getBackupHistory, ALL_COLLECTIONS } = require('../utils/backupService');
const {
  listBackups,
  restoreBackup,
  validateBackup,
  getBackupStats,
} = require('../utils/restoreService');

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const collections = req.body.collections
      ? req.body.collections.filter(c => ALL_COLLECTIONS.includes(c))
      : ALL_COLLECTIONS;

    if (!collections.length) {
      return res.status(400).json({ error: 'No hay colecciones válidas para respaldar' });
    }

    const backup = await createBackup(collections);
    res.json({
      message: 'Backup completado',
      timestamp: backup.meta.timestamp,
      total: backup.meta.total,
      collections: backup.meta.collections,
      filename: backup.filename,
    });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear backup' });
  }
});

router.get('/download', verifyToken, requireAdmin, async (req, res) => {
  try {
    const backup = await createBackup(ALL_COLLECTIONS);
    res.set({
      'Content-Type': 'application/gzip',
      'Content-Disposition': `attachment; filename="${backup.filename}"`,
    });
    res.send(backup.data);
  } catch (e) {
    res.status(500).json({ error: 'Error al descargar backup' });
  }
});

router.get('/last', verifyToken, requireAdmin, (req, res) => {
  const last = getLastBackup();
  if (!last) return res.json({ message: 'No hay backups registrados' });
  res.json(last);
});

router.get('/history', verifyToken, requireAdmin, (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json(getBackupHistory(limit));
});

router.get('/list', verifyToken, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const backups = await listBackups({ limit });
    res.json({ backups, count: backups.length });
  } catch (e) {
    res.status(500).json({ error: 'Error al listar backups', details: e.message });
  }
});

router.post('/restore', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { filename, collections, dryRun, conflictStrategy } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Se requiere el nombre del archivo de backup' });
    }

    const result = await restoreBackup(filename, {
      collections: collections || null,
      dryRun: dryRun || false,
      conflictStrategy: conflictStrategy || 'overwrite',
    });

    res.json({
      message: dryRun ? 'Simulación de restauración completada' : 'Restauración completada',
      ...result,
    });
  } catch (e) {
    res.status(500).json({ error: 'Error al restaurar backup', details: e.message });
  }
});

router.post('/validate', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Se requiere el nombre del archivo de backup' });
    }

    const result = await validateBackup(filename);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al validar backup', details: e.message });
  }
});

router.get('/info/:filename', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await getBackupStats(req.params.filename);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener info del backup', details: e.message });
  }
});

module.exports = router;
