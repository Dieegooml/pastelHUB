const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

const col = db.collection('payments');

const VALID_METHODS  = ['card', 'cash', 'yape', 'plin'];
const VALID_STATUSES = ['pending', 'paid', 'refunded', 'failed'];

// GET todos los pagos
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col.orderBy('createdAt', 'desc').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
});

// GET pagos por estado
router.get('/status/:status', verifyToken, requireAdmin, async (req, res) => {
  try {
    if (!VALID_STATUSES.includes(req.params.status)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${VALID_STATUSES.join(', ')}` });
    }
    const snap = await col
      .where('paymentStatus', '==', req.params.status)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al filtrar pagos por estado' });
  }
});

// GET pago por orden (relación 1:1)
router.get('/order/:orderId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col
      .where('orderId', '==', req.params.orderId)
      .limit(1)
      .get();
    if (snap.empty) return res.status(404).json({ error: 'Pago no encontrado para esta orden' });
    const doc = snap.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener el pago de la orden' });
  }
});

// GET un pago
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener el pago' });
  }
});

// POST crear pago
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { orderId, paymentMethod, amount, transactionRef } = req.body;

    if (!orderId || !paymentMethod || amount === undefined) {
      return res.status(400).json({ error: 'orderId, paymentMethod y amount son requeridos' });
    }

    if (!VALID_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ error: `Método inválido. Válidos: ${VALID_METHODS.join(', ')}` });
    }

    // Verificar que la orden existe
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'La orden no existe' });
    }

    // Verificar que la orden no tenga ya un pago
    const existing = await col.where('orderId', '==', orderId).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'Esta orden ya tiene un pago registrado' });
    }

    const data = {
      orderId,
      paymentMethod,
      paymentStatus:  'pending',
      amount:         parseFloat(amount),
      transactionRef: transactionRef || '',
      paidAt:         '',
      createdAt:      new Date().toISOString(),
    };

    const ref = await col.add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear el pago' });
  }
});

// PATCH actualizar estado del pago
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pago no encontrado' });

    const { paymentStatus } = req.body;
    if (!VALID_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${VALID_STATUSES.join(', ')}` });
    }

    const updates = {
      paymentStatus,
      // Si el estado es 'paid', registrar la fecha de pago
      ...(paymentStatus === 'paid' && { paidAt: new Date().toISOString() }),
    };

    await col.doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar estado del pago' });
  }
});

// PUT actualizar pago (solo mientras esté pendiente)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pago no encontrado' });

    if (doc.data().paymentStatus !== 'pending') {
      return res.status(400).json({ error: 'Solo se pueden editar pagos en estado pending' });
    }

    // No permitir cambiar orderId ni campos críticos
    const { orderId, createdAt, paidAt, ...rest } = req.body;
    if (rest.paymentMethod && !VALID_METHODS.includes(rest.paymentMethod)) {
      return res.status(400).json({ error: `Método inválido. Válidos: ${VALID_METHODS.join(', ')}` });
    }
    if (rest.amount !== undefined) rest.amount = parseFloat(rest.amount);

    await col.doc(req.params.id).update(rest);
    res.json({ id: req.params.id, ...rest });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar el pago' });
  }
});

// DELETE pago (solo si está en pending o failed)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pago no encontrado' });

    const { paymentStatus } = doc.data();
    if (!['pending', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({ error: 'Solo se pueden eliminar pagos en estado pending o failed' });
    }

    await col.doc(req.params.id).delete();
    res.json({ message: 'Pago eliminado correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar el pago' });
  }
});

module.exports = router;