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
  await shopRef.set({
    ownerId: 'owner-001',
    shopName: 'Dulce Aroma',
    description: 'Pastelería artesanal con más de 10 años de experiencia. Especialistas en tortas personalizadas.',
    logoUrl: '',
    bannerUrl: '',
    address: 'Jr. Las Flores 456',
    city: 'Lima',
    district: 'Barranco',
    phone: '+51 999 111 222',
    email: 'contacto@dulcearoma.com',
    rating: 0,
    isActive: true,
    approvalStatus: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  console.log(`  Pastelería creada: Dulce Aroma (${shopId})`);

  // ── 3. Categorías ────────────────────────────────────
  const catRef1 = db.collection('pastryShops').doc(shopId).collection('categories').doc();
  await catRef1.set({ categoryName: 'Tortas', description: 'Tortas clásicas y personalizadas', isActive: true });
  const catId1 = catRef1.id;

  const catRef2 = db.collection('pastryShops').doc(shopId).collection('categories').doc();
  await catRef2.set({ categoryName: 'Cupcakes', description: 'Cupcakes decorados', isActive: true });
  const catId2 = catRef2.id;
  console.log('  Categorías creadas: Tortas, Cupcakes');

  // ── 4. Horarios ──────────────────────────────────────
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const scheduleData = { openTime: '08:00', closeTime: '20:00', isClosed: false };

  for (const day of days) {
    await db.collection('pastryShops').doc(shopId).collection('schedules').doc(day).set(scheduleData);
  }
  await db.collection('pastryShops').doc(shopId).collection('schedules').doc('Domingo').set({
    openTime: '00:00', closeTime: '00:00', isClosed: true,
  });
  console.log('  Horarios creados (Lun–Sáb 8:00–20:00, Dom cerrado)');

  // ── 5. Productos ─────────────────────────────────────
  const products = [
    {
      shopId, categoryId: catId1,
      productName: 'Torta de Chocolate',
      description: 'Torta de chocolate belga con relleno de ganache',
      price: 89.90, stock: 10, imageUrl: '', isAvailable: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      shopId, categoryId: catId1,
      productName: 'Torta de Fresa',
      description: 'Torta con fresas frescas y crema pastelera',
      price: 79.90, stock: 8, imageUrl: '', isAvailable: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      shopId, categoryId: catId2,
      productName: 'Cupcake de Vainilla',
      description: 'Cupcake esponjoso con frosting de vainilla',
      price: 8.50, stock: 24, imageUrl: '', isAvailable: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      shopId, categoryId: catId2,
      productName: 'Cupcake Red Velvet',
      description: 'Cupcake Red Velvet con frosting de queso',
      price: 9.90, stock: 20, imageUrl: '', isAvailable: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ];

  const productIds = [];
  for (const p of products) {
    const ref = await db.collection('products').add(p);
    productIds.push(ref.id);
    console.log(`  Producto creado: ${p.productName} (${ref.id})`);

    if (p.productName === 'Torta de Chocolate') {
      const vRef1 = await ref.collection('variants').add({ variantType: 'size', variantValue: 'Pequeña (6 porciones)', extraPrice: 0 });
      const vRef2 = await ref.collection('variants').add({ variantType: 'size', variantValue: 'Mediana (10 porciones)', extraPrice: 20 });
      const vRef3 = await ref.collection('variants').add({ variantType: 'size', variantValue: 'Grande (15 porciones)', extraPrice: 45 });
      await ref.collection('variants').add({ variantType: 'inscription', variantValue: 'Con inscripción personalizada', extraPrice: 10 });
      console.log('    Variantes: 3 tamaños + inscripción');
    }
  }

  // ── 6. Pedido ───────────────────────────────────────
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

  // ── 7. Pago ──────────────────────────────────────────
  await db.collection('payments').add({
    orderId,
    paymentMethod: 'yape',
    paymentStatus: 'paid',
    amount: 103.40,
    transactionRef: 'TXN-' + Date.now(),
    paidAt: new Date().toISOString(),
  });
  console.log('  Pago creado: Yape, S/ 103.40');

  // ── 8. Reseña ────────────────────────────────────────
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

  // ── 9. Notificación ──────────────────────────────────
  await db.collection('notifications').add({
    userId: 'customer-001',
    type: 'order_update',
    message: 'Tu pedido en Dulce Aroma ha sido entregado. ¡Déjanos tu reseña!',
    isRead: false,
    createdAt: new Date().toISOString(),
  });
  await db.collection('notifications').add({
    userId: 'owner-001',
    type: 'new_review',
    message: 'María Pérez dejó una reseña de 5 estrellas en tu pastelería.',
    isRead: false,
    createdAt: new Date().toISOString(),
  });
  console.log('  Notificaciones creadas: 2');

  // ── 10. Reporte ──────────────────────────────────────
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

  // ── 11. Perfil customer ──────────────────────────────
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
