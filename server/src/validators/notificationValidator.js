const { z } = require('zod');

const VALID_TYPES = ['order_update', 'new_review', 'promotion', 'system', 'report_update'];

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
