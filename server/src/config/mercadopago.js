const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const logger = require('../utils/logger');

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

let client = null;
let preferenceApi = null;
let paymentApi = null;

if (accessToken) {
  client = new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
  preferenceApi = new Preference(client);
  paymentApi = new Payment(client);
  logger.info('MercadoPago SDK initialized');
} else {
  logger.warn('MERCADOPAGO_ACCESS_TOKEN no configurado — usando gateway simulado');
}

function getPreferenceApi() {
  return preferenceApi;
}

function getPaymentApi() {
  return paymentApi;
}

function isConfigured() {
  return !!accessToken;
}

module.exports = {
  getPreferenceApi,
  getPaymentApi,
  isConfigured,
  MercadoPagoConfig,
  Preference,
  Payment,
};
