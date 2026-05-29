const { z } = require('zod');

const createCustomerSchema = z.object({
  phone: z.string().optional().default(''),
});

const addressSchema = z.object({
  street: z.string().min(1, 'street es requerido'),
  city: z.string().min(1, 'city es requerido'),
  district: z.string().optional().default(''),
  reference: z.string().optional().default(''),
  isDefault: z.boolean().optional().default(false),
});

const defaultAddressSchema = z.object({
  addressId: z.string().min(1, 'addressId es requerido'),
});

const updateAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  reference: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe enviar al menos un campo para actualizar',
});

module.exports = { createCustomerSchema, addressSchema, defaultAddressSchema, updateAddressSchema };
