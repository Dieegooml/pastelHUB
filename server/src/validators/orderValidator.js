const { z } = require('zod');

const VALID_PAYMENT_METHODS = ['card', 'cash', 'yape', 'plin'];

const createOrderSchema = z.object({
  customer: z.object({
    user_id: z.string().min(1, 'customer.user_id es requerido'),
  }),
  shop: z.object({
    shop_id: z.string().min(1, 'shop.shop_id es requerido'),
  }),
  delivery_type: z.enum(['delivery', 'pickup']).optional(),
  items: z.array(z.object({
    product_id: z.string().optional().default(''),
    name: z.string().optional().default(''),
    quantity: z.union([z.number(), z.string()]).default(1),
    price_at_purchase: z.union([z.number(), z.string()]).default(0),
  })).min(1, 'Debe haber al menos un item'),
  totals: z.object({
    subtotal: z.union([z.number(), z.string()]).optional().default(0),
    delivery_fee: z.union([z.number(), z.string()]).optional().default(0),
  }).optional(),
  payment: z.object({
    method: z.enum(VALID_PAYMENT_METHODS, {
      errorMap: () => ({ message: `Método de pago inválido. Válidos: ${VALID_PAYMENT_METHODS.join(', ')}` }),
    }),
    transaction_ref: z.string().optional().default(''),
  }),
});

module.exports = { createOrderSchema };