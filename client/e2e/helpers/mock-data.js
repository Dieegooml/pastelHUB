export const mockShops = {
  data: [
    {
      id: 'shop-1',
      shopName: 'Pastelería Delicias',
      city: 'Lima',
      shopDescription: 'Las mejores tortas y postres artesanales de la ciudad',
      approvalStatus: 'approved',
      rating: 4.5,
      phone: '999888777',
      address: 'Av. Principal 123, Miraflores',
      categories: ['Tortas', 'Postres', 'Pasteles'],
      logoUrl: null,
      bannerUrl: null,
    },
    {
      id: 'shop-2',
      shopName: 'Dulce Tentación',
      city: 'Arequipa',
      shopDescription: 'Repostería fina con ingredientes locales',
      approvalStatus: 'approved',
      rating: 4.2,
      phone: '999888776',
      address: 'Calle Real 456, Cercado',
      categories: ['Postres', 'Dulces'],
      logoUrl: null,
      bannerUrl: null,
    },
    {
      id: 'shop-3',
      shopName: 'Panadería El Trigal',
      city: 'Lima',
      shopDescription: 'Pan artesanal y pastelería tradicional',
      approvalStatus: 'approved',
      rating: 3.8,
      phone: '999888775',
      address: 'Jr. Las Flores 789, San Isidro',
      categories: ['Pan', 'Tortas'],
      logoUrl: null,
      bannerUrl: null,
    },
  ],
};

export const mockProducts = [
  {
    id: 'prod-1',
    name: 'Torta de Chocolate',
    description: 'Deliciosa torta de chocolate con cobertura de ganache',
    price: 45.00,
    image_url: null,
    category: 'Tortas',
    is_active: true,
    stock: 10,
  },
  {
    id: 'prod-2',
    name: 'Alfajores de Maicena',
    description: 'Alfajores tradicionales con dulce de leche',
    price: 12.00,
    image_url: null,
    category: 'Postres',
    is_active: true,
    stock: 50,
  },
  {
    id: 'prod-3',
    name: 'Cupcakes Variados',
    description: 'Set de 6 cupcakes decorados',
    price: 35.00,
    image_url: null,
    category: 'Pasteles',
    is_active: true,
    stock: 20,
  },
];

export const mockOrders = {
  data: [
    {
      id: 'ord-1',
      shop_id: 'shop-1',
      shop_name: 'Pastelería Delicias',
      status: 'pending',
      total: 57.00,
      created_at: new Date().toISOString(),
      items: [
        { product_id: 'prod-1', name: 'Torta de Chocolate', quantity: 1, price: 45.00 },
        { product_id: 'prod-2', name: 'Alfajores de Maicena', quantity: 1, price: 12.00 },
      ],
    },
  ],
};

export const mockNotifications = {
  data: [
    {
      id: 'notif-1',
      type: 'order_update',
      message: 'Tu orden #ord-1 ha sido confirmada',
      isRead: false,
      created_at: new Date().toISOString(),
    },
  ],
};
