const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'];

const ORDER_PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed'];

const PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed'];

const PAYMENT_METHODS = ['card', 'cash', 'yape', 'plin'];

const ORDER_TRANSITIONS = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['preparing', 'cancelled'],
  preparing:  ['on_the_way', 'cancelled'],
  on_the_way: ['delivered'],
  delivered:  [],
  cancelled:  [],
};

const SHOP_STATUSES = ['pending', 'approved', 'rejected', 'suspended'];

const REVIEW_STATUSES = ['pending', 'approved', 'rejected'];

const REPORT_STATUSES = ['open', 'resolved', 'dismissed'];

const SUPPORT_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

const INVOICE_STATUSES = ['issued', 'cancelled'];

const PROMOTION_TYPES = ['discount', 'combo', 'bogo'];

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

module.exports = {
  ORDER_STATUSES,
  ORDER_PAYMENT_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  ORDER_TRANSITIONS,
  SHOP_STATUSES,
  REVIEW_STATUSES,
  REPORT_STATUSES,
  SUPPORT_STATUSES,
  INVOICE_STATUSES,
  PROMOTION_TYPES,
  ALLOWED_MIMES,
  MAX_IMAGE_SIZE,
  MIME_EXT,
};
