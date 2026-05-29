const { z } = require('zod');

const VALID_METHODS = ['card', 'cash', 'yape', 'plin'];

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

module.exports = { createPaymentSchema, updatePaymentSchema };
