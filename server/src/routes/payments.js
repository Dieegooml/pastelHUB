const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin, requireCustomer } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createPaymentSchema, updatePaymentSchema, updatePaymentStatusSchema, createPreferenceSchema, processGatewayPaymentSchema } = require('../validators/paymentValidator');
const { paginate, tryPaginate } = require('../utils/paginate');
const { generateInvoiceFromPayment } = require('./invoices');
const paymentGateway = require('../utils/paymentGateway');
const { PAYMENT_STATUSES } = require('../constants');

const col = db.collection('payments');

// GET todos los pagos
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  await tryPaginate(res, col, req.query, { orderBy: 'createdAt' }, 'Error al obtener pagos');
});

// GET pagos por estado
router.get('/status/:status', verifyToken, requireAdmin, async (req, res) => {
    if (!PAYMENT_STATUSES.includes(req.params.status)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${PAYMENT_STATUSES.join(', ')}` });
  }
  await tryPaginate(res, col, req.query, {
    orderBy: 'createdAt', filters: [{ field: 'paymentStatus', value: req.params.status }],
  }, 'Error al filtrar pagos por estado');
});

// GET pago por orden (cliente de la orden, dueño de la shop o admin)
router.get('/order/:orderId', verifyToken, async (req, res) => {
  try {
    const roles = req.user?.roles || [];
    if (!roles.includes('admin')) {
      const orderDoc = await db.collection('orders').doc(req.params.orderId).get();
      if (!orderDoc.exists) return res.status(404).json({ error: 'Orden no encontrada' });
      const order = orderDoc.data();
      const isCustomer = order.customer?.user_id === req.user.uid;
      const isOwner = order.shop?.shop_id
        ? await db.collection('pastryShops').doc(order.shop.shop_id).get().then(s => s.exists && s.data().owner_id === req.user.uid)
        : false;
      if (!isCustomer && !isOwner) {
        return res.status(403).json({ error: 'No tienes permiso para ver este pago' });
      }
    }
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

// GET un pago (cliente de la orden, dueño de la shop o admin)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pago no encontrado' });
    const roles = req.user?.roles || [];
    if (!roles.includes('admin')) {
      const data = doc.data();
      const orderDoc = await db.collection('orders').doc(data.orderId).get();
      if (!orderDoc.exists) return res.status(404).json({ error: 'Orden no encontrada' });
      const order = orderDoc.data();
      const isCustomer = order.customer?.user_id === req.user.uid;
      const isOwner = order.shop?.shop_id
        ? await db.collection('pastryShops').doc(order.shop.shop_id).get().then(s => s.exists && s.data().owner_id === req.user.uid)
        : false;
      if (!isCustomer && !isOwner) {
        return res.status(403).json({ error: 'No tienes permiso para ver este pago' });
      }
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener el pago' });
  }
});

// POST crear pago (cliente autenticado)
router.post('/', verifyToken, requireCustomer, validate(createPaymentSchema), async (req, res) => {
  try {
    const { orderId, paymentMethod, amount, transactionRef } = req.body;

    // Verificar que la orden existe
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'La orden no existe' });
    }

    // Verificar que la orden pertenece al usuario autenticado
    if (orderDoc.data().customer?.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Solo puedes pagar tus propias órdenes' });
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
      amount,
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
router.patch('/:id/status', verifyToken, requireAdmin, validate(updatePaymentStatusSchema), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pago no encontrado' });

    const { paymentStatus } = req.body;

    const updates = {
      paymentStatus,
      // Si el estado es 'paid', registrar la fecha de pago
      ...(paymentStatus === 'paid' && { paidAt: new Date().toISOString() }),
    };

    await col.doc(req.params.id).update(updates);

    // Auto-generar factura cuando el pago se confirma
    if (paymentStatus === 'paid') {
      const paymentData = doc.data();
      try {
        await generateInvoiceFromPayment(paymentData.orderId);
      } catch (e) {
        logger.error('Error al generar factura automática', { error: e.message, orderId: paymentData.orderId });
      }
    }

    res.json({ id: req.params.id, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar estado del pago' });
  }
});

// PUT actualizar pago (solo mientras esté pendiente)
router.put('/:id', verifyToken, requireAdmin, validate(updatePaymentSchema), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pago no encontrado' });

    if (doc.data().paymentStatus !== 'pending') {
      return res.status(400).json({ error: 'Solo se pueden editar pagos en estado pending' });
    }

    // No permitir cambiar orderId ni campos críticos
    const { orderId, createdAt, paidAt, ...rest } = req.body;

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

// POST procesar pago a través del gateway demo
router.post('/gateway', verifyToken, async (req, res) => {
  try {
    const { orderId, paymentMethod, amount, cardDetails } = req.body;

    if (!orderId || !paymentMethod || amount == null) {
      return res.status(400).json({ error: 'orderId, paymentMethod y amount son requeridos' });
    }
    if (!['card', 'cash', 'yape', 'plin'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Método de pago inválido' });
    }

    // Verificar orden existe y pertenece al usuario
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) return res.status(404).json({ error: 'Orden no encontrada' });
    if (orderDoc.data().customer?.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Solo puedes pagar tus propias órdenes' });
    }

    // Verificar que no tenga pago previo
    const existing = await col.where('orderId', '==', orderId).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'Esta orden ya tiene un pago' });
    }

    // Simular demora del gateway
    await new Promise(r => setTimeout(r, 1500));

    // Generar transacción demo
    const transactionRef = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const success = paymentMethod === 'cash' || Math.random() > 0.1; // 90% éxito en pagos electrónicos

    if (!success) {
      const data = {
        orderId, paymentMethod, amount, transactionRef,
        paymentStatus: 'failed',
        paidAt: '', createdAt: new Date().toISOString(),
        errorMessage: 'Fondos insuficientes',
      };
      const ref = await col.add(data);
      return res.status(200).json({ success: false, id: ref.id, ...data });
    }

    // Pago exitoso
    const data = {
      orderId, paymentMethod, amount, transactionRef,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
      paidAt: paymentMethod === 'cash' ? '' : new Date().toISOString(),
      cardLast4: cardDetails?.last4 || '',
      cardholderName: cardDetails?.cardholderName || '',
      createdAt: new Date().toISOString(),
    };

    const ref = await col.add(data);

    // Actualizar estado de pago en la orden
    await db.collection('orders').doc(orderId).update({
      'payment.status': data.paymentStatus,
      'payment.transaction_ref': transactionRef,
    });

    // Generar factura si pagado
    if (data.paymentStatus === 'paid') {
      try {
        await generateInvoiceFromPayment(orderId);
      } catch (e) {
        logger.error('Error generando factura', { error: e.message, orderId });
      }
    }

    res.status(201).json({ success: true, id: ref.id, ...data });
  } catch (e) {
    res.status(500).json({ error: 'Error procesando el pago' });
  }
});

// POST crear preferencia de MercadoPago
router.post('/create-preference', verifyToken, requireCustomer, validate(createPreferenceSchema), async (req, res) => {
  try {
    const { orderId, backUrls } = req.body;

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) return res.status(404).json({ error: 'La orden no existe' });
    if (orderDoc.data().customer?.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Solo puedes pagar tus propias órdenes' });
    }

    const existing = await col.where('orderId', '==', orderId).limit(1).get();
    if (!existing.empty && existing.docs[0].data().paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Esta orden ya está pagada' });
    }

    const order = { id: orderDoc.id, ...orderDoc.data() };
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    const preference = await paymentGateway.createPreference({
      orderId,
      items: order.items || [],
      total: order.totals?.total || 0,
      payer: {
        name: userData.name || req.user.name || '',
        email: userData.email || req.user.email || '',
        phone: userData.phone || '',
      },
      description: `Pedido PastelHub #${orderId.slice(-6)}`,
      backUrls: backUrls || {},
      notificationUrl: `${req.protocol}://${req.get('host')}/api/payments/webhook`,
    });

    // Guardar la preferencia en el pago
    const paymentRef = existing.empty ? col.doc() : existing.docs[0].ref;
    const paymentData = {
      orderId,
      paymentMethod: 'mercadopago',
      paymentStatus: 'pending',
      amount: order.totals?.total || 0,
      transactionRef: preference.id,
      mpPreferenceId: preference.id,
      mpInitPoint: preference.initPoint,
      createdAt: existing.empty ? new Date().toISOString() : undefined,
    };

    if (existing.empty) {
      await paymentRef.set({ ...paymentData, createdAt: new Date().toISOString() });
    } else {
      await paymentRef.update({ mpPreferenceId: preference.id, mpInitPoint: preference.initPoint, transactionRef: preference.id });
    }

    res.json({
      id: paymentRef.id,
      preferenceId: preference.id,
      initPoint: preference.initPoint,
      sandboxInitPoint: preference.sandboxInitPoint,
    });
  } catch (e) {
    logger.error('Error creando preferencia', { error: e.message });
    res.status(500).json({ error: 'Error al crear preferencia de pago' });
  }
});

// POST webhook de MercadoPago (sin auth, firma verificada)
router.post('/webhook', (req, res, next) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', chunk => { data += chunk; });
  req.on('end', () => {
    req.rawBody = data;
    try { req.webhookData = JSON.parse(data); } catch { req.webhookData = {}; }
    next();
  });
}, async (req, res) => {
  try {
    const webhookData = req.webhookData || {};
    const headers = {
      'x-signature': req.headers['x-signature'] || '',
      'x-request-id': req.headers['x-request-id'] || '',
    };
    const result = await paymentGateway.handleWebhook(webhookData, headers, req.rawBody);

    if (!result.valid) {
      return res.status(401).json({ error: 'Firma inválida' });
    }

    if (!result.handled) {
      return res.status(200).json({ message: 'Evento ignorado' });
    }

    if (result.status === 'approved' || result.status === 'in_process') {
      const paymentSnap = await col
        .where('orderId', '==', result.orderId)
        .limit(1)
        .get();

      if (!paymentSnap.empty) {
        const paymentDoc = paymentSnap.docs[0];
        const status = result.status === 'approved' ? 'paid' : 'pending';
        const updates = {
          paymentStatus: status,
          transactionRef: result.transactionRef || paymentDoc.data().transactionRef,
          mpPaymentId: result.paymentId,
          paymentMethod: result.paymentMethod || 'mercadopago',
          ...(status === 'paid' && { paidAt: new Date().toISOString() }),
        };
        await paymentDoc.ref.update(updates);
        await db.collection('orders').doc(result.orderId).update({
          'payment.status': status,
          'payment.transaction_ref': result.transactionRef,
          'payment.mp_payment_id': result.paymentId,
        });

        if (status === 'paid') {
          try {
            await generateInvoiceFromPayment(result.orderId);
          } catch (e) {
            logger.error('Error generando factura desde webhook', { error: e.message, orderId: result.orderId });
          }
        }
      }
    }

    res.status(200).json({ message: 'Webhook procesado' });
  } catch (e) {
    logger.error('Error procesando webhook', { error: e.message });
    res.status(200).json({ message: 'Webhook recibido' });
  }
});

// PATCH procesar pago a través del gateway configurado
router.patch('/:id/process', verifyToken, validate(processGatewayPaymentSchema), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pago no encontrado' });

    const paymentData = doc.data();

    // Verificar permiso del usuario
    const orderDoc = await db.collection('orders').doc(paymentData.orderId).get();
    if (!orderDoc.exists) return res.status(404).json({ error: 'Orden no encontrada' });
    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && orderDoc.data().customer?.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'No tienes permiso para procesar este pago' });
    }

    if (paymentData.paymentStatus !== 'pending') {
      return res.status(400).json({ error: 'Solo se pueden procesar pagos pendientes' });
    }

    const { transactionAmount, paymentMethodId, token, description, installments, issuerId, payer } = req.body;

    const gatewayResult = await paymentGateway.processPayment({
      transaction_amount: Number(transactionAmount || paymentData.amount),
      token,
      description: description || `Pedido PastelHub #${paymentData.orderId.slice(-6)}`,
      installments: installments || 1,
      payment_method_id: paymentMethodId || 'card',
      issuer_id: issuerId,
      payer: payer || { email: req.user.email || '' },
    });

    const status = gatewayResult.status === 'approved' ? 'paid' : gatewayResult.status === 'rejected' ? 'failed' : 'pending';
    const updates = {
      paymentStatus: status,
      transactionRef: gatewayResult.transactionRef,
      mpPaymentId: gatewayResult.id,
      paymentMethod: gatewayResult.paymentMethodId || paymentData.paymentMethod,
      cardLast4: gatewayResult.cardLast4 || paymentData.cardLast4 || '',
      installments: gatewayResult.installments,
      netAmount: gatewayResult.netAmount,
      paidAt: status === 'paid' ? new Date().toISOString() : '',
    };

    await doc.ref.update(updates);

    await db.collection('orders').doc(paymentData.orderId).update({
      'payment.status': status,
      'payment.transaction_ref': gatewayResult.transactionRef,
      'payment.mp_payment_id': gatewayResult.id,
    });

    if (status === 'paid') {
      try {
        await generateInvoiceFromPayment(paymentData.orderId);
      } catch (e) {
        logger.error('Error generando factura al procesar pago', { error: e.message, orderId: paymentData.orderId });
      }
    }

    res.json({ success: status === 'paid', id: req.params.id, ...updates });
  } catch (e) {
    const statusCode = e.statusCode || 500;
    const message = e.code === 'insufficient_funds' ? 'Fondos insuficientes' : e.message;
    logger.error('Error procesando pago', { error: e.message, paymentId: req.params.id });
    res.status(statusCode >= 400 && statusCode < 500 ? statusCode : 500).json({ error: message });
  }
});

module.exports = router;