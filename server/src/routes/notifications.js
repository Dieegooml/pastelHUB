const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin, requireSelfOrAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createNotificationSchema, bulkNotificationSchema } = require('../validators/notificationValidator');
const { paginate, tryPaginate } = require('../utils/paginate');

const col = db.collection('notifications');

const VALID_TYPES = [
  'order_update',
  'new_review',
  'shop_approved',
  'shop_rejected',
  'shop_suspended',
  'report_resolved',
  'new_order',
  'payment_confirmed',
];

// GET todas las notificaciones
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  await tryPaginate(res, col, req.query, { orderBy: 'createdAt' }, 'Error al obtener notificaciones');
});

// GET notificaciones por usuario (propio usuario o admin)
router.get('/user/:userId', verifyToken, requireSelfOrAdmin('userId'), async (req, res) => {
  await tryPaginate(res, col, req.query, {
    orderBy: 'createdAt', filters: [{ field: 'userId', value: req.params.userId }],
  }, 'Error al obtener notificaciones del usuario');
});

// GET conteo de no leídas por usuario (propio usuario o admin)
router.get('/user/:userId/unread/count', verifyToken, requireSelfOrAdmin('userId'), async (req, res) => {
  try {
    const snap = await col
      .where('userId', '==', req.params.userId)
      .where('isRead', '==', false)
      .count()
      .get();
    res.json({ count: snap.data().count || 0 });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener conteo de notificaciones' });
  }
});

// GET notificaciones no leídas por usuario (propio usuario o admin)
router.get('/user/:userId/unread', verifyToken, requireSelfOrAdmin('userId'), async (req, res) => {
  await tryPaginate(res, col, req.query, {
    orderBy: 'createdAt',
    filters: [
      { field: 'userId', value: req.params.userId },
      { field: 'isRead', value: false },
    ],
  }, 'Error al obtener notificaciones no leídas');
});

// GET una notificación (propietario o admin)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Notificación no encontrada' });
    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta notificación' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la notificación' });
  }
});

// POST crear notificación
router.post('/', verifyToken, requireAdmin, validate(createNotificationSchema), async (req, res) => {
  try {
    const { userId, type, message, title } = req.body;

    // Verificar que el usuario existe
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'El usuario no existe' });
    }

    const data = {
      userId,
      type,
      message,
      title:     title || '',
      isRead:    false,
      createdAt: new Date().toISOString(),
    };

    const ref = await col.add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear la notificación' });
  }
});

// POST crear notificación masiva (para varios usuarios a la vez)
router.post('/bulk', verifyToken, requireAdmin, validate(bulkNotificationSchema), async (req, res) => {
  try {
    const { userIds, type, message, title } = req.body;

    const batch    = db.batch();
    const now      = new Date().toISOString();
    const created  = [];

    userIds.forEach(userId => {
      const ref = col.doc();
      const data = { userId, type, message, title: title || '', isRead: false, createdAt: now };
      batch.set(ref, data);
      created.push({ id: ref.id, ...data });
    });

    await batch.commit();
    res.status(201).json({ count: created.length, notifications: created });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear notificaciones masivas' });
  }
});

// PATCH marcar como leída (propietario o admin)
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Notificación no encontrada' });

    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta notificación' });
    }

    await col.doc(req.params.id).update({ isRead: true });
    res.json({ id: req.params.id, isRead: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al marcar como leída' });
  }
});

// PATCH marcar todas como leídas por usuario (propio usuario o admin)
router.patch('/user/:userId/read-all', verifyToken, requireSelfOrAdmin('userId'), async (req, res) => {
  try {
    const snap = await col
      .where('userId', '==', req.params.userId)
      .where('isRead', '==', false)
      .get();

    if (snap.empty) {
      return res.json({ message: 'No hay notificaciones sin leer', count: 0 });
    }

    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref, { isRead: true }));
    await batch.commit();

    res.json({ message: 'Notificaciones marcadas como leídas', count: snap.docs.length });
  } catch (e) {
    res.status(500).json({ error: 'Error al marcar notificaciones como leídas' });
  }
});

// DELETE una notificación (propietario o admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Notificación no encontrada' });

    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta notificación' });
    }

    await col.doc(req.params.id).delete();
    res.json({ message: 'Notificación eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar la notificación' });
  }
});

// DELETE eliminar todas las notificaciones de un usuario (propio usuario o admin)
router.delete('/user/:userId', verifyToken, requireSelfOrAdmin('userId'), async (req, res) => {
  try {
    const snap = await col.where('userId', '==', req.params.userId).get();

    if (snap.empty) {
      return res.json({ message: 'No hay notificaciones para eliminar', count: 0 });
    }

    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();

    res.json({ message: 'Notificaciones eliminadas correctamente', count: snap.docs.length });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar notificaciones del usuario' });
  }
});

module.exports = router;