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

const shopStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'suspended'], {
    errorMap: () => ({ message: 'Estado inválido. Válidos: pending, approved, rejected, suspended' }),
  }),
});

const scheduleSchema = z.object({
  day: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], {
    errorMap: () => ({ message: 'day inválido. Válidos: Mon-Sun' }),
  }),
  open_time: z.string().min(1, 'open_time es requerido'),
  close_time: z.string().min(1, 'close_time es requerido'),
});

const updateScheduleSchema = z.object({
  open_time: z.string().optional(),
  close_time: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe enviar al menos un campo',
});

const categorySchema = z.object({
  name: z.string().min(1, 'name es requerido'),
  image_url: z.string().optional().default(''),
});

const updateCategorySchema = z.object({
  name: z.string().optional(),
  image_url: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe enviar al menos un campo',
});

module.exports = { createShopSchema, updateShopSchema, shopStatusSchema, scheduleSchema, updateScheduleSchema, categorySchema, updateCategorySchema };