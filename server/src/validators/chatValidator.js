const { z } = require('zod');

const createSessionSchema = z.object({
  context: z.string().max(500).optional(),
});

const sendMessageSchema = z.object({
  message: z.string().min(1, 'Mensaje es requerido').max(2000),
});

module.exports = { createSessionSchema, sendMessageSchema };
