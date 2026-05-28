const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin, requireCustomer, requireOwnerOrAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createOrderSchema } = require('../validators/orderValidator');
const { recalcShopRating } = require('./reviews');
const { paginate } = require('../utils/paginate');

const col = db.collection('orders');

const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'];
const VALID_PAYMENT_METHODS  = ['card', 'cash', 'yape', 'plin'];
const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed'];

// GET todas las órdenes
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await paginate(col, req.query, { orderBy: 'createdAt' });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

// GET órdenes por pastelería
router.get('/shop/:shopId', verifyToken, requireOwnerOrAdmin(async (req) => {
  const shopDoc = await db.collection('pastryShops').doc(req.params.shopId).get();
  if (!shopDoc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  return shopDoc.data().owner_id;
}), async (req, res) => {
  try {
    const result = await paginate(col, req.query, {
      orderBy: 'createdAt', filters: [{ field: 'shop.shop_id', value: req.params.shopId }],
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener órdenes de la pastelería' });
  }
});

// GET órdenes por cliente (propio usuario o admin)
router.get('/customer/:userId', verifyToken, async (req, res) => {
  try {
    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && req.user.uid !== req.params.userId) {
      return res.status(403).json({ error: 'Solo puedes ver tus propias órdenes' });
    }
    const result = await paginate(col, req.query, {
      orderBy: 'createdAt', filters: [{ field: 'customer.user_id', value: req.params.userId }],
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener órdenes del cliente' });
  }
});

// GET órdenes por estado
router.get('/status/:status', verifyToken, requireAdmin, async (req, res) => {
  try {
    if (!VALID_STATUSES.includes(req.params.status)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${VALID_STATUSES.join(', ')}` });
    }
    const result = await paginate(col, req.query, {
      orderBy: 'createdAt', filters: [{ field: 'status', value: req.params.status }],
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al filtrar órdenes por estado' });
  }
});

// GET órdenes del usuario autenticado
router.get('/my', verifyToken, requireCustomer, async (req, res) => {
  try {
    const result = await paginate(col, req.query, {
      orderBy: 'createdAt', filters: [{ field: 'customer.user_id', value: req.user.uid }],
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener tus órdenes' });
  }
});

// GET una orden (admin, dueño de la orden, o dueño de la pastelería)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Orden no encontrada' });

    const roles = req.user?.roles || [];
    const isAdmin = roles.includes('admin');
    const isOwner = doc.data().customer?.user_id === req.user.uid;
    let isShopOwner = false;

    if (!isAdmin && !isOwner) {
      const shopId = doc.data().shop?.shop_id;
      if (shopId) {
        const shopDoc = await db.collection('pastryShops').doc(shopId).get();
        if (shopDoc.exists && shopDoc.data().owner_id === req.user.uid) {
          isShopOwner = true;
        }
      }
    }

    if (!isAdmin && !isOwner && !isShopOwner) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta orden' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la orden' });
  }
});

// POST crear orden
router.post('/', verifyToken, validate(createOrderSchema), requireCustomer, async (req, res) => {
  try {
    const {
      customer, shop, items,
      totals, payment,
    } = req.body;

    if (!customer?.user_id || !shop?.shop_id || !items?.length || !payment?.method) {
      return res.status(400).json({
        error: 'customer.user_id, shop.shop_id, items y payment.method son requeridos',
      });
    }

    if (!VALID_PAYMENT_METHODS.includes(payment.method)) {
      return res.status(400).json({ error: `Método de pago inválido. Válidos: ${VALID_PAYMENT_METHODS.join(', ')}` });
    }

    // Verificar que el usuario existe
    const userDoc = await db.collection('users').doc(customer.user_id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'El cliente no existe' });
    }

    // Verificar que la pastelería existe
    const shopDoc = await db.collection('pastryShops').doc(shop.shop_id).get();
    if (!shopDoc.exists) {
      return res.status(404).json({ error: 'La pastelería no existe' });
    }

    const subtotal    = parseFloat(totals?.subtotal)    || 0;
    const deliveryFee = parseFloat(totals?.delivery_fee) || 0;

    const data = {
      customer: {
        user_id: customer.user_id,
        name:    userDoc.data().full_name || '',
      },
      shop: {
        shop_id: shop.shop_id,
        name:    shopDoc.data().name || '',
      },
      status:         'pending',
      status_history: ['pending'],
      items: items.map(item => ({
        product_id:       item.product_id       || '',
        name:             item.name             || '',
        quantity:         parseInt(item.quantity),
        price_at_purchase: parseFloat(item.price_at_purchase),
      })),
      totals: {
        subtotal,
        delivery_fee: deliveryFee,
        total:        subtotal + deliveryFee,
      },
      payment: {
        method:          payment.method,
        status:          'pending',
        transaction_ref: payment.transaction_ref || '',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = await col.add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear la orden' });
  }
});

// PATCH cancelar orden (cliente autenticado, solo si está pendiente)
router.patch('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Orden no encontrada' });

    // Solo el dueño de la orden puede cancelar
    if (doc.data().customer?.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Solo puedes cancelar tus propias órdenes' });
    }

    if (doc.data().status !== 'pending') {
      return res.status(400).json({ error: 'Solo se pueden cancelar órdenes pendientes' });
    }

    const status_history = doc.data().status_history || [];
    status_history.push('cancelled');

    await col.doc(req.params.id).update({
      status: 'cancelled',
      status_history,
      updatedAt: new Date().toISOString(),
    });

    res.json({ id: req.params.id, status: 'cancelled', status_history });
  } catch (e) {
    res.status(500).json({ error: 'Error al cancelar la orden' });
  }
});

// PATCH actualizar estado de la orden
router.patch('/:id/status', verifyToken, requireOwnerOrAdmin(async (req) => {
  const orderDoc = await col.doc(req.params.id).get();
  if (!orderDoc.exists) throw Object.assign(new Error('Orden no encontrada'), { status: 404 });
  const shopId = orderDoc.data().shop?.shop_id;
  if (!shopId) throw Object.assign(new Error('La orden no tiene pastelería asociada'), { status: 400 });
  const shopDoc = await db.collection('pastryShops').doc(shopId).get();
  if (!shopDoc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  return shopDoc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Orden no encontrada' });

    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${VALID_STATUSES.join(', ')}` });
    }

    // Agregar el nuevo estado al historial
    const status_history = doc.data().status_history || [];
    status_history.push(status);

    await col.doc(req.params.id).update({
      status,
      status_history,
      updatedAt: new Date().toISOString(),
    });

    res.json({ id: req.params.id, status, status_history });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// PATCH actualizar estado del pago
router.patch('/:id/payment-status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Orden no encontrada' });

    const { status, transaction_ref } = req.body;
    if (!VALID_PAYMENT_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${VALID_PAYMENT_STATUSES.join(', ')}` });
    }

    const payment = doc.data().payment || {};
    const updatedPayment = {
      ...payment,
      status,
      ...(transaction_ref !== undefined && { transaction_ref }),
    };

    await col.doc(req.params.id).update({
      payment:   updatedPayment,
      updatedAt: new Date().toISOString(),
    });

    res.json({ id: req.params.id, payment: updatedPayment });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar estado del pago' });
  }
});

// PATCH agregar reseña a una orden (cliente autenticado)
router.patch('/:id/review', verifyToken, requireCustomer, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Orden no encontrada' });

    // Solo el dueño de la orden puede reseñar
    if (doc.data().customer?.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Solo puedes reseñar tus propias órdenes' });
    }

    if (doc.data().status !== 'delivered') {
      return res.status(400).json({ error: 'Solo se pueden reseñar órdenes entregadas' });
    }

    // Verificar que la orden no tenga ya una reseña embebida
    if (doc.data().review?.rating !== undefined && doc.data().review?.rating > 0) {
      return res.status(400).json({ error: 'Esta orden ya tiene una reseña' });
    }

    const { rating, comment } = req.body;
    if (rating === undefined) {
      return res.status(400).json({ error: 'rating es requerido' });
    }

    const parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
      return res.status(400).json({ error: 'rating debe ser un número entero entre 0 y 5' });
    }

    const shopId = doc.data().shop?.shop_id;
    const reviewEmbed = {
      rating: parsedRating,
      comment: comment || '',
      reply_text: '',
      replied_at: '',
      created_at: new Date().toISOString(),
    };

    // Actualizar la orden con la reseña embebida
    await col.doc(req.params.id).update({ review: reviewEmbed, updatedAt: new Date().toISOString() });

    // Crear el documento en la colección reviews para el rating del shop
    const reviewsCol = db.collection('reviews');
    const existingReview = await reviewsCol.where('orderId', '==', req.params.id).limit(1).get();
    if (existingReview.empty) {
      await reviewsCol.add({
        customerId: req.user.uid,
        shopId,
        orderId: req.params.id,
        rating: parsedRating,
        comment: comment || '',
        ownerReply: '',
        repliedAt: '',
        status: 'approved',
        createdAt: new Date().toISOString(),
      });
    }

    // Recalcular rating de la pastelería
    if (shopId) {
      await recalcShopRating(shopId);
    }

    res.json({ id: req.params.id, review: reviewEmbed });
  } catch (e) {
    res.status(500).json({ error: 'Error al agregar reseña' });
  }
});

// PATCH responder reseña de una orden (owner/admin)
router.patch('/:id/review/reply', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Orden no encontrada' });

    if (!doc.data().review?.rating && doc.data().review?.rating !== 0) {
      return res.status(400).json({ error: 'Esta orden no tiene una reseña' });
    }

    // Verificar permisos: admin o dueño de la pastelería
    const roles = req.user?.roles || [];
    let authorized = roles.includes('admin');
    if (!authorized) {
      const shopId = doc.data().shop?.shop_id;
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

    const { reply_text } = req.body;
    if (!reply_text) {
      return res.status(400).json({ error: 'reply_text es requerido' });
    }

    const reviewEmbed = {
      ...doc.data().review,
      reply_text,
      replied_at: new Date().toISOString(),
    };

    await col.doc(req.params.id).update({ review: reviewEmbed, updatedAt: new Date().toISOString() });

    // También actualizar en la colección reviews
    const reviewsCol = db.collection('reviews');
    const existingReview = await reviewsCol.where('orderId', '==', req.params.id).limit(1).get();
    if (!existingReview.empty) {
      await existingReview.docs[0].ref.update({
        ownerReply: reply_text,
        repliedAt: new Date().toISOString(),
      });
    }

    res.json({ id: req.params.id, review: reviewEmbed });
  } catch (e) {
    res.status(500).json({ error: 'Error al responder la reseña' });
  }
});

// DELETE orden
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Orden no encontrada' });

    const { status } = doc.data();
    if (['preparing', 'on_the_way', 'delivered'].includes(status)) {
      return res.status(400).json({ error: `No se puede eliminar una orden en estado ${status}` });
    }

    await col.doc(req.params.id).delete();
    res.json({ message: 'Orden eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar la orden' });
  }
});

module.exports = router;