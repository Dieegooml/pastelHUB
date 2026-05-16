const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

const col = db.collection('orders');

const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'];
const VALID_DELIVERY_TYPES = ['delivery', 'pickup'];

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
      .where('shopId', '==', req.params.shopId)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener órdenes de la pastelería' });
  }
});

// GET órdenes por cliente
router.get('/customer/:customerId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col
      .where('customerId', '==', req.params.customerId)
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

// GET una orden con sus items
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Orden no encontrada' });

    // Traer items de la subcolección
    const itemsSnap = await col.doc(req.params.id).collection('items').get();
    const items = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.json({ id: doc.id, ...doc.data(), items });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la orden' });
  }
});

// POST crear orden
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      customerId, shopId, addressId,
      deliveryType, scheduledAt, notes,
      subtotal, deliveryFee, items,
    } = req.body;

    if (!customerId || !shopId || !deliveryType || !items?.length) {
      return res.status(400).json({ error: 'customerId, shopId, deliveryType e items son requeridos' });
    }

    if (!VALID_DELIVERY_TYPES.includes(deliveryType)) {
      return res.status(400).json({ error: `deliveryType inválido. Válidos: ${VALID_DELIVERY_TYPES.join(', ')}` });
    }

    // Verificar que la pastelería existe
    const shopDoc = await db.collection('pastryShops').doc(shopId).get();
    if (!shopDoc.exists) {
      return res.status(404).json({ error: 'La pastelería no existe' });
    }

    const parsedSubtotal  = parseFloat(subtotal)    || 0;
    const parsedFee       = parseFloat(deliveryFee) || 0;
    const total           = parsedSubtotal + parsedFee;

    const orderData = {
      customerId,
      shopId,
      addressId:    addressId   || '',
      status:       'pending',
      deliveryType,
      scheduledAt:  scheduledAt || '',
      subtotal:     parsedSubtotal,
      deliveryFee:  parsedFee,
      total,
      notes:        notes       || '',
      createdAt:    new Date().toISOString(),
      updatedAt:    new Date().toISOString(),
    };

    // Crear orden e items en batch
    const orderRef = col.doc();
    const batch = db.batch();
    batch.set(orderRef, orderData);

    items.forEach(item => {
      const itemRef = orderRef.collection('items').doc();
      const itemSubtotal = parseFloat(item.unitPrice) * parseInt(item.quantity);
      batch.set(itemRef, {
        productId:          item.productId          || '',
        quantity:           parseInt(item.quantity),
        unitPrice:          parseFloat(item.unitPrice),
        subtotal:           itemSubtotal,
        customizationNotes: item.customizationNotes || '',
      });
    });

    await batch.commit();
    res.status(201).json({ id: orderRef.id, ...orderData });
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

    await col.doc(req.params.id).update({ status, updatedAt: new Date().toISOString() });
    res.json({ id: req.params.id, status });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar estado de la orden' });
  }
});

// PUT actualizar orden (solo campos editables, no items)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Orden no encontrada' });

    // No permitir cambiar campos críticos por PUT
    const { customerId, shopId, items, createdAt, ...rest } = req.body;

    const updates = { ...rest, updatedAt: new Date().toISOString() };
    await col.doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar la orden' });
  }
});

// DELETE orden (y sus items)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Orden no encontrada' });

    // Eliminar items y orden en batch
    const itemsSnap = await col.doc(req.params.id).collection('items').get();
    const batch = db.batch();
    itemsSnap.docs.forEach(item => batch.delete(item.ref));
    batch.delete(col.doc(req.params.id));
    await batch.commit();

    res.json({ message: 'Orden e items eliminados correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar la orden' });
  }
});

// ── ITEMS (subcolección) ──────────────────────────────────────────────

// GET items de una orden
router.get('/:id/items', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col.doc(req.params.id).collection('items').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener items' });
  }
});

// POST agregar item a una orden pendiente
router.post('/:id/items', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Orden no encontrada' });
    if (doc.data().status !== 'pending') {
      return res.status(400).json({ error: 'Solo se pueden agregar items a órdenes pendientes' });
    }

    const { productId, quantity, unitPrice, customizationNotes } = req.body;
    if (!productId || !quantity || !unitPrice) {
      return res.status(400).json({ error: 'productId, quantity y unitPrice son requeridos' });
    }

    const itemData = {
      productId,
      quantity:           parseInt(quantity),
      unitPrice:          parseFloat(unitPrice),
      subtotal:           parseFloat(unitPrice) * parseInt(quantity),
      customizationNotes: customizationNotes || '',
    };

    const ref = await col.doc(req.params.id).collection('items').add(itemData);
    res.status(201).json({ id: ref.id, ...itemData });
  } catch (e) {
    res.status(500).json({ error: 'Error al agregar item' });
  }
});

// DELETE item de una orden
router.delete('/:id/items/:itemId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const itemRef = col.doc(req.params.id).collection('items').doc(req.params.itemId);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) return res.status(404).json({ error: 'Item no encontrado' });

    await itemRef.delete();
    res.json({ message: 'Item eliminado correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar el item' });
  }
});

module.exports = router;