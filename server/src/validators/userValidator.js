const { z } = require('zod');

const VALID_ROLES = ['admin', 'moderator', 'owner', 'customer'];

const createUserSchema = z.object({
  name: z.string().min(1, 'name es requerido'),
  email: z.string().email('email inválido'),
  password: z.string().min(6, 'password debe tener al menos 6 caracteres'),
  phone: z.string().optional().default(''),
  roles: z.array(z.enum(VALID_ROLES)).optional().default(['customer']),
  isActive: z.boolean().optional().default(true),
  addresses: z.array(z.object({
    street: z.string().min(1, 'street es requerido'),
    city: z.string().min(1, 'city es requerido'),
    district: z.string().optional().default(''),
    isDefault: z.boolean().optional().default(false),
  })).optional().default([]),
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('email inválido').optional(),
  phone: z.string().optional(),
  roles: z.array(z.enum(VALID_ROLES)).optional(),
  isActive: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe enviar al menos un campo para actualizar',
});

const addressSchema = z.object({
  street: z.string().min(1, 'street es requerido'),
  city: z.string().min(1, 'city es requerido'),
  district: z.string().optional().default(''),
  is_default: z.boolean().optional().default(false),
});

module.exports = { createUserSchema, updateUserSchema, addressSchema };
