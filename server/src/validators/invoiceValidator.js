const { z } = require('zod');

const VALID_STATUSES = ['issued', 'cancelled'];

const generateInvoiceSchema = z.object({
  orderId: z.string().min(1, 'orderId es requerido'),
});

const updateInvoiceStatusSchema = z.object({
  status: z.enum(VALID_STATUSES, {
    errorMap: () => ({ message: `Estado inválido. Válidos: ${VALID_STATUSES.join(', ')}` }),
  }),
});

module.exports = { generateInvoiceSchema, updateInvoiceStatusSchema, VALID_STATUSES };
