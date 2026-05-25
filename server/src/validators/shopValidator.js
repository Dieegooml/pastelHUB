const { z } = require('zod');

const createShopSchema = z.object({
  owner_id: z.string().min(1, 'owner_id es requerido'),
  name: z.string().min(1, 'name es requerido'),
  description: z.string().optional().default(''),
  logo_url: z.string().optional().default(''),
  banner_url: z.string().optional().default(''),
});

const updateShopSchema = z.object({
  owner_id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  logo_url: z.string().optional(),
  banner_url: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional(),
  delivery_range: z.number().optional(),
  schedules: z.array(z.any()).optional(),
  categories: z.array(z.any()).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe enviar al menos un campo para actualizar',
});

module.exports = { createShopSchema, updateShopSchema };