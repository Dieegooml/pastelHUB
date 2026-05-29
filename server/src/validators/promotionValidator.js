const { z } = require('zod');

const VALID_TYPES = ['discount', 'combo', 'bogo'];

const createPromotionSchema = z.object({
  shop_id: z.string().min(1, 'shop_id es requerido'),
  name: z.string().min(1, 'name es requerido'),
  type: z.enum(VALID_TYPES, {
    errorMap: () => ({ message: `type inválido. Válidos: ${VALID_TYPES.join(', ')}` }),
  }),
  description: z.string().optional().default(''),
  discount_percentage: z.number().min(0).max(100).optional().nullable(),
  discount_amount: z.number().min(0).optional().nullable(),
  combo_items: z.array(z.string()).optional().default([]),
  combo_price: z.number().min(0).optional().nullable(),
  product_ids: z.array(z.string()).optional().default([]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_active: z.boolean().optional().default(true),
});

const updatePromotionSchema = z.object({
  name: z.string().optional(),
  type: z.enum(VALID_TYPES, {
    errorMap: () => ({ message: `type inválido. Válidos: ${VALID_TYPES.join(', ')}` }),
  }).optional(),
  description: z.string().optional(),
  discount_percentage: z.number().min(0).max(100).optional().nullable(),
  discount_amount: z.number().min(0).optional().nullable(),
  combo_items: z.array(z.string()).optional(),
  combo_price: z.number().min(0).optional().nullable(),
  product_ids: z.array(z.string()).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_active: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe enviar al menos un campo para actualizar',
});

module.exports = { createPromotionSchema, updatePromotionSchema };
