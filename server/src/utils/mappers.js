const SHOP_CAMEL_TO_SNAKE = {
  shopName: 'name',
  ownerId: 'owner_id',
  logoUrl: 'logo_url',
  bannerUrl: 'banner_url',
  approvalStatus: 'status',
  shopDescription: 'description',
};

const SHOP_SNAKE_TO_CAMEL = {
  name: 'shopName',
  owner_id: 'ownerId',
  logo_url: 'logoUrl',
  banner_url: 'bannerUrl',
  status: 'approvalStatus',
  description: 'shopDescription',
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

function mapKeys(obj, keyMap) {
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

module.exports = {
  mapShopFromRequest,
  mapShopToResponse,
  mapProductFromRequest,
  mapProductToResponse,
};