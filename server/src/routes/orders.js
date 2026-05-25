const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin, requireCustomer, requireOwnerOrAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createOrderSchema } = require('../validators/orderValidator');

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
router.get('/shop/:shopId', verifyToken, requireOwnerOrAdmin(async (req) => {
  const shopDoc = await db.collection('pastryShops').doc(req.params.shopId).get();
  if (!shopDoc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  return shopDoc.data().owner_id;
}), async (req, res) => {
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

// GET órdenes del usuario autenticado
router.get('/my', verifyToken, requireCustomer, async (req, res) => {
  try {
    const snap = await col
      .where('customer.user_id', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener tus órdenes' });
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