const { z } = require('zod');

const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

const createTicketSchema = z.object({
  subject: z.string().min(1, 'Asunto es requerido').max(200),
  priority: z.enum(VALID_PRIORITIES, {
    errorMap: () => ({ message: `Prioridad inválida. Válidas: ${VALID_PRIORITIES.join(', ')}` }),
  }).optional().default('medium'),
  message: z.string().min(1, 'Mensaje es requerido').max(2000),
});

const updateTicketStatusSchema = z.object({
  status: z.enum(VALID_STATUSES, {
    errorMap: () => ({ message: `Estado inválido. Válidos: ${VALID_STATUSES.join(', ')}` }),
  }),
});

const assignTicketSchema = z.object({
  moderatorId: z.string().min(1, 'moderatorId es requerido'),
});

const sendMessageSchema = z.object({
  message: z.string().min(1, 'Mensaje es requerido').max(2000),
});

module.exports = {
  createTicketSchema,
  updateTicketStatusSchema,
  assignTicketSchema,
  sendMessageSchema,
  VALID_STATUSES,
  VALID_PRIORITIES,
};
