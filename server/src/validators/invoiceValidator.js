const { z } = require('zod');
const { INVOICE_STATUSES } = require('../constants');

const generateInvoiceSchema = z.object({
  orderId: z.string().min(1, 'orderId es requerido'),
});

const updateInvoiceStatusSchema = z.object({
  status: z.enum(INVOICE_STATUSES, {
    errorMap: () => ({ message: `Estado inválido. Válidos: ${INVOICE_STATUSES.join(', ')}` }),
  }),
});

module.exports = { generateInvoiceSchema, updateInvoiceStatusSchema, VALID_STATUSES: INVOICE_STATUSES };
