const SHOP_CAMEL_TO_SNAKE = {
  shopName: 'name',
  ownerId: 'owner_id',
  logoUrl: 'logo_url',
  bannerUrl: 'banner_url',
  approvalStatus: 'status',
  shopDescription: 'description',
  deliveryRange: 'delivery_range',
};

const SHOP_SNAKE_TO_CAMEL = {
  name: 'shopName',
  owner_id: 'ownerId',
  logo_url: 'logoUrl',
  banner_url: 'bannerUrl',
  status: 'approvalStatus',
  description: 'shopDescription',
  delivery_range: 'deliveryRange',
};

const PRODUCT_CAMEL_TO_SNAKE = {
  productName: 'name',
  productDescription: 'description',
  imageUrl: 'image_url',
  isAvailable: 'is_available',
  categoryId: 'category_id',
  shopId: 'shop_id',
};

const PRODUCT_SNAKE_TO_CAMEL = {
  name: 'productName',
  description: 'productDescription',
  image_url: 'imageUrl',
  is_available: 'isAvailable',
  category_id: 'categoryId',
  shop_id: 'shopId',
};

const ORDER_CAMEL_TO_SNAKE = {
  userId: 'user_id',
  shopId: 'shop_id',
  deliveryType: 'delivery_type',
  transactionRef: 'transaction_ref',
  paymentMethod: 'payment.method',
  statusHistory: 'status_history',
};

const ORDER_SNAKE_TO_CAMEL = {
  user_id: 'userId',
  shop_id: 'shopId',
  delivery_type: 'deliveryType',
  transaction_ref: 'transactionRef',
  status_history: 'statusHistory',
};

const CUSTOMER_CAMEL_TO_SNAKE = {
  userId: 'user_id',
  fullName: 'full_name',
  defaultAddressId: 'default_address_id',
  isActive: 'is_active',
};

const CUSTOMER_SNAKE_TO_CAMEL = {
  user_id: 'userId',
  full_name: 'fullName',
  default_address_id: 'defaultAddressId',
  is_active: 'isActive',
};

const NOTIFICATION_CAMEL_TO_SNAKE = {
  userId: 'user_id',
  isRead: 'is_read',
};

const NOTIFICATION_SNAKE_TO_CAMEL = {
  user_id: 'userId',
  is_read: 'isRead',
};

const REVIEW_CAMEL_TO_SNAKE = {
  shopId: 'shop_id',
  orderId: 'order_id',
  customerId: 'customer_id',
  ownerReply: 'owner_reply',
  createdAt: 'created_at',
};

const REVIEW_SNAKE_TO_CAMEL = {
  shop_id: 'shopId',
  order_id: 'orderId',
  customer_id: 'customerId',
  owner_reply: 'ownerReply',
  replied_at: 'repliedAt',
  created_at: 'createdAt',
};

const REPORT_CAMEL_TO_SNAKE = {
  targetType: 'target_type',
  targetId: 'target_id',
  reportedBy: 'reported_by',
  assignedTo: 'assigned_to',
};

const REPORT_SNAKE_TO_CAMEL = {
  target_type: 'targetType',
  target_id: 'targetId',
  reported_by: 'reportedBy',
  assigned_to: 'assignedTo',
  resolved_at: 'resolvedAt',
  created_at: 'createdAt',
};

function mapKeys(obj, keyMap) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => mapKeys(item, keyMap));
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const mappedKey = keyMap[key] || key;
    result[mappedKey] = value;
  }
  return result;
}

function mapShopFromRequest(body) {
  return mapKeys(body, SHOP_CAMEL_TO_SNAKE);
}

function mapShopToResponse(doc) {
  return mapKeys(doc, SHOP_SNAKE_TO_CAMEL);
}

function mapProductFromRequest(body) {
  return mapKeys(body, PRODUCT_CAMEL_TO_SNAKE);
}

function mapProductToResponse(doc) {
  return mapKeys(doc, PRODUCT_SNAKE_TO_CAMEL);
}

function mapOrderFromRequest(body) {
  return mapKeys(body, ORDER_CAMEL_TO_SNAKE);
}

function mapOrderToResponse(doc) {
  return mapKeys(doc, ORDER_SNAKE_TO_CAMEL);
}

function mapCustomerFromRequest(body) {
  return mapKeys(body, CUSTOMER_CAMEL_TO_SNAKE);
}

function mapCustomerToResponse(doc) {
  return mapKeys(doc, CUSTOMER_SNAKE_TO_CAMEL);
}

function mapNotificationFromRequest(body) {
  return mapKeys(body, NOTIFICATION_CAMEL_TO_SNAKE);
}

function mapNotificationToResponse(doc) {
  return mapKeys(doc, NOTIFICATION_SNAKE_TO_CAMEL);
}

function mapReviewFromRequest(body) {
  return mapKeys(body, REVIEW_CAMEL_TO_SNAKE);
}

function mapReviewToResponse(doc) {
  return mapKeys(doc, REVIEW_SNAKE_TO_CAMEL);
}

function mapReportFromRequest(body) {
  return mapKeys(body, REPORT_CAMEL_TO_SNAKE);
}

function mapReportToResponse(doc) {
  return mapKeys(doc, REPORT_SNAKE_TO_CAMEL);
}

module.exports = {
  mapShopFromRequest,
  mapShopToResponse,
  mapProductFromRequest,
  mapProductToResponse,
  mapOrderFromRequest,
  mapOrderToResponse,
  mapCustomerFromRequest,
  mapCustomerToResponse,
  mapNotificationFromRequest,
  mapNotificationToResponse,
  mapReviewFromRequest,
  mapReviewToResponse,
  mapReportFromRequest,
  mapReportToResponse,
  mapKeys,
  SHOP_CAMEL_TO_SNAKE,
  SHOP_SNAKE_TO_CAMEL,
  PRODUCT_CAMEL_TO_SNAKE,
  PRODUCT_SNAKE_TO_CAMEL,
  ORDER_CAMEL_TO_SNAKE,
  ORDER_SNAKE_TO_CAMEL,
  CUSTOMER_CAMEL_TO_SNAKE,
  CUSTOMER_SNAKE_TO_CAMEL,
  NOTIFICATION_CAMEL_TO_SNAKE,
  NOTIFICATION_SNAKE_TO_CAMEL,
  REVIEW_CAMEL_TO_SNAKE,
  REVIEW_SNAKE_TO_CAMEL,
  REPORT_CAMEL_TO_SNAKE,
  REPORT_SNAKE_TO_CAMEL,
};
