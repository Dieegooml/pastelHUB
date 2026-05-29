const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin, requireCustomer, requireOwnerOrAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createOrderSchema } = require('../validators/orderValidator');
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

// GET resumen / estadísticas de una pastelería
router.get('/shop/:shopId/summary', verifyToken, requireOwnerOrAdmin(async (req) => {
  const shopDoc = await db.collection('pastryShops').doc(req.params.shopId).get();
  if (!shopDoc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  return shopDoc.data().owner_id;
}), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const snap = await col
      .where('shop.shop_id', '==', req.params.shopId)
      .where('createdAt', '>=', cutoff.toISOString())
      .get();

    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Totals
    const totalOrders = orders.length;
    const delivered = orders.filter((o) => o.status === 'delivered');
    const cancelled = orders.filter((o) => o.status === 'cancelled');
    const totalRevenue = delivered.reduce((sum, o) => sum + (o.totals?.total || 0), 0);

    // Orders by status
    const ordersByStatus = {};
    for (const s of ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled']) {
      ordersByStatus[s] = orders.filter((o) => o.status === s).length;
    }

    // Daily sales
    const dailyMap = {};
    for (const o of delivered) {
      const d = o.createdAt ? o.createdAt.slice(0, 10) : 'unknown';
      if (!dailyMap[d]) dailyMap[d] = { date: d, revenue: 0, orders: 0 };
      dailyMap[d].revenue += o.totals?.total || 0;
      dailyMap[d].orders += 1;
    }
    const dailySales = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Today / week / month
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const revenueToday = delivered
      .filter((o) => o.createdAt?.slice(0, 10) === todayStr)
      .reduce((s, o) => s + (o.totals?.total || 0), 0);
    const revenueThisWeek = delivered
      .filter((o) => o.createdAt >= weekStart.toISOString())
      .reduce((s, o) => s + (o.totals?.total || 0), 0);
    const revenueThisMonth = delivered
      .filter((o) => o.createdAt >= monthStart.toISOString())
      .reduce((s, o) => s + (o.totals?.total || 0), 0);

    // Top products (only from delivered orders)
    const productMap = {};
    for (const o of delivered) {
      for (const item of o.items || []) {
        const key = item.product_id || item.name;
        if (!productMap[key]) {
          productMap[key] = { name: item.name || key, product_id: item.product_id, quantity: 0, revenue: 0 };
        }
        productMap[key].quantity += item.quantity || 0;
        productMap[key].revenue += (item.price_at_purchase || 0) * (item.quantity || 0);
      }
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Revenue by payment method
    const revenueByMethod = {};
    for (const o of delivered) {
      const method = o.payment?.method || 'unknown';
      revenueByMethod[method] = (revenueByMethod[method] || 0) + (o.totals?.total || 0);
    }

    // Monthly revenue (for charts)
    const monthlyMap = {};
    for (const o of delivered) {
      if (!o.createdAt) continue;
      const m = o.createdAt.slice(0, 7);
      if (!monthlyMap[m]) monthlyMap[m] = { month: m, revenue: 0, orders: 0 };
      monthlyMap[m].revenue += o.totals?.total || 0;
      monthlyMap[m].orders += 1;
    }
    const monthlyRevenue = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      avgOrderValue: totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0,
      revenueToday: parseFloat(revenueToday.toFixed(2)),
      revenueThisWeek: parseFloat(revenueThisWeek.toFixed(2)),
      revenueThisMonth: parseFloat(revenueThisMonth.toFixed(2)),
      ordersByStatus,
      dailySales,
      topProducts,
      revenueByMethod,
      monthlyRevenue,
    });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener resumen de la pastelería' });
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