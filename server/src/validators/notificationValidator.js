const { z } = require('zod');

const VALID_TYPES = ['order_update', 'new_review', 'shop_approved', 'shop_rejected', 'shop_suspended', 'report_resolved', 'new_order', 'payment_confirmed'];

const createNotificationSchema = z.object({
  userId: z.string().min(1, 'userId es requerido'),
  type: z.enum(VALID_TYPES, {
    errorMap: () => ({ message: `Tipo inválido. Válidos: ${VALID_TYPES.join(', ')}` }),
  }),
  title: z.string().optional().default(''),
  message: z.string().min(1, 'message es requerido'),
});

const bulkNotificationSchema = z.object({
  userIds: z.array(z.string()).min(1, 'userIds debe tener al menos un elemento').max(500, 'Máximo 500 usuarios'),
  type: z.enum(VALID_TYPES, {
    errorMap: () => ({ message: `Tipo inválido. Válidos: ${VALID_TYPES.join(', ')}` }),
  }),
  title: z.string().optional().default(''),
  message: z.string().min(1, 'message es requerido'),
});

module.exports = { createNotificationSchema, bulkNotificationSchema };
