const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin, requireOwnerOrAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { generateInvoiceSchema, updateInvoiceStatusSchema } = require('../validators/invoiceValidator');
const { tryPaginate } = require('../utils/paginate');

const col = db.collection('invoices');
const countersCol = db.collection('counters');

async function getNextInvoiceNumber() {
  const ref = countersCol.doc('invoice');
  const result = await db.runTransaction(async (t) => {
    const doc = await t.get(ref);
    const next = (doc.exists ? doc.data().nextNumber : 0) + 1;
    t.set(ref, { nextNumber: next }, { merge: true });
    return next;
  });
  return `INV-${String(result).padStart(6, '0')}`;
}

async function canViewInvoice(req, invoice) {
  const roles = req.user?.roles || [];
  const uid = req.user.uid;
  if (roles.includes('admin')) return true;
  if (roles.includes('moderator')) return true;
  if (invoice.customerId === uid) return true;
  if (roles.includes('owner') && invoice.shop_id) {
    const shopDoc = await db.collection('pastryShops').doc(invoice.shop_id).get();
    if (shopDoc.exists && shopDoc.data().owner_id === uid) return true;
  }
  return false;
}

function buildFilters(req, roles, uid) {
  const filters = [];
  if (req.query.status) filters.push({ field: 'status', value: req.query.status });
  if (req.query.shop_id) filters.push({ field: 'shop_id', value: req.query.shop_id });
  if (!roles.includes('admin') && !roles.includes('moderator')) {
    filters.push({ field: 'customerId', value: uid });
  }
  if (roles.includes('moderator') && req.query.shop_id) {
    // moderator filtered by shop_id already added above
  }
  return filters;
}

// POST generar factura desde una orden
router.post('/', verifyToken, requireAdmin, validate(generateInvoiceSchema), async (req, res) => {
  try {
    const { orderId } = req.body;

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) return res.status(404).json({ error: 'Orden no encontrada' });

    const order = { id: orderDoc.id, ...orderDoc.data() };

    const existing = await col.where('orderId', '==', orderId).limit(1).get();
    if (!existing.empty) return res.status(400).json({ error: 'Esta orden ya tiene una factura' });

    const shopDoc = await db.collection('pastryShops').doc(order.shop.shop_id).get();
    const shopData = shopDoc.exists ? shopDoc.data() : { name: order.shop.name || '' };

    const customerDoc = await db.collection('users').doc(order.customer.user_id).get();
    const customerData = customerDoc.exists ? customerDoc.data() : {};

    const paymentSnap = await db.collection('payments').where('orderId', '==', orderId).limit(1).get();
    const paymentData = paymentSnap.empty ? {} : paymentSnap.docs[0].data();

    const invoiceNumber = await getNextInvoiceNumber();

    const data = {
      invoiceNumber,
      orderId,
      shop_id: order.shop.shop_id,
      shopName: shopData.name || order.shop.name || '',
      customerId: order.customer.user_id,
      customerName: customerData.name || order.customer.name || '',
      customerEmail: customerData.email || '',
      items: order.items || [],
      subtotal: order.totals?.subtotal || 0,
      deliveryFee: order.totals?.delivery_fee || 0,
      total: order.totals?.total || 0,
      deliveryType: order.delivery_type || 'delivery',
      paymentMethod: paymentData.paymentMethod || order.payment?.method || '',
      paymentStatus: paymentData.paymentStatus || order.payment?.status || '',
      transactionRef: paymentData.transactionRef || order.payment?.transaction_ref || '',
      mpPaymentId: paymentData.mpPaymentId || order.payment?.mp_payment_id || '',
      mpPreferenceId: paymentData.mpPreferenceId || '',
      cardLast4: paymentData.cardLast4 || '',
      installments: paymentData.installments || 1,
      netAmount: paymentData.netAmount || null,
      paidAt: paymentData.paidAt || '',
      status: 'issued',
      issueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = await col.add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (e) {
    res.status(500).json({ error: 'Error al generar la factura' });
  }
});

// GET listar facturas
router.get('/', verifyToken, async (req, res) => {
  const roles = req.user?.roles || [];
  const uid = req.user.uid;
  const filters = buildFilters(req, roles, uid);

  if (roles.includes('moderator') && !req.query.shop_id) {
    return res.status(400).json({ error: 'Moderador debe especificar shop_id' });
  }

  await tryPaginate(res, col, req.query, {
    orderBy: 'createdAt', orderDirection: 'desc', filters,
  }, 'Error al obtener facturas');
});

// GET factura por orden
router.get('/order/:orderId', verifyToken, async (req, res) => {
  try {
    const snap = await col.where('orderId', '==', req.params.orderId).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'Factura no encontrada para esta orden' });

    const doc = snap.docs[0];
    const invoice = { id: doc.id, ...doc.data() };

    if (!(await canViewInvoice(req, invoice))) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta factura' });
    }

    res.json(invoice);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la factura' });
  }
});

// GET factura por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Factura no encontrada' });

    const invoice = { id: doc.id, ...doc.data() };

    if (!(await canViewInvoice(req, invoice))) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta factura' });
    }

    res.json(invoice);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la factura' });
  }
});

// GET descargar PDF
router.get('/:id/pdf', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Factura no encontrada' });

    const invoice = { id: doc.id, ...doc.data() };

    if (!(await canViewInvoice(req, invoice))) {
      return res.status(403).json({ error: 'No tienes permiso para descargar esta factura' });
    }

    const docPdf = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="factura-${invoice.invoiceNumber}.pdf"`);

    docPdf.pipe(res);

    // Cabecera
    docPdf.fontSize(24).font('Helvetica-Bold').text('PASTELHUB', 50, 50, { align: 'center' });
    docPdf.fontSize(10).font('Helvetica').text('Marketplace de Pastelerías Artesanales', { align: 'center' });
    docPdf.moveDown(1.5);

    // Línea separadora
    docPdf.moveTo(50, docPdf.y).lineTo(545, docPdf.y).stroke('#ccc');
    docPdf.moveDown(0.5);

    // Título
    docPdf.fontSize(16).font('Helvetica-Bold').text('BOLETA DE VENTA', { align: 'center' });
    docPdf.moveDown(0.5);
    docPdf.fontSize(10).font('Helvetica').text(`N° ${invoice.invoiceNumber}`, { align: 'center' });
    docPdf.moveDown(0.5);
    docPdf.fontSize(9).fillColor('#666').text(`Fecha de emisión: ${new Date(invoice.issueDate).toLocaleDateString('es-PE')}`, { align: 'center' });
    docPdf.fillColor('#000');
    docPdf.moveDown(1);

    // Línea separadora
    docPdf.moveTo(50, docPdf.y).lineTo(545, docPdf.y).stroke('#ccc');
    docPdf.moveDown(0.5);

    // Datos del cliente y tienda
    const leftX = 50;
    const rightX = 300;
    const colY = docPdf.y;

    docPdf.fontSize(10).font('Helvetica-Bold').text('PASTELERÍA', leftX, colY);
    docPdf.fontSize(9).font('Helvetica').text(invoice.shopName, leftX, docPdf.y + 14);
    docPdf.moveDown(0.5);

    const customerY = docPdf.y;
    docPdf.fontSize(10).font('Helvetica-Bold').text('CLIENTE', rightX, colY);
    docPdf.fontSize(9).font('Helvetica').text(invoice.customerName, rightX, docPdf.y + 2);
    docPdf.text(invoice.customerEmail, rightX);
    docPdf.moveDown(1.5);

    // Línea separadora
    const tableTop = Math.max(docPdf.y, customerY + 40) + 10;
    docPdf.moveTo(50, tableTop - 5).lineTo(545, tableTop - 5).stroke('#ccc');

    // Tabla de items
    const tableHeaders = ['Producto', 'Cant.', 'P/U', 'Subtotal'];
    const tableCols = [50, 350, 420, 480];
    const tableWidths = [300, 70, 60, 65];

    docPdf.fontSize(9).font('Helvetica-Bold');
    docPdf.text(tableHeaders[0], tableCols[0], tableTop, { width: tableWidths[0] });
    docPdf.text(tableHeaders[1], tableCols[1], tableTop, { width: tableWidths[1], align: 'center' });
    docPdf.text(tableHeaders[2], tableCols[2], tableTop, { width: tableWidths[2], align: 'right' });
    docPdf.text(tableHeaders[3], tableCols[3], tableTop, { width: tableWidths[3], align: 'right' });

    docPdf.moveTo(50, docPdf.y + 3).lineTo(545, docPdf.y + 3).stroke('#eee');
    docPdf.moveDown(0.5);

    docPdf.fontSize(9).font('Helvetica');
    let itemY = docPdf.y;

    for (const item of invoice.items) {
      const name = item.name || item.product_id || 'Producto';
      const qty = item.quantity || 0;
      const price = item.price_at_purchase || 0;
      const subtotal = price * qty;

      docPdf.text(name, tableCols[0], itemY, { width: tableWidths[0] });
      docPdf.text(String(qty), tableCols[1], itemY, { width: tableWidths[1], align: 'center' });
      docPdf.text(`S/ ${price.toFixed(2)}`, tableCols[2], itemY, { width: tableWidths[2], align: 'right' });
      docPdf.text(`S/ ${subtotal.toFixed(2)}`, tableCols[3], itemY, { width: tableWidths[3], align: 'right' });
      itemY += 16;
    }

    // Totales
    const totalY = Math.max(itemY, docPdf.y) + 10;
    docPdf.moveTo(50, totalY - 5).lineTo(545, totalY - 5).stroke('#ccc');
    docPdf.moveDown(0.5);

    const totalsX = 380;
    docPdf.fontSize(9).font('Helvetica');
    docPdf.text('Subtotal:', totalsX, docPdf.y, { width: 100 });
    docPdf.text(`S/ ${(invoice.subtotal || 0).toFixed(2)}`, totalsX + 80, docPdf.y - 11, { width: 80, align: 'right' });
    docPdf.text('Delivery:', totalsX);
    docPdf.text(`S/ ${(invoice.deliveryFee || 0).toFixed(2)}`, totalsX + 80, docPdf.y - 11, { width: 80, align: 'right' });
    docPdf.fontSize(11).font('Helvetica-Bold');
    docPdf.text('TOTAL:', totalsX);
    docPdf.text(`S/ ${(invoice.total || 0).toFixed(2)}`, totalsX + 80, docPdf.y - 13, { width: 80, align: 'right' });

    docPdf.moveDown(1.5);
    docPdf.moveTo(50, docPdf.y).lineTo(545, docPdf.y).stroke('#ccc');
    docPdf.moveDown(0.5);

    // Datos de pago con información de MercadoPago
    const payMethodLabels = {
      card: 'Tarjeta crédito/débito',
      cash: 'Efectivo',
      yape: 'Yape',
      plin: 'Plin',
      mercadopago: 'MercadoPago',
    };
    docPdf.fontSize(9).font('Helvetica').fillColor('#666');
    docPdf.text(`Método de pago: ${payMethodLabels[invoice.paymentMethod] || invoice.paymentMethod || 'N/A'}  |  Estado: ${invoice.paymentStatus === 'paid' ? 'Pagado' : invoice.paymentStatus}`);
    docPdf.text(`Tipo de entrega: ${invoice.deliveryType === 'pickup' ? 'Recojo en tienda' : 'Delivery'}`);
    docPdf.moveDown(0.3);

    if (invoice.mpPaymentId) {
      docPdf.text(`ID de pago MercadoPago: ${invoice.mpPaymentId}`);
    }
    if (invoice.transactionRef) {
      docPdf.text(`Referencia: ${invoice.transactionRef}`);
    }
    if (invoice.paymentStatus === 'paid' && invoice.paidAt) {
      docPdf.text(`Pagado el: ${new Date(invoice.paidAt).toLocaleString('es-PE')}`);
    }
    if (invoice.netAmount != null && invoice.netAmount !== invoice.total) {
      docPdf.text(`Monto neto recibido: S/ ${Number(invoice.netAmount).toFixed(2)}`);
    }
    if (invoice.installments && invoice.installments > 1) {
      docPdf.text(`Cuotas: ${invoice.installments}`);
    }

    if (invoice.status === 'cancelled') {
      docPdf.moveDown(1);
      docPdf.fontSize(12).font('Helvetica-Bold').fillColor('#e74c3c').text('*** FACTURA ANULADA ***', { align: 'center' });
    }

    docPdf.end();
  } catch (e) {
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
});

// PATCH cambiar estado (anular)
router.patch('/:id/status', verifyToken, requireAdmin, validate(updateInvoiceStatusSchema), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Factura no encontrada' });

    const { status } = req.body;
    await col.doc(req.params.id).update({ status, updatedAt: new Date().toISOString() });
    res.json({ id: req.params.id, status });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar la factura' });
  }
});

// GET facturas de una pastelería (owner/moderator/admin)
router.get('/shop/:shopId', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await db.collection('pastryShops').doc(req.params.shopId).get();
  if (!doc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  return doc.data().owner_id;
}), async (req, res) => {
  await tryPaginate(res, col, req.query, {
    orderBy: 'createdAt', orderDirection: 'desc',
    filters: [{ field: 'shop_id', value: req.params.shopId }],
  }, 'Error al obtener facturas de la pastelería');
});

async function generateInvoiceFromPayment(orderId) {
  let paymentData = {};
  try {
    const existing = await col.where('orderId', '==', orderId).limit(1).get();
    if (!existing.empty) return null;

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) return null;

    const order = { id: orderDoc.id, ...orderDoc.data() };

    const shopDoc = await db.collection('pastryShops').doc(order.shop.shop_id).get();
    const shopData = shopDoc.exists ? shopDoc.data() : { name: order.shop.name || '' };

    const customerDoc = await db.collection('users').doc(order.customer.user_id).get();
    const customerData = customerDoc.exists ? customerDoc.data() : {};

    const paymentSnap = await db.collection('payments').where('orderId', '==', orderId).limit(1).get();
    paymentData = paymentSnap.empty ? {} : paymentSnap.docs[0].data();

    const invoiceNumber = await getNextInvoiceNumber();

    const data = {
      invoiceNumber,
      orderId,
      shop_id: order.shop.shop_id,
      shopName: shopData.name || order.shop.name || '',
      customerId: order.customer.user_id,
      customerName: customerData.name || order.customer.name || '',
      customerEmail: customerData.email || '',
      items: order.items || [],
      subtotal: order.totals?.subtotal || 0,
      deliveryFee: order.totals?.delivery_fee || 0,
      total: order.totals?.total || 0,
      deliveryType: order.delivery_type || 'delivery',
      paymentMethod: paymentData.paymentMethod || order.payment?.method || '',
      paymentStatus: paymentData.paymentStatus || order.payment?.status || '',
      transactionRef: paymentData.transactionRef || order.payment?.transaction_ref || '',
      mpPaymentId: paymentData.mpPaymentId || order.payment?.mp_payment_id || '',
      mpPreferenceId: paymentData.mpPreferenceId || '',
      cardLast4: paymentData.cardLast4 || '',
      installments: paymentData.installments || 1,
      netAmount: paymentData.netAmount || null,
      paidAt: paymentData.paidAt || '',
      status: 'issued',
      issueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = await col.add(data);
    return { id: ref.id, ...data };
  } catch (e) {
    logger.error('Error en generateInvoiceFromPayment', { error: e.message, paymentId: paymentData?.id || 'unknown' });
    return null;
  }
}

module.exports = router;
module.exports.generateInvoiceFromPayment = generateInvoiceFromPayment;
