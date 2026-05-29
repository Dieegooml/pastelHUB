const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin, requireModerator, requireCustomer } = require('../middlewares/auth');
const { paginate } = require('../utils/paginate');

const col = db.collection('reviews');

const VALID_STATUSES = ['pending', 'approved', 'rejected'];

// GET todas las reseñas
router.get('/', verifyToken, requireModerator, async (req, res) => {
  try {
    const result = await paginate(col, req.query, { orderBy: 'createdAt' });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
});

// GET reseñas por pastelería (público)
router.get('/shop/:shopId', async (req, res) => {
  try {
    const result = await paginate(col, req.query, {
      orderBy: 'createdAt',
      filters: [
        { field: 'shopId', value: req.params.shopId },
        { field: 'status', value: 'approved' },
      ],
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener reseñas de la pastelería' });
  }
});

// GET reseñas por cliente (propio usuario o admin)
router.get('/customer/:customerId', verifyToken, async (req, res) => {
  try {
    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && req.user.uid !== req.params.customerId) {
      return res.status(403).json({ error: 'Solo puedes ver tus propias reseñas' });
    }
    const result = await paginate(col, req.query, {
      orderBy: 'createdAt', filters: [{ field: 'customerId', value: req.params.customerId }],
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener reseñas del cliente' });
  }
});

// GET reseñas por estado (para moderación)
router.get('/status/:status', verifyToken, requireModerator, async (req, res) => {
  try {
    if (!VALID_STATUSES.includes(req.params.status)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${VALID_STATUSES.join(', ')}` });
    }
    const result = await paginate(col, req.query, {
      orderBy: 'createdAt', filters: [{ field: 'status', value: req.params.status }],
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al filtrar reseñas por estado' });
  }
});

// GET reseña por ID de orden
router.get('/by-order/:orderId', verifyToken, async (req, res) => {
  try {
    const snap = await col.where('orderId', '==', req.params.orderId).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'Reseña no encontrada para esta orden' });
    const doc = snap.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la reseña' });
  }
});

// GET una reseña (autor, dueño de la pastelería o admin)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reseña no encontrada' });
    const roles = req.user?.roles || [];
    if (!roles.includes('admin')) {
      const data = doc.data();
      const isAuthor = data.customerId === req.user.uid;
      const isShopOwner = data.shopId
        ? await db.collection('pastryShops').doc(data.shopId).get().then(s => s.exists && s.data().owner_id === req.user.uid)
        : false;
      if (!isAuthor && !isShopOwner) {
        return res.status(403).json({ error: 'No tienes permiso para ver esta reseña' });
      }
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la reseña' });
  }
});

// POST crear reseña (cliente autenticado)
router.post('/', verifyToken, requireCustomer, async (req, res) => {
  try {
    const { shopId, orderId, rating, comment } = req.body;

    if (!shopId || !orderId || rating === undefined) {
      return res.status(400).json({ error: 'shopId, orderId y rating son requeridos' });
    }

    const parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
      return res.status(400).json({ error: 'rating debe ser un número entero entre 0 y 5' });
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

    // Verificar que la orden pertenece al usuario autenticado
    if (orderDoc.data().customer?.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Solo puedes reseñar tus propias órdenes' });
    }

    // Verificar que la orden no tenga ya una reseña
    const existing = await col.where('orderId', '==', orderId).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'Esta orden ya tiene una reseña registrada' });
    }

    const data = {
      customerId:  req.user.uid,
      shopId,
      orderId,
      rating:      parsedRating,
      comment:     comment || '',
      ownerReply:  '',
      repliedAt:   '',
      status:      'approved',
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
router.patch('/:id/status', verifyToken, requireModerator, async (req, res) => {
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

// PATCH responder reseña (owner/admin — verifica que el usuario sea dueño de la pastelería o admin)
router.patch('/:id/reply', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reseña no encontrada' });

    const roles = req.user?.roles || [];
    let authorized = roles.includes('admin');
    if (!authorized) {
      const shopId = doc.data().shopId;
      if (shopId) {
        const shopDoc = await db.collection('pastryShops').doc(shopId).get();
        if (shopDoc.exists && shopDoc.data().owner_id === req.user.uid) {
          authorized = true;
        }
      }
    }

    if (!authorized) {
      return res.status(403).json({ error: 'Solo el dueño de la pastelería o un admin puede responder' });
    }

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
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reseña no encontrada' });

    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && doc.data().customerId !== req.user.uid) {
      return res.status(403).json({ error: 'Solo puedes editar tus propias reseñas' });
    }

    if (doc.data().status !== 'pending') {
      return res.status(400).json({ error: 'Solo se pueden editar reseñas en estado pending' });
    }

    const { rating, comment } = req.body;

    if (rating !== undefined) {
      const parsed = parseInt(rating);
      if (isNaN(parsed) || parsed < 0 || parsed > 5) {
        return res.status(400).json({ error: 'rating debe ser un número entero entre 0 y 5' });
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
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Reseña no encontrada' });

    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && doc.data().customerId !== req.user.uid) {
      return res.status(403).json({ error: 'Solo puedes eliminar tus propias reseñas' });
    }

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
module.exports.recalcShopRating = recalcShopRating;