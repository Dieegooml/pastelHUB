const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

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
  try {
    const snap = await col.orderBy('createdAt', 'desc').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// GET notificaciones por usuario
router.get('/user/:userId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col
      .where('userId', '==', req.params.userId)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener notificaciones del usuario' });
  }
});

// GET notificaciones no leídas por usuario
router.get('/user/:userId/unread', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col
      .where('userId', '==', req.params.userId)
      .where('isRead', '==', false)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener notificaciones no leídas' });
  }
});

// GET una notificación
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la notificación' });
  }
});

// POST crear notificación
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId, type, message } = req.body;

    if (!userId || !type || !message) {
      return res.status(400).json({ error: 'userId, type y message son requeridos' });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `Tipo inválido. Válidos: ${VALID_TYPES.join(', ')}` });
    }

    // Verificar que el usuario existe
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'El usuario no existe' });
    }

    const data = {
      userId,
      type,
      message,
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
router.post('/bulk', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userIds, type, message } = req.body;

    if (!userIds?.length || !type || !message) {
      return res.status(400).json({ error: 'userIds, type y message son requeridos' });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `Tipo inválido. Válidos: ${VALID_TYPES.join(', ')}` });
    }

    if (userIds.length > 500) {
      return res.status(400).json({ error: 'Máximo 500 usuarios por envío masivo' });
    }

    const batch    = db.batch();
    const now      = new Date().toISOString();
    const created  = [];

    userIds.forEach(userId => {
      const ref = col.doc();
      const data = { userId, type, message, isRead: false, createdAt: now };
      batch.set(ref, data);
      created.push({ id: ref.id, ...data });
    });

    await batch.commit();
    res.status(201).json({ count: created.length, notifications: created });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear notificaciones masivas' });
  }
});

// PATCH marcar como leída
router.patch('/:id/read', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Notificación no encontrada' });

    await col.doc(req.params.id).update({ isRead: true });
    res.json({ id: req.params.id, isRead: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al marcar como leída' });
  }
});

// PATCH marcar todas como leídas por usuario
router.patch('/user/:userId/read-all', verifyToken, requireAdmin, async (req, res) => {
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

// DELETE una notificación
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Notificación no encontrada' });

    await col.doc(req.params.id).delete();
    res.json({ message: 'Notificación eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar la notificación' });
  }
});

// DELETE eliminar todas las notificaciones de un usuario
router.delete('/user/:userId', verifyToken, requireAdmin, async (req, res) => {
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