const { z } = require('zod');

const VALID_TARGET_TYPES = ['review', 'shop', 'product'];

const createReportSchema = z.object({
  targetType: z.enum(VALID_TARGET_TYPES, {
    errorMap: () => ({ message: `targetType inválido. Válidos: ${VALID_TARGET_TYPES.join(', ')}` }),
  }),
  targetId: z.string().min(1, 'targetId es requerido'),
  reason: z.string().min(1, 'reason es requerido'),
});

const assignReportSchema = z.object({
  moderatorId: z.string().min(1, 'moderatorId es requerido'),
});

const updateReportStatusSchema = z.object({
  status: z.enum(['resolved', 'dismissed'], {
    errorMap: () => ({ message: 'Estado inválido. Válidos: resolved, dismissed' }),
  }),
});

const editReportSchema = z.object({
  reason: z.string().min(1, 'reason es requerido'),
});

module.exports = { createReportSchema, assignReportSchema, updateReportStatusSchema, editReportSchema };
