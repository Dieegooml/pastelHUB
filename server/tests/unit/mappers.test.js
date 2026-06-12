const {
  mapShopFromRequest,
  mapShopToResponse,
  mapProductFromRequest,
  mapProductToResponse,
  mapOrderFromRequest,
  mapOrderToResponse,
  mapCustomerFromRequest,
  mapCustomerToResponse,
  mapKeys,
  SHOP_CAMEL_TO_SNAKE,
  PRODUCT_CAMEL_TO_SNAKE,
  ORDER_CAMEL_TO_SNAKE,
  CUSTOMER_CAMEL_TO_SNAKE,
} = require('../../src/utils/mappers');

describe('mapKeys', () => {
  it('mapea objetos segun keyMap', () => {
    const result = mapKeys({ shopName: 'Mi Tienda', ownerId: 'u-1' }, SHOP_CAMEL_TO_SNAKE);
    expect(result).toEqual({ name: 'Mi Tienda', owner_id: 'u-1' });
  });

  it('preserva claves no mapeadas', () => {
    const result = mapKeys({ shopName: 'Test', extraField: 'keep' }, SHOP_CAMEL_TO_SNAKE);
    expect(result.extraField).toBe('keep');
  });

  it('retorna null para null', () => {
    expect(mapKeys(null, {})).toBeNull();
  });

  it('retorna undefined para undefined', () => {
    expect(mapKeys(undefined, {})).toBeUndefined();
  });

  it('mapea arrays de objetos', () => {
    const result = mapKeys(
      [{ shopName: 'A' }, { shopName: 'B' }],
      SHOP_CAMEL_TO_SNAKE
    );
    expect(result).toEqual([{ name: 'A' }, { name: 'B' }]);
  });
});

describe('mapShopFromRequest / mapShopToResponse', () => {
  it('convierte camelCase a snake_case', () => {
    const result = mapShopFromRequest({
      shopName: 'Panadería',
      ownerId: 'owner-1',
      logoUrl: 'logo.jpg',
      bannerUrl: 'banner.jpg',
      shopDescription: 'Descripción',
      deliveryRange: 5,
    });
    expect(result).toEqual({
      name: 'Panadería',
      owner_id: 'owner-1',
      logo_url: 'logo.jpg',
      banner_url: 'banner.jpg',
      description: 'Descripción',
      delivery_range: 5,
    });
  });

  it('convierte snake_case a camelCase', () => {
    const result = mapShopToResponse({
      name: 'Panadería',
      owner_id: 'owner-1',
      logo_url: 'logo.jpg',
      status: 'approved',
    });
    expect(result).toEqual({
      shopName: 'Panadería',
      ownerId: 'owner-1',
      logoUrl: 'logo.jpg',
      approvalStatus: 'approved',
    });
  });
});

describe('mapProductFromRequest / mapProductToResponse', () => {
  it('convierte camelCase a snake_case', () => {
    const result = mapProductFromRequest({
      productName: 'Torta',
      productDescription: 'Rica torta',
      imageUrl: 'img.jpg',
      isAvailable: true,
      categoryId: 'cat-1',
      shopId: 'shop-1',
    });
    expect(result).toEqual({
      name: 'Torta',
      description: 'Rica torta',
      image_url: 'img.jpg',
      is_available: true,
      category_id: 'cat-1',
      shop_id: 'shop-1',
    });
  });

  it('convierte snake_case a camelCase', () => {
    const result = mapProductToResponse({
      name: 'Torta',
      is_available: true,
      shop_id: 'shop-1',
    });
    expect(result).toEqual({
      productName: 'Torta',
      isAvailable: true,
      shopId: 'shop-1',
    });
  });
});

describe('mapOrderFromRequest / mapOrderToResponse', () => {
  it('convierte camelCase a snake_case', () => {
    const result = mapOrderFromRequest({
      userId: 'u-1',
      shopId: 's-1',
      deliveryType: 'delivery',
    });
    expect(result).toEqual({
      user_id: 'u-1',
      shop_id: 's-1',
      delivery_type: 'delivery',
    });
  });

  it('convierte snake_case a camelCase', () => {
    const result = mapOrderToResponse({
      user_id: 'u-1',
      shop_id: 's-1',
      delivery_type: 'pickup',
    });
    expect(result).toEqual({
      userId: 'u-1',
      shopId: 's-1',
      deliveryType: 'pickup',
    });
  });
});

describe('mapCustomerFromRequest / mapCustomerToResponse', () => {
  it('convierte camelCase a snake_case', () => {
    const result = mapCustomerFromRequest({
      userId: 'u-1',
      fullName: 'Juan Pérez',
      defaultAddressId: 'addr-1',
      isActive: true,
    });
    expect(result).toEqual({
      user_id: 'u-1',
      full_name: 'Juan Pérez',
      default_address_id: 'addr-1',
      is_active: true,
    });
  });

  it('convierte snake_case a camelCase', () => {
    const result = mapCustomerToResponse({
      user_id: 'u-1',
      full_name: 'Juan Pérez',
      is_active: true,
    });
    expect(result).toEqual({
      userId: 'u-1',
      fullName: 'Juan Pérez',
      isActive: true,
    });
  });
});

describe('mapping tables export', () => {
  it('SHOP_CAMEL_TO_SNAKE tiene todos los mapeos esperados', () => {
    expect(SHOP_CAMEL_TO_SNAKE.shopName).toBe('name');
    expect(SHOP_CAMEL_TO_SNAKE.ownerId).toBe('owner_id');
    expect(SHOP_CAMEL_TO_SNAKE.logoUrl).toBe('logo_url');
  });

  it('PRODUCT_CAMEL_TO_SNAKE tiene todos los mapeos esperados', () => {
    expect(PRODUCT_CAMEL_TO_SNAKE.productName).toBe('name');
    expect(PRODUCT_CAMEL_TO_SNAKE.isAvailable).toBe('is_available');
    expect(PRODUCT_CAMEL_TO_SNAKE.shopId).toBe('shop_id');
  });

  it('ORDER_CAMEL_TO_SNAKE tiene todos los mapeos esperados', () => {
    expect(ORDER_CAMEL_TO_SNAKE.userId).toBe('user_id');
    expect(ORDER_CAMEL_TO_SNAKE.shopId).toBe('shop_id');
  });

  it('CUSTOMER_CAMEL_TO_SNAKE tiene todos los mapeos esperados', () => {
    expect(CUSTOMER_CAMEL_TO_SNAKE.userId).toBe('user_id');
    expect(CUSTOMER_CAMEL_TO_SNAKE.fullName).toBe('full_name');
  });
});
