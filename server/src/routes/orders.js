const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

const col = db.collection('orders');

const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'];
const VALID_PAYMENT_METHODS  = ['card', 'cash', 'yape', 'plin'];
const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed'];

// GET todas las órdenes
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col.orderBy('createdAt', 'desc').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

// GET órdenes por pastelería
router.get('/shop/:shopId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col
      .where('shop.shop_id', '==', req.params.shopId)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener órdenes de la pastelería' });
  }
});

// GET órdenes por cliente
router.get('/customer/:userId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col
      .where('customer.user_id', '==', req.params.userId)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
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
    const snap = await col
      .where('status', '==', req.params.status)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al filtrar órdenes por estado' });
  }
});

// GET una orden
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la orden' });
  }
});

// POST crear orden
router.post('/', verifyToken, requireAdmin, async (req, res) => {
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
      review: {
        rating:     0,
        comment:    '',
        reply_text: '',
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

// PATCH actualizar estado de la orden
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
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

// PATCH agregar reseña a la orden
router.patch('/:id/review', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Orden no encontrada' });

    if (doc.data().status !== 'delivered') {
      return res.status(400).json({ error: 'Solo se pueden reseñar órdenes entregadas' });
    }

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating debe ser un número entre 1 y 5' });
    }

    // Verificar que no tenga ya una reseña
    const currentReview = doc.data().review || {};
    if (currentReview.rating > 0) {
      return res.status(400).json({ error: 'Esta orden ya tiene una reseña' });
    }

    const review = {
      rating:     parseInt(rating),
      comment:    comment    || '',
      reply_text: '',
    };

    await col.doc(req.params.id).update({
      review,
      updatedAt: new Date().toISOString(),
    });

    res.json({ id: req.params.id, review });
  } catch (e) {
    res.status(500).json({ error: 'Error al agregar reseña' });
  }
});

// PATCH responder reseña
router.patch('/:id/review/reply', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Orden no encontrada' });

    const { reply_text } = req.body;
    if (!reply_text) {
      return res.status(400).json({ error: 'reply_text es requerido' });
    }

    const review = doc.data().review || {};
    if (!review.rating) {
      return res.status(400).json({ error: 'Esta orden no tiene reseña aún' });
    }

    const updatedReview = { ...review, reply_text };
    await col.doc(req.params.id).update({
      review:    updatedReview,
      updatedAt: new Date().toISOString(),
    });

    res.json({ id: req.params.id, review: updatedReview });
  } catch (e) {
    res.status(500).json({ error: 'Error al responder reseña' });
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