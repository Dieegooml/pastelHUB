const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { createBackup, getLastBackup, getBackupHistory, ALL_COLLECTIONS } = require('../utils/backupService');

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
  if (!last) return res.json({ message: 'No hay backups registrados en esta sesión' });
  res.json(last);
});

router.get('/history', verifyToken, requireAdmin, (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json(getBackupHistory(limit));
});

module.exports = router;
