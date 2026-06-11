const { z } = require('zod');

const VALID_METHODS = ['card', 'cash', 'yape', 'plin', 'mercadopago'];

const createPaymentSchema = z.object({
  orderId: z.string().min(1, 'orderId es requerido'),
  paymentMethod: z.enum(VALID_METHODS, {
    errorMap: () => ({ message: `Método inválido. Válidos: ${VALID_METHODS.join(', ')}` }),
  }),
  amount: z.number().min(0, 'amount debe ser mayor o igual a 0'),
  transactionRef: z.string().optional().default(''),
});

const updatePaymentSchema = z.object({
  paymentMethod: z.enum(VALID_METHODS, {
    errorMap: () => ({ message: `Método inválido. Válidos: ${VALID_METHODS.join(', ')}` }),
  }).optional(),
  amount: z.number().min(0).optional(),
  transactionRef: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe enviar al menos un campo para actualizar',
});

const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded'], {
    errorMap: () => ({ message: 'Estado inválido. Válidos: pending, paid, failed, refunded' }),
  }),
});

const createPreferenceSchema = z.object({
  orderId: z.string().min(1, 'orderId es requerido'),
  backUrls: z.object({
    success: z.string().optional(),
    failure: z.string().optional(),
    pending: z.string().optional(),
  }).optional().default({}),
});

const processGatewayPaymentSchema = z.object({
  transactionAmount: z.number().positive('transactionAmount debe ser positivo').optional(),
  paymentMethodId: z.string().optional(),
  token: z.string().optional(),
  description: z.string().optional(),
  installments: z.number().int().positive().optional(),
  issuerId: z.string().optional(),
  payer: z.object({
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    identification: z.object({
      type: z.string().optional(),
      number: z.string().optional(),
    }).optional(),
  }).optional(),
});

module.exports = { createPaymentSchema, updatePaymentSchema, updatePaymentStatusSchema, createPreferenceSchema, processGatewayPaymentSchema };
