const { z } = require('zod');

const createProductSchema = z.object({
  shop_id: z.string().min(1, 'shop_id es requerido'),
  category_id: z.string().optional().default(''),
  name: z.string().min(1, 'name es requerido'),
  description: z.string().optional().default(''),
  price: z.union([z.number(), z.string()]).refine(
    v => !isNaN(Number(v)) && Number(v) >= 0,
    'price debe ser un número válido mayor o igual a 0'
  ),
  stock: z.union([z.number(), z.string()]).optional().default(0),
  image_url: z.string().optional().default(''),
  is_available: z.boolean().optional().default(true),
});

const updateProductSchema = z.object({
  category_id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.union([z.number(), z.string()]).optional(),
  stock: z.union([z.number(), z.string()]).optional(),
  image_url: z.string().optional(),
  is_available: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe enviar al menos un campo para actualizar',
});

const updateProductAvailabilitySchema = z.object({
  is_available: z.boolean('is_available debe ser true o false'),
});

const variantSchema = z.object({
  type: z.string().min(1, 'type es requerido'),
  value: z.string().min(1, 'value es requerido'),
  extra_price: z.union([z.number(), z.string()]).optional().default(0),
});

const updateVariantSchema = z.object({
  type: z.string().optional(),
  value: z.string().optional(),
  extra_price: z.union([z.number(), z.string()]).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe enviar al menos un campo',
});

module.exports = { createProductSchema, updateProductSchema, updateProductAvailabilitySchema, variantSchema, updateVariantSchema };