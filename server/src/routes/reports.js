const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin, requireModerator } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createReportSchema, assignReportSchema, updateReportStatusSchema, editReportSchema } = require('../validators/reportValidator');
const { paginate, tryPaginate } = require('../utils/paginate');

const col = db.collection('reports');

const VALID_TARGET_TYPES = ['review', 'shop', 'product'];
const VALID_STATUSES     = ['open', 'resolved', 'dismissed'];

// GET todos los reportes (admin/moderator)
router.get('/', verifyToken, requireModerator, async (req, res) => {
  await tryPaginate(res, col, req.query, { orderBy: 'createdAt' }, 'Error al obtener reportes');
});

// GET reportes por estado (admin/moderator)
router.get('/status/:status', verifyToken, requireModerator, async (req, res) => {
  if (!VALID_STATUSES.includes(req.params.status)) {
    return res.status(400).json({ error: `Estado inválido. Válidos: ${VALID_STATUSES.join(', ')}` });
  }
  await tryPaginate(res, col, req.query, {
    orderBy: 'createdAt', filters: [{ field: 'status', value: req.params.status }],
  }, 'Error al filtrar reportes por estado');
});

// GET reportes por tipo de objetivo (admin/moderator)
router.get('/target/:targetType', verifyToken, requireModerator, async (req, res) => {
  if (!VALID_TARGET_TYPES.includes(req.params.targetType)) {
    return res.status(400).json({ error: `Tipo inválido. Válidos: ${VALID_TARGET_TYPES.join(', ')}` });
  }
  await tryPaginate(res, col, req.query, {
    orderBy: 'createdAt', filters: [{ field: 'targetType', value: req.params.targetType }],
  }, 'Error al filtrar reportes por tipo');
});

// GET reportes asignados a un moderador (propio moderador o admin)
router.get('/moderator/:moderatorId', verifyToken, async (req, res) => {
  const roles = req.user?.roles || [];
  if (!roles.includes('admin') && !roles.includes('moderator') && req.user.uid !== req.params.moderatorId) {
    return res.status(403).json({ error: 'No tienes permiso' });
  }
  await tryPaginate(res, col, req.query, {
    orderBy: 'createdAt', filters: [{ field: 'assignedTo', value: req.params.moderatorId }],
  }, 'Error al obtener reportes del moderador');
});

// GET reportes hechos por un usuario (propio usuario o admin/moderator)
router.get('/user/:userId', verifyToken, async (req, res) => {
  const roles = req.user?.roles || [];
  if (!roles.includes('admin') && !roles.includes('moderator') && req.user.uid !== req.params.userId) {
    return res.status(403).json({ error: 'Solo puedes ver tus propios reportes' });
  }
  await tryPaginate(res, col, req.query, {
    orderBy: 'createdAt', filters: [{ field: 'reportedBy', value: req.params.userId }],
  }, 'Error al obtener reportes del usuario');
});

// GET un reporte (reporter/moderator/admin)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reporte no encontrado' });
    const roles = req.user?.roles || [];
    const data = doc.data();
    if (!roles.includes('admin') && !roles.includes('moderator') && data.reportedBy !== req.user.uid) {
      return res.status(403).json({ error: 'No tienes permiso para ver este reporte' });
    }
    res.json({ id: doc.id, ...data });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener el reporte' });
  }
});

// POST crear reporte (cualquier usuario autenticado)
router.post('/', verifyToken, validate(createReportSchema), async (req, res) => {
  try {
    const { targetType, targetId, reason } = req.body;

    const reportedBy = req.user.uid;

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

// PATCH asignar reporte (admin o moderador puede asignarse a sí mismo)
router.patch('/:id/assign', verifyToken, validate(assignReportSchema), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reporte no encontrado' });

    if (doc.data().status !== 'open') {
      return res.status(400).json({ error: 'Solo se pueden asignar reportes en estado open' });
    }

    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && !roles.includes('moderator')) {
      return res.status(403).json({ error: 'Solo admins o moderadores pueden asignar reportes' });
    }

    const { moderatorId } = req.body;

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

// PATCH resolver o desestimar reporte (admin o moderator asignado)
router.patch('/:id/status', verifyToken, validate(updateReportStatusSchema), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reporte no encontrado' });

    if (doc.data().status !== 'open') {
      return res.status(400).json({ error: 'El reporte ya fue resuelto o desestimado' });
    }

    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && !roles.includes('moderator')) {
      return res.status(403).json({ error: 'Solo admins o moderadores pueden modificar reportes' });
    }

    const { status } = req.body;

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

// PUT editar reporte (solo el reporter si está open)
router.put('/:id', verifyToken, validate(editReportSchema), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reporte no encontrado' });

    const data = doc.data();
    if (data.status !== 'open') {
      return res.status(400).json({ error: 'Solo se pueden editar reportes en estado open' });
    }

    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && data.reportedBy !== req.user.uid) {
      return res.status(403).json({ error: 'Solo el autor puede editar su reporte' });
    }

    const { reason } = req.body;

    await col.doc(req.params.id).update({ reason });
    res.json({ id: req.params.id, reason });
  } catch (e) {
    res.status(500).json({ error: 'Error al editar el reporte' });
  }
});

// DELETE reporte (solo el reporter si está open)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reporte no encontrado' });

    const data = doc.data();
    if (data.status !== 'open') {
      return res.status(400).json({ error: 'Solo se pueden eliminar reportes en estado open' });
    }

    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && data.reportedBy !== req.user.uid) {
      return res.status(403).json({ error: 'Solo el autor puede eliminar su reporte' });
    }

    await col.doc(req.params.id).delete();
    res.json({ message: 'Reporte eliminado correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar el reporte' });
  }
});

module.exports = router;