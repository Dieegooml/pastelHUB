const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

const col = db.collection('reviews');

const VALID_STATUSES = ['pending', 'approved', 'rejected'];

// GET todas las reseñas
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col.orderBy('createdAt', 'desc').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
});

// GET reseñas por pastelería
router.get('/shop/:shopId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col
      .where('shopId', '==', req.params.shopId)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener reseñas de la pastelería' });
  }
});

// GET reseñas por cliente
router.get('/customer/:customerId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col
      .where('customerId', '==', req.params.customerId)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener reseñas del cliente' });
  }
});

// GET reseñas por estado (para moderación)
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
    res.status(500).json({ error: 'Error al filtrar reseñas por estado' });
  }
});

// GET una reseña
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reseña no encontrada' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la reseña' });
  }
});

// POST crear reseña
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { customerId, shopId, orderId, rating, comment } = req.body;

    if (!customerId || !shopId || !orderId || rating === undefined) {
      return res.status(400).json({ error: 'customerId, shopId, orderId y rating son requeridos' });
    }

    if (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating debe ser un número entero entre 1 y 5' });
    }

    // Verificar que la orden existe
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'La orden no existe' });
    }

    // Verificar que la orden fue entregada
    if (orderDoc.data().status !== 'delivered') {
      return res.status(400).json({ error: 'Solo se pueden reseñar órdenes entregadas' });
    }

    // Verificar que la orden no tenga ya una reseña
    const existing = await col.where('orderId', '==', orderId).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'Esta orden ya tiene una reseña registrada' });
    }

    const data = {
      customerId,
      shopId,
      orderId,
      rating:      parseInt(rating),
      comment:     comment || '',
      ownerReply:  '',
      repliedAt:   '',
      status:      'pending',
      createdAt:   new Date().toISOString(),
    };

    const ref = await col.add(data);

    // Recalcular rating promedio de la pastelería
    await recalcShopRating(shopId);

    res.status(201).json({ id: ref.id, ...data });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear la reseña' });
  }
});

// PATCH moderar reseña (aprobar o rechazar)
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reseña no encontrada' });

    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${VALID_STATUSES.join(', ')}` });
    }

    await col.doc(req.params.id).update({ status });

    // Si se aprueba o rechaza, recalcular el rating de la pastelería
    await recalcShopRating(doc.data().shopId);

    res.json({ id: req.params.id, status });
  } catch (e) {
    res.status(500).json({ error: 'Error al moderar la reseña' });
  }
});

// PATCH responder reseña (owner)
router.patch('/:id/reply', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reseña no encontrada' });

    const { ownerReply } = req.body;
    if (!ownerReply) {
      return res.status(400).json({ error: 'ownerReply es requerido' });
    }

    const updates = {
      ownerReply,
      repliedAt: new Date().toISOString(),
    };

    await col.doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al responder la reseña' });
  }
});

// PUT editar reseña (solo comment y rating, solo si está pending)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reseña no encontrada' });

    if (doc.data().status !== 'pending') {
      return res.status(400).json({ error: 'Solo se pueden editar reseñas en estado pending' });
    }

    const { rating, comment } = req.body;

    if (rating !== undefined) {
      if (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'rating debe ser un número entero entre 1 y 5' });
      }
    }

    const updates = {
      ...(rating  !== undefined && { rating: parseInt(rating) }),
      ...(comment !== undefined && { comment }),
    };

    await col.doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al editar la reseña' });
  }
});

// DELETE reseña
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reseña no encontrada' });

    const { shopId } = doc.data();
    await col.doc(req.params.id).delete();

    // Recalcular rating de la pastelería tras eliminar
    await recalcShopRating(shopId);

    res.json({ message: 'Reseña eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar la reseña' });
  }
});

// ── UTILIDAD ──────────────────────────────────────────────────────────

// Recalcula el rating promedio de una pastelería
// considerando solo reseñas aprobadas
async function recalcShopRating(shopId) {
  try {
    const snap = await col
      .where('shopId', '==', shopId)
      .where('status', '==', 'approved')
      .get();

    if (snap.empty) {
      await db.collection('pastryShops').doc(shopId).update({ rating: 0 });
      return;
    }

    const total  = snap.docs.reduce((sum, d) => sum + d.data().rating, 0);
    const avg    = parseFloat((total / snap.docs.length).toFixed(1));
    await db.collection('pastryShops').doc(shopId).update({ rating: avg });
  } catch (e) {
    console.error('Error al recalcular rating:', e);
  }
}

module.exports = router;