const { z } = require('zod');

const createReviewSchema = z.object({
  shopId: z.string().min(1, 'shopId es requerido'),
  orderId: z.string().min(1, 'orderId es requerido'),
  rating: z.number().int('rating debe ser un número entero').min(0, 'rating mínimo 0').max(5, 'rating máximo 5'),
  comment: z.string().optional().default(''),
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(0).max(5).optional(),
  comment: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe enviar al menos un campo para actualizar',
});

const replySchema = z.object({
  ownerReply: z.string().min(1, 'ownerReply es requerido'),
});

module.exports = { createReviewSchema, updateReviewSchema, replySchema };
