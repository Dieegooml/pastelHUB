const crypto = require('crypto');
const logger = require('../utils/logger');
const { getPreferenceApi, getPaymentApi, isConfigured } = require('../config/mercadopago');

const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET || '';
const SIMULATED_SUCCESS_RATE = 0.9;

function generateTransactionRef() {
  return `MP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function createPreference(orderData) {
  if (!isConfigured()) {
    logger.info('Gateway simulado: creando preferencia simulada', { orderId: orderData.orderId });
    return simulateCreatePreference(orderData);
  }

  try {
    const preferenceApi = getPreferenceApi();
    const body = buildPreferenceBody(orderData);
    const response = await preferenceApi.create({ body });
    logger.info('Preferencia MercadoPago creada', { id: response.id });
    return {
      id: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
      collectorId: response.collector_id,
    };
  } catch (e) {
    logger.error('Error creando preferencia MercadoPago', { error: e.message, stack: e.stack });
    throw new Error(`Error al crear preferencia de pago: ${e.message}`);
  }
}

function buildPreferenceBody(orderData) {
  const { orderId, items, payer, total, description, backUrls, notificationUrl } = orderData;

  return {
    items: (items || []).map(item => ({
      id: item.product_id || item.id,
      title: item.name || 'Producto',
      description: item.description || '',
      quantity: item.quantity || 1,
      currency_id: 'PEN',
      unit_price: Number(item.price_at_purchase || item.price || 0),
    })),
    payer: {
      name: payer?.name || (payer?.email ? payer.email.split('@')[0] : 'Comprador'),
      email: payer?.email || '',
      phone: { area_code: '', number: payer?.phone || '' },
    },
    back_urls: {
      success: backUrls?.success || `${process.env.CLIENT_URL || 'http://localhost:5173'}/my-orders`,
      failure: backUrls?.failure || `${process.env.CLIENT_URL || 'http://localhost:5173'}/checkout`,
      pending: backUrls?.pending || `${process.env.CLIENT_URL || 'http://localhost:5173'}/my-orders`,
    },
    auto_return: 'approved',
    notification_url: notificationUrl || `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/payments/webhook`,
    external_reference: orderId,
    statement_descriptor: 'PASTELHUB',
    binary_mode: true,
    metadata: { order_id: orderId },
  };
}

async function processPayment(paymentData) {
  if (!isConfigured()) {
    logger.info('Gateway simulado: procesando pago', { orderId: paymentData.orderId });
    return simulateProcessPayment(paymentData);
  }

  try {
    const paymentApi = getPaymentApi();
    const response = await paymentApi.create({ body: paymentData });
    logger.info('Pago MercadoPago procesado', { id: response.id, status: response.status });
    return {
      id: response.id,
      status: response.status,
      statusDetail: response.status_detail,
      transactionRef: `MP-${response.id}`,
      paymentMethodId: response.payment_method_id,
      paymentTypeId: response.payment_type_id,
      cardLast4: response.card?.last_four_digits || '',
      installments: response.installments || 1,
      feeDetails: response.fee_details || [],
      netAmount: response.transaction_details?.net_received_amount || paymentData.transaction_amount,
      dateApproved: response.date_approved || '',
    };
  } catch (e) {
    logger.error('Error procesando pago MercadoPago', { error: e.message });
    throw new Error(`Error al procesar pago: ${e.message}`);
  }
}

async function handleWebhook(webhookData, headers, rawBody) {
  if (!isConfigured()) {
    logger.info('Gateway simulado: webhook recibido', { action: webhookData.action });
    return simulateWebhook(webhookData);
  }

  if (WEBHOOK_SECRET) {
    const signatureValid = verifySignature(rawBody || webhookData, headers);
    if (!signatureValid) {
      logger.warn('Firma de webhook inválida');
      return { valid: false, error: 'Firma inválida' };
    }
  }

  const { action, data, type } = webhookData;
  logger.info('Webhook MercadoPago recibido', { action, type, dataId: data?.id });

  if (type !== 'payment' && action !== 'payment.created' && action !== 'payment.updated') {
    return { valid: true, handled: false, reason: 'Evento no relevante' };
  }

  try {
    const paymentApi = getPaymentApi();
    const payment = await paymentApi.get({ id: data.id });
    return {
      valid: true,
      handled: true,
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      orderId: payment.external_reference,
      transactionRef: `MP-${payment.id}`,
      payerEmail: payment.payer?.email || '',
      paymentMethod: payment.payment_method_id || '',
      dateApproved: payment.date_approved || '',
    };
  } catch (e) {
    logger.error('Error obteniendo pago en webhook', { error: e.message, paymentId: data?.id });
    return { valid: true, handled: false, error: e.message };
  }
}

function verifySignature(webhookData, headers) {
  try {
    const signature = headers['x-signature'];
    if (!signature) return false;

    const parts = signature.split(',');
    let ts = '';
    let hash = '';
    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') hash = value;
    }
    if (!ts || !hash) return false;

    const rawBody = typeof webhookData === 'string' ? webhookData : JSON.stringify(webhookData);
    const dataId = headers['x-request-id'] || '';
    const stringToSign = `${dataId}|${ts}|${rawBody}|${WEBHOOK_SECRET}`;
    const expectedHash = crypto.createHash('sha256').update(stringToSign).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
  } catch (e) {
    logger.error('Error verificando firma webhook', { error: e.message });
    return false;
  }
}

async function getPaymentStatus(paymentId) {
  if (!isConfigured()) {
    logger.info('Gateway simulado: consultando estado', { paymentId });
    return {
      status: 'approved',
      statusDetail: 'accredited',
      transactionRef: `MP-SIM-${paymentId}`,
    };
  }

  try {
    const paymentApi = getPaymentApi();
    const payment = await paymentApi.get({ id: paymentId });
    return {
      status: payment.status,
      statusDetail: payment.status_detail,
      transactionRef: `MP-${payment.id}`,
      paymentMethod: payment.payment_method_id,
      cardLast4: payment.card?.last_four_digits || '',
      dateApproved: payment.date_approved || '',
    };
  } catch (e) {
    logger.error('Error consultando estado del pago', { error: e.message, paymentId });
    throw new Error(`Error al consultar pago: ${e.message}`);
  }
}

async function simulateCreatePreference(orderData) {
  await new Promise(r => setTimeout(r, 500));
  return {
    id: `SIM-PREF-${Date.now()}`,
    initPoint: '#',
    sandboxInitPoint: '#',
    collectorId: 'simulated',
  };
}

async function simulateProcessPayment(paymentData) {
  await new Promise(r => setTimeout(r, 1500));
  const success = Math.random() < SIMULATED_SUCCESS_RATE;
  if (!success) {
    throw Object.assign(new Error('Fondos insuficientes'), { statusCode: 400, code: 'insufficient_funds' });
  }
  return {
    id: `SIM-${Date.now()}`,
    status: 'approved',
    statusDetail: 'accredited',
    transactionRef: generateTransactionRef(),
    paymentMethodId: paymentData.payment_method_id || 'card',
    cardLast4: paymentData.card?.last_four_digits || '1234',
    installments: 1,
    netAmount: paymentData.transaction_amount,
    dateApproved: new Date().toISOString(),
  };
}

async function simulateWebhook(webhookData) {
  return {
    valid: true,
    handled: true,
    paymentId: webhookData?.data?.id || `SIM-${Date.now()}`,
    status: 'approved',
    statusDetail: 'accredited',
    orderId: webhookData?.external_reference || '',
    transactionRef: generateTransactionRef(),
    payerEmail: '',
    paymentMethod: 'simulated',
    dateApproved: new Date().toISOString(),
  };
}

module.exports = {
  createPreference,
  processPayment,
  handleWebhook,
  getPaymentStatus,
  isConfigured,
};
