const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

const col = db.collection('reports');

const VALID_TARGET_TYPES = ['review', 'shop', 'product'];
const VALID_STATUSES     = ['open', 'resolved', 'dismissed'];

// GET todos los reportes
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col.orderBy('createdAt', 'desc').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
});

// GET reportes por estado
router.get('/status/:status', verifyToken, requireAdmin, async (req, res) => {
  try {
    if (!VALID_STATUSES.includes(req.params.status)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${VALID_STATUSES.join(', ')}` });
    }
    const snap = await col
      .where('status', '==', req.params.status)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al filtrar reportes por estado' });
  }
});

// GET reportes por tipo de objetivo
router.get('/target/:targetType', verifyToken, requireAdmin, async (req, res) => {
  try {
    if (!VALID_TARGET_TYPES.includes(req.params.targetType)) {
      return res.status(400).json({ error: `Tipo inválido. Válidos: ${VALID_TARGET_TYPES.join(', ')}` });
    }
    const snap = await col
      .where('targetType', '==', req.params.targetType)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al filtrar reportes por tipo' });
  }
});

// GET reportes asignados a un moderador
router.get('/moderator/:moderatorId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col
      .where('assignedTo', '==', req.params.moderatorId)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener reportes del moderador' });
  }
});

// GET reportes hechos por un usuario
router.get('/user/:userId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col
      .where('reportedBy', '==', req.params.userId)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener reportes del usuario' });
  }
});

// GET un reporte
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reporte no encontrado' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener el reporte' });
  }
});

// POST crear reporte
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { reportedBy, targetType, targetId, reason } = req.body;

    if (!reportedBy || !targetType || !targetId || !reason) {
      return res.status(400).json({ error: 'reportedBy, targetType, targetId y reason son requeridos' });
    }

    if (!VALID_TARGET_TYPES.includes(targetType)) {
      return res.status(400).json({ error: `targetType inválido. Válidos: ${VALID_TARGET_TYPES.join(', ')}` });
    }

    // Verificar que el usuario que reporta existe
    const userDoc = await db.collection('users').doc(reportedBy).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'El usuario que reporta no existe' });
    }

    // Verificar que el objetivo existe según su tipo
    const targetCollections = {
      review:  'reviews',
      shop:    'pastryShops',
      product: 'products',
    };
    const targetDoc = await db.collection(targetCollections[targetType]).doc(targetId).get();
    if (!targetDoc.exists) {
      return res.status(404).json({ error: `El ${targetType} reportado no existe` });
    }

    // Verificar que el usuario no haya reportado ya el mismo objetivo
    const existing = await col
      .where('reportedBy', '==', reportedBy)
      .where('targetId',   '==', targetId)
      .limit(1)
      .get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'Ya has reportado este contenido anteriormente' });
    }

    const data = {
      reportedBy,
      targetType,
      targetId,
      reason,
      status:      'open',
      assignedTo:  '',
      createdAt:   new Date().toISOString(),
      resolvedAt:  '',
    };

    const ref = await col.add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear el reporte' });
  }
});

// PATCH asignar reporte a un moderador
router.patch('/:id/assign', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reporte no encontrado' });

    if (doc.data().status !== 'open') {
      return res.status(400).json({ error: 'Solo se pueden asignar reportes en estado open' });
    }

    const { moderatorId } = req.body;
    if (!moderatorId) {
      return res.status(400).json({ error: 'moderatorId es requerido' });
    }

    // Verificar que el usuario tiene rol moderator
    const modDoc = await db.collection('users').doc(moderatorId).get();
    if (!modDoc.exists) {
      return res.status(404).json({ error: 'El moderador no existe' });
    }
    if (!modDoc.data().roles?.includes('moderator')) {
      return res.status(400).json({ error: 'El usuario no tiene rol de moderador' });
    }

    await col.doc(req.params.id).update({ assignedTo: moderatorId });
    res.json({ id: req.params.id, assignedTo: moderatorId });
  } catch (e) {
    res.status(500).json({ error: 'Error al asignar el reporte' });
  }
});

// PATCH resolver o desestimar reporte
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reporte no encontrado' });

    if (doc.data().status !== 'open') {
      return res.status(400).json({ error: 'El reporte ya fue resuelto o desestimado' });
    }

    const { status } = req.body;
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido. Válidos: resolved, dismissed' });
    }

    const updates = {
      status,
      resolvedAt: new Date().toISOString(),
    };

    await col.doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar estado del reporte' });
  }
});

// PUT editar reporte (solo reason, solo si está open)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reporte no encontrado' });

    if (doc.data().status !== 'open') {
      return res.status(400).json({ error: 'Solo se pueden editar reportes en estado open' });
    }

    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'reason es requerido' });
    }

    await col.doc(req.params.id).update({ reason });
    res.json({ id: req.params.id, reason });
  } catch (e) {
    res.status(500).json({ error: 'Error al editar el reporte' });
  }
});

// DELETE reporte (solo si está open)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reporte no encontrado' });

    if (doc.data().status !== 'open') {
      return res.status(400).json({ error: 'Solo se pueden eliminar reportes en estado open' });
    }

    await col.doc(req.params.id).delete();
    res.json({ message: 'Reporte eliminado correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar el reporte' });
  }
});

module.exports = router;