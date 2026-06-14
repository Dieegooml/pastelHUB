const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin, requireSelfOrAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createNotificationSchema, bulkNotificationSchema } = require('../validators/notificationValidator');
const { paginate, tryPaginate } = require('../utils/paginate');
const { sendPush } = require('../utils/fcmService');
const { pushNotification } = require('../utils/websocket');
const cache = require('../utils/cache');
const { mapNotificationFromRequest, mapNotificationToResponse } = require('../utils/mappers');

const col = db.collection('notifications');

const countCacheStore = cache.createStore('notificationCount', { ttl: 15000 });

function invalidateCountCache(userId) {
  cache.del(countCacheStore, `unread_${userId}`);
}

// GET todas las notificaciones
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  await tryPaginate(res, col, req.query, { orderBy: 'created_at' }, 'Error al obtener notificaciones');
});

// GET notificaciones por usuario (propio usuario o admin)
router.get('/user/:userId', verifyToken, requireSelfOrAdmin('userId'), async (req, res) => {
  await tryPaginate(res, col, req.query, {
    orderBy: 'created_at', filters: [{ field: 'user_id', value: req.params.userId }],
  }, 'Error al obtener notificaciones del usuario');
});

// GET conteo de no leídas por usuario (propio usuario o admin)
router.get('/user/:userId/unread/count', verifyToken, requireSelfOrAdmin('userId'), async (req, res) => {
  try {
    const key = `unread_${req.params.userId}`;
    const cached = cache.get(countCacheStore, key);
    if (cached !== null) return res.json({ count: cached });
    const snap = await col
      .where('user_id', '==', req.params.userId)
      .where('is_read', '==', false)
      .count()
      .get();
    const count = snap.data().count || 0;
    cache.set(countCacheStore, key, count);
    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener conteo de notificaciones' });
  }
});

// GET notificaciones no leídas por usuario (propio usuario o admin)
router.get('/user/:userId/unread', verifyToken, requireSelfOrAdmin('userId'), async (req, res) => {
  await tryPaginate(res, col, req.query, {
    orderBy: 'created_at',
    filters: [
      { field: 'user_id', value: req.params.userId },
      { field: 'is_read', value: false },
    ],
  }, 'Error al obtener notificaciones no leídas');
});

// GET una notificación (propietario o admin)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Notificación no encontrada' });
    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && doc.data().user_id !== req.user.uid) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta notificación' });
    }
    res.json({ id: doc.id, ...mapNotificationToResponse(doc.data()) });
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

    const snake = mapNotificationFromRequest({ userId, type, message, title: title || '' });
    const data = {
      ...snake,
      is_read:    false,
      created_at: new Date().toISOString(),
    };

    const ref = await col.add(data);
    const created = { id: ref.id, ...mapNotificationToResponse(data) };
    pushNotification(userId, created);
    sendPush(userId, title || type, message, { type, notificationId: ref.id }).catch(() => {});
    res.status(201).json(created);
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
      const snake = mapNotificationFromRequest({ userId, type, message, title: title || '' });
      const data = { ...snake, is_read: false, created_at: now };
      batch.set(ref, data);
      created.push({ id: ref.id, ...mapNotificationToResponse(data) });
    });

    await batch.commit();
    created.forEach(n => pushNotification(n.userId, n));
    userIds.forEach(uid => sendPush(uid, title || type, message, { type }).catch(() => {}));
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
    if (!roles.includes('admin') && doc.data().user_id !== req.user.uid) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta notificación' });
    }

    await col.doc(req.params.id).update({ is_read: true });
    invalidateCountCache(doc.data().user_id);
    res.json({ id: req.params.id, isRead: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al marcar como leída' });
  }
});

// PATCH marcar todas como leídas por usuario (propio usuario o admin)
router.patch('/user/:userId/read-all', verifyToken, requireSelfOrAdmin('userId'), async (req, res) => {
  try {
    const snap = await col
      .where('user_id', '==', req.params.userId)
      .where('is_read', '==', false)
      .get();

    if (snap.empty) {
      return res.json({ message: 'No hay notificaciones sin leer', count: 0 });
    }

    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref, { is_read: true }));
    await batch.commit();

    invalidateCountCache(req.params.userId);

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
    if (!roles.includes('admin') && doc.data().user_id !== req.user.uid) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta notificación' });
    }

    await col.doc(req.params.id).delete();
    invalidateCountCache(doc.data().user_id);
    res.json({ message: 'Notificación eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar la notificación' });
  }
});

// DELETE eliminar todas las notificaciones de un usuario (propio usuario o admin)
router.delete('/user/:userId', verifyToken, requireSelfOrAdmin('userId'), async (req, res) => {
  try {
    const snap = await col.where('user_id', '==', req.params.userId).get();

    if (snap.empty) {
      return res.json({ message: 'No hay notificaciones para eliminar', count: 0 });
    }

    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();

    invalidateCountCache(req.params.userId);

    res.json({ message: 'Notificaciones eliminadas correctamente', count: snap.docs.length });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar notificaciones del usuario' });
  }
});

module.exports = router;