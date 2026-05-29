const { admin, db } = require('./src/config/firebase');

async function seed() {
  console.log('=== PastelHub — Seed de datos de ejemplo ===\n');

  // ── 1. Usuarios ──────────────────────────────────────
  const usersData = [
    {
      uid: 'admin-001',
      email: 'admin@pastelhub.com',
      full_name: 'Admin PastelHub',
      phone: '+51 999 000 001',
      roles: ['admin'],
      isActive: true,
      addresses: [
        { street: 'Av. Principal 123', city: 'Lima', district: 'Miraflores', isDefault: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'owner-001',
      email: 'owner@dulcearomas.com',
      full_name: 'Carlos Dulce',
      phone: '+51 999 000 002',
      roles: ['owner'],
      isActive: true,
      addresses: [
        { street: 'Jr. Las Flores 456', city: 'Lima', district: 'Barranco', isDefault: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'customer-001',
      email: 'cliente@ejemplo.com',
      full_name: 'María Pérez',
      phone: '+51 999 000 003',
      roles: ['customer'],
      isActive: true,
      addresses: [
        { street: 'Calle Los Olivos 789', city: 'Lima', district: 'San Isidro', isDefault: true },
        { street: 'Av. Primavera 321', city: 'Lima', district: 'Surco', isDefault: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const u of usersData) {
    await db.collection('users').doc(u.uid).set(u);
    console.log(`  Usuario creado: ${u.email} (${u.roles.join(', ')})`);
  }

  // ── 2. Pastelería ────────────────────────────────────
  const shopRef = db.collection('pastryShops').doc();
  const shopId = shopRef.id;
  const catId1 = 'cat_tortas';
  const catId2 = 'cat_cupcakes';

  await shopRef.set({
    owner_id: 'owner-001',
    name: 'Dulce Aroma',
    description: 'Pastelería artesanal con más de 10 años de experiencia. Especialistas en tortas personalizadas.',
    logo_url: '',
    banner_url: '',
    address: 'Jr. Las Flores 456',
    city: 'Lima',
    district: 'Barranco',
    phone: '+51 999 111 222',
    email: 'contacto@dulcearoma.com',
    rating: 0,
    status: 'approved',
    categories: [
      { category_id: catId1, name: 'Tortas', image_url: '' },
      { category_id: catId2, name: 'Cupcakes', image_url: '' },
    ],
    schedules: [
      { day: 'Mon', open_time: '08:00', close_time: '20:00' },
      { day: 'Tue', open_time: '08:00', close_time: '20:00' },
      { day: 'Wed', open_time: '08:00', close_time: '20:00' },
      { day: 'Thu', open_time: '08:00', close_time: '20:00' },
      { day: 'Fri', open_time: '08:00', close_time: '20:00' },
      { day: 'Sat', open_time: '09:00', close_time: '18:00' },
      { day: 'Sun', open_time: '00:00', close_time: '00:00' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  console.log(`  Pastelería creada: Dulce Aroma (${shopId})`);
  console.log('  Categorías creadas: Tortas, Cupcakes');
  console.log('  Horarios creados (Lun–Sáb 8:00–20:00, Dom cerrado)');

  // ── 3. Productos ────────────────────────────────────
  const products = [
    {
      shop_id: shopId, category_id: catId1,
      name: 'Torta de Chocolate',
      description: 'Torta de chocolate belga con relleno de ganache',
      price: 89.90, stock: 10, image_url: '', is_available: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      shop_id: shopId, category_id: catId1,
      name: 'Torta de Fresa',
      description: 'Torta con fresas frescas y crema pastelera',
      price: 79.90, stock: 8, image_url: '', is_available: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      shop_id: shopId, category_id: catId2,
      name: 'Cupcake de Vainilla',
      description: 'Cupcake esponjoso con frosting de vainilla',
      price: 8.50, stock: 24, image_url: '', is_available: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      shop_id: shopId, category_id: catId2,
      name: 'Cupcake Red Velvet',
      description: 'Cupcake Red Velvet con frosting de queso',
      price: 9.90, stock: 20, image_url: '', is_available: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ];

  const productIds = [];
  for (const p of products) {
    const ref = await db.collection('products').add(p);
    productIds.push(ref.id);
    console.log(`  Producto creado: ${p.name} (${ref.id})`);

    if (p.name === 'Torta de Chocolate') {
      const vRef1 = await ref.collection('variants').add({ variantType: 'size', variantValue: 'Pequeña (6 porciones)', extraPrice: 0 });
      const vRef2 = await ref.collection('variants').add({ variantType: 'size', variantValue: 'Mediana (10 porciones)', extraPrice: 20 });
      const vRef3 = await ref.collection('variants').add({ variantType: 'size', variantValue: 'Grande (15 porciones)', extraPrice: 45 });
      await ref.collection('variants').add({ variantType: 'inscription', variantValue: 'Con inscripción personalizada', extraPrice: 10 });
      console.log('    Variantes: 3 tamaños + inscripción');
    }
  }

  // ── 4. Pedido ───────────────────────────────────────
  const orderRef = db.collection('orders').doc();
  const orderId = orderRef.id;
  const item1Ref = orderRef.collection('items').doc();
  await orderRef.set({
    customerId: 'customer-001',
    shopId,
    addressId: 'address-placeholder',
    status: 'delivered',
    deliveryType: 'delivery',
    scheduledAt: new Date().toISOString(),
    subtotal: 98.40, deliveryFee: 5.00, total: 103.40,
    notes: 'Tocar timbre, por favor',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await item1Ref.set({
    productId: productIds[0], quantity: 1, unitPrice: 89.90, subtotal: 89.90,
    customizationNotes: 'Tamaño mediano, inscripción: Feliz Cumpleaños',
  });
  const item2Ref = orderRef.collection('items').doc();
  await item2Ref.set({
    productId: productIds[2], quantity: 1, unitPrice: 8.50, subtotal: 8.50,
    customizationNotes: '',
  });
  console.log(`  Pedido creado: ${orderId} (entregado, S/ 103.40)`);

  // ── 5. Pago ──────────────────────────────────────────
  await db.collection('payments').add({
    orderId,
    paymentMethod: 'yape',
    paymentStatus: 'paid',
    amount: 103.40,
    transactionRef: 'TXN-' + Date.now(),
    paidAt: new Date().toISOString(),
  });
  console.log('  Pago creado: Yape, S/ 103.40');

  // ── 6. Promociones ────────────────────────────────────
  const now = new Date();
  const future = new Date(now.getTime() + 30 * 86400000);
  await db.collection('promotions').add({
    shop_id: shopId,
    name: '10% de descuento en tortas',
    type: 'discount',
    description: 'Aprovecha el 10% de descuento en tortas de la casa',
    discount_percentage: 10,
    discount_amount: null,
    combo_items: [],
    combo_price: null,
    product_ids: [productIds[0], productIds[1]],
    start_date: now.toISOString(),
    end_date: future.toISOString(),
    is_active: true,
  });
  console.log('  Promoción creada: 10% descuento en tortas');

  await db.collection('promotions').add({
    shop_id: shopId,
    name: '2x1 en cupcakes',
    type: 'bogo',
    description: 'Lleva 2 cupcakes al precio de 1',
    discount_percentage: null,
    discount_amount: null,
    combo_items: [],
    combo_price: null,
    product_ids: [productIds[2], productIds[3]],
    start_date: now.toISOString(),
    end_date: future.toISOString(),
    is_active: true,
  });
  console.log('  Promoción creada: 2x1 en cupcakes');

  // ── 7. Reseña ────────────────────────────────────────
  await db.collection('reviews').add({
    customerId: 'customer-001',
    shopId,
    orderId,
    rating: 5,
    comment: 'Excelente torta, llegó a tiempo y el sabor es increíble. Muy recomendada.',
    ownerReply: '¡Gracias María! Nos alegra que hayas disfrutado.',
    repliedAt: new Date().toISOString(),
    status: 'approved',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  });
  console.log('  Reseña creada: 5 estrellas (aprobada)');

  // ── Actualizar rating de la pastelería ───────────────
  await shopRef.update({ rating: 5.0 });

  // ── 8. Notificación ─────────────────────────────────
  await db.collection('notifications').add({
    userId: 'customer-001',
    type: 'order_update',
    title: 'Pedido entregado',
    message: 'Tu pedido en Dulce Aroma ha sido entregado. ¡Déjanos tu reseña!',
    isRead: false,
    createdAt: new Date().toISOString(),
  });
  await db.collection('notifications').add({
    userId: 'owner-001',
    type: 'new_review',
    title: 'Nueva reseña',
    message: 'María Pérez dejó una reseña de 5 estrellas en tu pastelería.',
    isRead: false,
    createdAt: new Date().toISOString(),
  });
  console.log('  Notificaciones creadas: 2');

  // ── 9. Reporte ──────────────────────────────────────
  await db.collection('reports').add({
    reportedBy: 'customer-001',
    targetType: 'review',
    targetId: 'placeholder-review-id',
    reason: 'Contenido inapropiado',
    status: 'open',
    assignedTo: null,
    createdAt: new Date().toISOString(),
  });
  console.log('  Reporte creado: open');

  // ── 10. Perfil customer ──────────────────────────────
  const custDoc = {
    uid: 'customer-001',
    defaultAddressId: '',
    createdAt: new Date().toISOString(),
  };
  await db.collection('customers').doc('customer-001').set(custDoc);

  const addrRef = db.collection('customers').doc('customer-001').collection('addresses').doc();
  await addrRef.set({
    street: 'Calle Los Olivos 789', city: 'Lima', district: 'San Isidro',
    reference: 'Cerca al parque', isDefault: true,
  });
  console.log('  Perfil customer creado con dirección\n');

  console.log('=== Seed completado exitosamente ===');
  process.exit(0);
}

seed().catch(err => {
  console.error('Error durante seed:', err);
  process.exit(1);
});
