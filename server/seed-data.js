const { admin, db } = require('./src/config/firebase');
const { faker } = require('@faker-js/faker/locale/es');

const CONFIG = {
  admin: 1,
  moderators: 2,
  owners: 6,
  customers: 20,
  shops: 6,
  minProducts: 5,
  maxProducts: 10,
  ordersPerCustomer: 2,
  minReviewsPerShop: 3,
  maxReviewsPerShop: 8,
  promotionsPerShop: 2,
  password: '123456',
  clean: process.argv.includes('--clean'),
  noAuth: process.argv.includes('--no-auth'),
};

process.argv.forEach((arg, i) => {
  const next = () => process.argv[i + 1];
  if (arg.startsWith('--customers=')) CONFIG.customers = parseInt(arg.split('=')[1]);
  if (arg.startsWith('--min-products=')) CONFIG.minProducts = parseInt(arg.split('=')[1]);
  if (arg.startsWith('--max-products=')) CONFIG.maxProducts = parseInt(arg.split('=')[1]);
  if (arg.startsWith('--orders=')) CONFIG.ordersPerCustomer = parseInt(arg.split('=')[1]);
});

const DISTRITOS = ['Miraflores', 'San Isidro', 'Barranco', 'Surco', 'San Miguel', 'Los Olivos', 'Magdalena', 'Jesús María', 'Lince', 'Pueblo Libre', 'San Borja', 'La Molina'];
const CIUDAD = 'Lima';
const STATUS_ORDEN = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'];
const METODOS_PAGO = ['yape', 'plin', 'card', 'cash'];
const DIAS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIPOS_NOTIFICACION = ['order_update', 'new_review', 'shop_approved', 'report_resolved', 'payment_confirmed', 'review_approved'];
const TIPOS_REPORTE = ['review', 'shop', 'product'];
const RAZONES_REPORTE = ['Contenido inapropiado', 'Publicidad engañosa', 'Producto en mal estado', 'Comportamiento ofensivo', 'Información falsa'];

const PASTELERIAS = [
  { name: 'Dulce Aroma', desc: 'Pastelería artesanal con más de 10 años de experiencia. Especialistas en tortas personalizadas y postres finos.', distrito: 'Miraflores' },
  { name: 'El Trigal', desc: 'Panadería y pastelería tradicional. Pan artesanal, empanadas y postres caseros desde 1998.', distrito: 'San Isidro' },
  { name: 'Doña Pepa', desc: 'Repostería peruana especializada en alfajores, turrones y queques de la abuela.', distrito: 'Barranco' },
  { name: 'La Casa del Bizcocho', desc: 'Bizcochos artesanales, tortas de cumpleaños y muffins recién horneados.', distrito: 'Surco' },
  { name: 'Helados & Postres', desc: 'Helados artesanales, postres fríos y batidos naturales con frutas peruanas.', distrito: 'San Miguel' },
  { name: 'Delicias del Perú', desc: 'Postres típicos peruanos: suspiro limeño, picarones, mazamorra y arroz con leche.', distrito: 'Los Olivos' },
];

const CATEGORIAS_POR_SHOP = [
  [{ name: 'Tortas' }, { name: 'Cupcakes' }, { name: 'Galletas' }, { name: 'Postres Especiales' }],
  [{ name: 'Panes' }, { name: 'Empanadas' }, { name: 'Postres' }, { name: 'Sándwiches' }],
  [{ name: 'Alfajores' }, { name: 'Turrones' }, { name: 'Queques' }, { name: 'Dulces' }],
  [{ name: 'Bizcochos' }, { name: 'Tortas' }, { name: 'Muffins' }, { name: 'Pays' }],
  [{ name: 'Helados' }, { name: 'Postres Fríos' }, { name: 'Batidos' }, { name: 'Crepas' }],
  [{ name: 'Postres Típicos' }, { name: 'Bocaditos' }, { name: 'Bebidas' }, { name: 'Dulces Criollos' }],
];

const PRODUCTOS_POR_CATEGORIA = {
  Tortas: ['Torta de Chocolate', 'Torta de Fresa', 'Torta Tres Leches', 'Torta Selva Negra', 'Torta de Vainilla', 'Torta de Zanahoria', 'Torta de Lucuma', 'Cheesecake'],
  Cupcakes: ['Cupcake de Vainilla', 'Cupcake Red Velvet', 'Cupcake de Chocolate', 'Cupcake de Fresa', 'Cupcake de Limón', 'Cupcake de Café'],
  Galletas: ['Galletas de Chocolate', 'Galletas de Avena', 'Galletas de Mantequilla', 'Galletas de Jengibre', 'Alfajores de Maicena'],
  'Postres Especiales': ['Suspiro Limeño', 'Mazamorra Morada', 'Arroz con Leche', 'Picarones', 'Crema Volteada'],
  Panes: ['Pan de Molde', 'Pan Ciabatta', 'Pan Frances', 'Pan Integral', 'Pan de Maíz', 'Pan de Queso', 'Baguette', 'Pan con Chicharrón'],
  Empanadas: ['Empanada de Carne', 'Empanada de Pollo', 'Empanada de Queso', 'Empanada de Humita', 'Empanada de Mariscos'],
  Postres: ['Alfajor de Chocolate', 'Suspiro Limeño', 'Torta de Chocolate', 'Flan de Caramelo', 'Mousse de Maracuyá'],
  Sándwiches: ['Club Sandwich', 'Sándwich de Pollo', 'Sándwich de Palta', 'Sándwich Mixto'],
  Alfajores: ['Alfajor de Chocolate', 'Alfajor de Maicena', 'Alfajor de Coco', 'Alfajor de Lucuma', 'Alfajor de Café'],
  Turrones: ['Turrón de Doña Pepa', 'Turrón de Chocolate', 'Turrón de Maní', 'Turrón de Coco'],
  Queques: ['Queque de Vainilla', 'Queque de Chocolate', 'Queque de Plátano', 'Queque de Naranja', 'Queque de Zanahoria'],
  Dulces: ['Dulce de Leche', 'Manjar Blanco', 'Chocotejas', 'Tejas de Ica', 'King Kong'],
  Bizcochos: ['Bizcocho de Vainilla', 'Bizcocho de Chocolate', 'Bizcocho de Naranja', 'Bizcocho de Limón', 'Bizcocho de Yogur', 'Bizcocho de Plátano'],
  Muffins: ['Muffin de Arándanos', 'Muffin de Chocolate', 'Muffin de Vainilla', 'Muffin de Zanahoria', 'Muffin de Plátano'],
  Pays: ['Pay de Manzana', 'Pay de Limón', 'Pay de Queso', 'Pay de Calabaza', 'Pay de Pecana'],
  Helados: ['Helado de Vainilla', 'Helado de Chocolate', 'Helado de Fresa', 'Helado de Lucuma', 'Helado de Café', 'Helado de Mango'],
  'Postres Fríos': ['Mousse de Maracuyá', 'Mousse de Chocolate', 'Mousse de Fresa', 'Panna Cotta', 'Tiramisú'],
  Batidos: ['Batido de Fresa', 'Batido de Chocolate', 'Batido de Vainilla', 'Batido de Mango', 'Batido de Plátano'],
  Crepas: ['Crepa de Dulce de Leche', 'Crepa de Chocolate', 'Crepa de Fresa', 'Crepa de Manjar Blanco'],
  'Postres Típicos': ['Suspiro Limeño', 'Mazamorra Morada', 'Arroz con Leche', 'Picarones', 'Crema Volteada', 'Mango con Leche'],
  Bocaditos: ['Bocadito de Chocolate', 'Bocadito de Vainilla', 'Bocadito de Café', 'Bocadito de Coco', 'Bocadito de Manjar Blanco'],
  Bebidas: ['Chicha Morada', 'Maracuyá Sour', 'Jugo de Mango', 'Jugo de Papaya', 'Emoliente', 'Infusión de Muña'],
  'Dulces Criollos': ['Manjar Blanco', 'Chocotejas', 'Tejas de Ica', 'King Kong', 'Dulce de Leche'],
  'Pasteles': ['Pastel de Papa', 'Pastel de Choclo', 'Pastel de Verduras'],
};

const nombresOwners = [
  'Carlos Dulce', 'Rosa Hornilla', 'Jorge Mantel', 'Lucía Batidor', 'Pedro Horno', 'Ana Merienda',
];
const emailsOwners = [
  'carlos@dulcearoma.com', 'rosa@eltrigal.com', 'jorge@donapepa.com',
  'lucia@casabizcocho.com', 'pedro@helados-postres.com', 'ana@deliciasperu.com',
];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function pickN(arr, n) { const shuffled = [...arr].sort(() => Math.random() - 0.5); return shuffled.slice(0, n); }
function randomBool(prob = 0.5) { return Math.random() < prob; }
function randomPrice(min, max) { return parseFloat((Math.random() * (max - min) + min).toFixed(2)); }
function generateEmail(name) {
  const [first, last] = name.toLowerCase().split(' ');
  return `${first}.${last || 'user'}${rand(100, 999)}@pastelhub.test`;
}
function isoDate(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}
function futureDate(daysAhead = 30) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

const dbRun = { created: {} };
function track(col) {
  if (!dbRun.created[col]) dbRun.created[col] = 0;
  dbRun.created[col]++;
}

async function cleanDatabase() {
  const collections = ['users', 'customers', 'pastryShops', 'products', 'orders', 'payments', 'reviews', 'notifications', 'reports', 'promotions', 'chatSessions'];
  for (const col of collections) {
    const snap = await db.collection(col).limit(500).get();
    if (snap.empty) continue;
    const batch = db.batch();
    let count = 0;
    snap.docs.forEach(doc => { batch.delete(doc.ref); count++; });
    await batch.commit();
    if (count >= 500) {
      const remaining = await db.collection(col).limit(500).get();
      if (!remaining.empty) {
        const b2 = db.batch();
        remaining.docs.forEach(doc => b2.delete(doc.ref));
        await b2.commit();
      }
    }
    console.log(`  ${col}: ${count} documentos eliminados`);
  }
}

async function createUsers() {
  console.log('\n── 1. USUARIOS ──');
  const uids = {};
  const usersToCreate = [];

  usersToCreate.push({
    email: 'admin@pastelhub.com', name: 'Admin PastelHub', phone: '+51 999 000 001',
    roles: ['admin'], distrito: pick(DISTRITOS),
  });
  for (let i = 1; i <= CONFIG.moderators; i++) {
    const name = faker.person.fullName();
    usersToCreate.push({
      email: `mod${i}@pastelhub.test`, name, phone: faker.phone.number('+51 9## ### ###'),
      roles: ['moderator'], distrito: pick(DISTRITOS),
    });
  }
  for (let i = 0; i < CONFIG.owners; i++) {
    usersToCreate.push({
      email: emailsOwners[i], name: nombresOwners[i], phone: faker.phone.number('+51 9## ### ###'),
      roles: ['owner'], distrito: PASTELERIAS[i].distrito,
    });
  }
  for (let i = 1; i <= CONFIG.customers; i++) {
    const name = faker.person.fullName();
    usersToCreate.push({
      email: `cliente${i}@pastelhub.test`, name, phone: faker.phone.number('+51 9## ### ###'),
      roles: ['customer'], distrito: pick(DISTRITOS),
    });
  }

  for (const u of usersToCreate) {
    let uid;
    if (!CONFIG.noAuth) {
      try {
        const userRecord = await admin.auth().createUser({ email: u.email, password: CONFIG.password, displayName: u.name });
        uid = userRecord.uid;
        await admin.auth().setCustomUserClaims(uid, { roles: u.roles });
      } catch (e) {
        if (e.code === 'auth/email-already-exists') {
          const userRecord = await admin.auth().getUserByEmail(u.email);
          uid = userRecord.uid;
          await admin.auth().setCustomUserClaims(uid, { roles: u.roles });
        } else {
          throw e;
        }
      }
    } else {
      uid = `${u.roles[0]}-${Date.now()}-${rand(1000, 9999)}`;
    }

    const numAddresses = u.roles.includes('admin') || u.roles.includes('owner') || u.roles.includes('moderator') ? rand(1, 2) : rand(1, 3);
    const addresses = [];
    for (let a = 0; a < numAddresses; a++) {
      addresses.push({
        address_id: `addr_${uid}_${a}`,
        street: faker.location.streetAddress(),
        city: CIUDAD,
        district: a === 0 ? u.distrito : pick(DISTRITOS),
        is_default: a === 0,
      });
    }

    await db.collection('users').doc(uid).set({
      uid,
      email: u.email,
      full_name: u.name,
      phone: u.phone,
      roles: u.roles,
      password_hash: '',
      isActive: true,
      addresses,
      createdAt: isoDate(rand(30, 90)),
      updatedAt: isoDate(rand(0, 5)),
    });
    track('users');
    uids[u.email] = uid;
    console.log(`  ${u.email.padEnd(30)} ${u.name.padEnd(22)} [${u.roles.join(',')}]`);
  }

  return uids;
}

async function createCustomerProfiles(uids) {
  console.log('\n── 2. PERFILES CUSTOMER ──');
  const customerUids = [];
  for (const [email, uid] of Object.entries(uids)) {
    if (email.startsWith('cliente')) customerUids.push(uid);
  }

  for (const uid of customerUids) {
    const numAddresses = rand(1, 3);
    let defaultAddrId = '';
    const addrIds = [];

    for (let a = 0; a < numAddresses; a++) {
      const addrRef = db.collection('customers').doc(uid).collection('addresses').doc();
      const addrData = {
        street: faker.location.streetAddress(),
        city: CIUDAD,
        district: pick(DISTRITOS),
        reference: randomBool() ? pick(['Cerca al parque', 'Frente al mercado', 'Al lado del banco', 'Cerca a la escuela', 'Edificio azul', 'Altura de la avenida']) : '',
        isDefault: a === 0,
      };
      if (a === 0) defaultAddrId = addrRef.id;
      await addrRef.set(addrData);
      addrIds.push(addrRef.id);
      track('customers.addresses');
    }

    await db.collection('customers').doc(uid).set({
      uid,
      defaultAddressId: defaultAddrId,
      phone: faker.phone.number('+51 9## ### ###'),
      createdAt: isoDate(rand(30, 90)),
    });
    track('customers');
  }
  console.log(`  ${customerUids.length} perfiles con ${customerUids.length * 2} direcciones aprox.`);
  return customerUids;
}

async function createShops(uids) {
  console.log('\n── 3. PASTELERÍAS ──');
  const ownerUids = [];
  for (const [email, uid] of Object.entries(uids)) {
    if (emailsOwners.includes(email)) ownerUids.push(uid);
  }

  const shopIds = [];
  for (let i = 0; i < PASTELERIAS.length; i++) {
    const p = PASTELERIAS[i];
    const ownerId = ownerUids[i];
    const shopRef = db.collection('pastryShops').doc();
    const shopId = shopRef.id;

    const schedules = DIAS.map(day => ({
      day,
      open_time: day === 'Sun' ? '00:00' : day === 'Sat' ? '09:00' : '08:00',
      close_time: day === 'Sun' ? '00:00' : day === 'Sat' ? '18:00' : '21:00',
    }));

    const categories = CATEGORIAS_POR_SHOP[i].map(c => ({
      category_id: `cat_${shopId}_${c.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: c.name,
      image_url: '',
    }));

    await shopRef.set({
      owner_id: ownerId,
      name: p.name,
      description: p.desc,
      logo_url: '',
      banner_url: '',
      address: faker.location.streetAddress(),
      city: CIUDAD,
      district: p.distrito,
      phone: faker.phone.number('+51 ## ### ####'),
      email: emailsOwners[i],
      rating: 0,
      status: 'approved',
      delivery_range: rand(3, 15),
      schedules,
      categories,
      createdAt: isoDate(rand(60, 180)),
      updatedAt: isoDate(rand(0, 10)),
    });
    track('pastryShops');
    shopIds.push(shopId);
    console.log(`  ${p.name.padEnd(25)} ${p.distrito.padEnd(15)} ${categories.map(c => c.name).join(', ').slice(0, 50)}`);
  }
  return { shopIds, ownerUids };
}

async function createProducts(shopIds) {
  console.log('\n── 4. PRODUCTOS ──');
  const allProductIds = {};
  const allCategoryIds = {};

  for (const shopId of shopIds) {
    const shopDoc = await db.collection('pastryShops').doc(shopId).get();
    const shopData = shopDoc.data();
    const categories = shopData.categories || [];
    allProductIds[shopId] = [];
    allCategoryIds[shopId] = categories.map(c => ({ id: c.category_id, name: c.name }));

    const numProducts = rand(CONFIG.minProducts, CONFIG.maxProducts);
    let productsAdded = 0;
    const catPool = categories.filter(c => (PRODUCTOS_POR_CATEGORIA[c.name] || []).length > 0);
    if (catPool.length === 0) continue;

    let catIndex = 0;
    while (productsAdded < numProducts) {
      const cat = catPool[catIndex % catPool.length];
      catIndex++;
      const availableNames = PRODUCTOS_POR_CATEGORIA[cat.name] || [];
      if (availableNames.length === 0) continue;
      const name = availableNames[productsAdded % availableNames.length];
      const hasVariants = randomBool(0.3);
      const price = rand(5, 55) + 0.90;

      const productRef = db.collection('products').doc();
      const productId = productRef.id;
      const variants = [];

      if (hasVariants) {
        const numVariants = rand(2, 4);
        for (let v = 0; v < numVariants; v++) {
          variants.push({
            variant_id: `var_${productId}_${v}`,
            type: 'size',
            value: pick(['Pequeño', 'Mediano', 'Grande', 'Extra Grande']),
            extra_price: rand(0, 30) + (v === 0 ? 0 : rand(5, 15)),
          });
        }
      }

      await productRef.set({
        shop_id: shopId,
        category_id: cat.category_id,
        name,
        description: faker.lorem.sentence({ min: 5, max: 15 }),
        price,
        stock: rand(5, 50),
        image_url: '',
        is_available: true,
        variants,
        createdAt: isoDate(rand(30, 90)),
        updatedAt: isoDate(rand(0, 5)),
      });
      track('products');
      allProductIds[shopId].push(productId);
      productsAdded++;
      console.log(`    ${name.padEnd(30)} S/ ${price.toFixed(2)} [${cat.name}]`);
    }
    console.log(`  ${shopData.name}: ${productsAdded} productos`);
  }
  return allProductIds;
}

async function createOrders(uids, shopIds, allProductIds) {
  console.log('\n── 5. ÓRDENES ──');
  const customerUids = [];
  for (const [email, uid] of Object.entries(uids)) {
    if (email.startsWith('cliente')) customerUids.push(uid);
  }

  const orderIds = [];
  let orderCount = 0;

  for (const custUid of customerUids) {
    const numOrders = rand(1, CONFIG.ordersPerCustomer);
    const custDoc = await db.collection('users').doc(custUid).get();
    const custName = custDoc.data()?.full_name || 'Cliente';

    for (let o = 0; o < numOrders; o++) {
      const shopId = pick(shopIds);
      const shopDoc = await db.collection('pastryShops').doc(shopId).get();
      const shopName = shopDoc.data()?.name || 'Pastelería';
      const products = allProductIds[shopId] || [];
      if (products.length === 0) continue;

      const orderRef = db.collection('orders').doc();
      const orderId = orderRef.id;
      const daysAgo = rand(0, 30);
      const maxStatusIndex = daysAgo < 1 ? 2 : STATUS_ORDEN.length - 1;
      const statusIndex = rand(0, maxStatusIndex);
      const status = STATUS_ORDEN[statusIndex];
      const history = [];
      for (let h = 0; h <= statusIndex; h++) {
        history.push(STATUS_ORDEN[h]);
      }

      const numItems = rand(1, 3);
      const selectedProducts = pickN(products, numItems);
      const items = [];
      let subtotal = 0;

      for (const prodId of selectedProducts) {
        const prodDoc = await db.collection('products').doc(prodId).get();
        const prodData = prodDoc.data();
        if (!prodData) continue;
        const qty = rand(1, 3);
        items.push({
          product_id: prodId,
          name: prodData.name,
          quantity: qty,
          price_at_purchase: prodData.price,
        });
        subtotal += prodData.price * qty;
      }

      if (items.length === 0) continue;

      const deliveryFee = rand(3, 12);
      const total = parseFloat((subtotal + deliveryFee).toFixed(2));

      await orderRef.set({
        customer: { user_id: custUid, name: custName },
        shop: { shop_id: shopId, name: shopName },
        status,
        status_history: history,
        delivery_type: randomBool(0.7) ? 'delivery' : 'pickup',
        items,
        totals: { subtotal: parseFloat(subtotal.toFixed(2)), delivery_fee: deliveryFee, total },
        payment: { method: pick(METODOS_PAGO), status: status === 'delivered' ? 'paid' : 'pending', transaction_ref: '' },
        notes: randomBool(0.3) ? faker.lorem.sentence() : '',
        createdAt: isoDate(daysAgo),
        updatedAt: isoDate(Math.max(0, daysAgo - rand(0, 3))),
      });
      track('orders');
      orderIds.push(orderId);
      orderCount++;
      if (orderCount % 10 === 0) console.log(`  ${orderCount} órdenes creadas...`);
    }
  }
  console.log(`  ${orderCount} órdenes creadas`);
  return orderIds;
}

async function createPayments(orderIds) {
  console.log('\n── 6. PAGOS ──');
  let count = 0;
  for (const orderId of orderIds) {
    const orderDoc = await db.collection('orders').doc(orderId).get();
    const orderData = orderDoc.data();
    if (!orderData) continue;

    const isPaid = orderData.status === 'delivered';
    await db.collection('payments').add({
      orderId,
      paymentMethod: orderData.payment?.method || pick(METODOS_PAGO),
      paymentStatus: isPaid ? 'paid' : 'pending',
      amount: orderData.totals?.total || 0,
      transactionRef: isPaid ? `TXN-${orderId.slice(0, 8)}` : '',
      paidAt: isPaid ? isoDate(rand(0, 5)) : '',
      createdAt: orderData.createdAt || isoDate(),
    });
    track('payments');
    count++;
  }
  console.log(`  ${count} pagos creados (1:1 con órdenes)`);
}

async function createReviews(uids, shopIds, orderIds) {
  console.log('\n── 7. RESEÑAS ──');
  const customerUids = [];
  for (const [email, uid] of Object.entries(uids)) {
    if (email.startsWith('cliente')) customerUids.push(uid);
  }

  let reviewCount = 0;
  for (const shopId of shopIds) {
    const numReviews = rand(CONFIG.minReviewsPerShop, CONFIG.maxReviewsPerShop);
    const shopOrders = [];
    for (const orderId of orderIds) {
      const orderDoc = await db.collection('orders').doc(orderId).get();
      const orderData = orderDoc.data();
      if (orderData && orderData.shop?.shop_id === shopId && orderData.status === 'delivered') {
        shopOrders.push({ id: orderId, customerId: orderData.customer?.user_id });
      }
    }

    for (let r = 0; r < numReviews && r < shopOrders.length; r++) {
      const order = shopOrders[r];
      const rating = rand(1, 5);
      const isApproved = rating >= 3;

      const reviewData = {
        customerId: order.customerId,
        shopId,
        orderId: order.id,
        rating,
        comment: rating >= 4
          ? pick(['Excelente producto, volveré a pedir', 'Muy buena calidad y rápido servicio', 'Delicioso, superó mis expectativas', 'Recomendado 100%, todo fresco y delicioso'])
          : pick(['Podría mejorar', 'El producto llegó un poco tarde', 'No era lo que esperaba', 'Regular, nada especial', 'Bueno pero caro para lo que ofrece']),
        ownerReply: '',
        repliedAt: '',
        status: isApproved ? 'approved' : pick(['pending', 'rejected']),
        createdAt: isoDate(rand(1, 15)),
      };

      if (randomBool(0.4) && isApproved) {
        reviewData.ownerReply = pick(['¡Gracias por tu reseña!', 'Nos alegra que hayas disfrutado. ¡Vuelve pronto!', 'Gracias por preferirnos.']);
        reviewData.repliedAt = isoDate(rand(0, 3));
      }

      await db.collection('reviews').add(reviewData);
      track('reviews');
      reviewCount++;
    }
  }
  console.log(`  ${reviewCount} reseñas creadas`);

  for (const shopId of shopIds) {
    const reviewsSnap = await db.collection('reviews').where('shopId', '==', shopId).where('status', '==', 'approved').get();
    if (!reviewsSnap.empty) {
      let sum = 0;
      reviewsSnap.docs.forEach(d => { sum += d.data().rating || 0; });
      const avg = parseFloat((sum / reviewsSnap.size).toFixed(1));
      await db.collection('pastryShops').doc(shopId).update({ rating: avg });
    }
  }
}

async function createPromotions(shopIds, allProductIds) {
  console.log('\n── 8. PROMOCIONES ──');
  let count = 0;
  const types = ['discount', 'combo', 'bogo'];
  for (const shopId of shopIds) {
    const shopDoc = await db.collection('pastryShops').doc(shopId).get();
    const shopName = shopDoc.data()?.name || '';
    const products = allProductIds[shopId] || [];
    if (products.length === 0) continue;

    for (let p = 0; p < CONFIG.promotionsPerShop; p++) {
      const type = types[p % types.length];
      const promotionData = {
        shop_id: shopId,
        name: '',
        type,
        description: '',
        discount_percentage: null,
        discount_amount: null,
        combo_items: [],
        combo_price: null,
        product_ids: pickN(products, rand(2, 4)),
        start_date: isoDate(rand(0, 5)),
        end_date: futureDate(rand(15, 45)),
        is_active: true,
        createdAt: isoDate(rand(10, 30)),
        updatedAt: isoDate(rand(0, 3)),
      };

      switch (type) {
        case 'discount': {
          const pct = pick([10, 15, 20, 25, 30, 50]);
          promotionData.name = `${pct}% de descuento`;
          promotionData.description = `Aprovecha el ${pct}% de descuento en productos seleccionados de ${shopName}`;
          promotionData.discount_percentage = pct;
          break;
        }
        case 'combo': {
          const comboPrice = randomPrice(15, 40);
          promotionData.name = `Combo especial S/ ${comboPrice.toFixed(2)}`;
          promotionData.description = `Combo especial de ${shopName} por solo S/ ${comboPrice.toFixed(2)}`;
          promotionData.combo_items = pickN(products, rand(2, 3));
          promotionData.combo_price = comboPrice;
          break;
        }
        case 'bogo': {
          promotionData.name = '2x1';
          promotionData.description = `Lleva 2 productos al precio de 1 en ${shopName}`;
          break;
        }
      }
      await db.collection('promotions').add(promotionData);
      track('promotions');
      count++;
    }
  }
  console.log(`  ${count} promociones creadas`);
}

async function createNotifications(uids, orderIds, shopIds, shopOwners) {
  console.log('\n── 9. NOTIFICACIONES ──');
  const customerUids = [];
  for (const [email, uid] of Object.entries(uids)) {
    if (email.startsWith('cliente')) customerUids.push(uid);
  }

  const ownerByShop = {};
  for (const [shopId, ownerId] of Object.entries(shopOwners)) {
    ownerByShop[shopId] = ownerId;
  }

  const orderDataMap = [];
  const batchSize = 20;
  for (let i = 0; i < Math.min(orderIds.length, batchSize); i++) {
    const snap = await db.collection('orders').doc(orderIds[i]).get();
    if (snap.exists) orderDataMap.push({ id: orderIds[i], ...snap.data() });
  }

  const batch = db.batch();
  let count = 0;
  let batchOps = 0;

  function scheduleNotif(data) {
    const ref = db.collection('notifications').doc();
    batch.set(ref, data);
    track('notifications');
    count++;
    batchOps++;
    if (batchOps >= 400) {
      return true;
    }
    return false;
  }

  for (const orderData of orderDataMap) {
    const custId = orderData.customer?.user_id;
    const shopId = orderData.shop?.shop_id;
    if (custId) {
      if (scheduleNotif({
        userId: custId, type: 'order_update',
        title: 'Actualización de pedido',
        message: `Tu pedido en ${orderData.shop?.name || 'la pastelería'} está ${orderData.status === 'delivered' ? 'entregado' : 'en proceso'}.`,
        isRead: randomBool(0.3), createdAt: isoDate(rand(0, 10)),
      })) { await batch.commit(); batchOps = 0; }
    }
    if (shopId && ownerByShop[shopId]) {
      if (scheduleNotif({
        userId: ownerByShop[shopId], type: 'new_order',
        title: 'Nuevo pedido recibido',
        message: `Has recibido un nuevo pedido de ${orderData.customer?.name || 'un cliente'}.`,
        isRead: randomBool(0.5), createdAt: isoDate(rand(0, 10)),
      })) { await batch.commit(); batchOps = 0; }
    }
  }

  for (const custId of pickN(customerUids, Math.min(5, customerUids.length))) {
    if (scheduleNotif({
      userId: custId, type: pick(TIPOS_NOTIFICACION),
      title: 'Promoción disponible',
      message: '¡Hay nuevas promociones esperándote! Revisa las ofertas de tus pastelerías favoritas.',
      isRead: false, createdAt: isoDate(rand(0, 3)),
    })) { await batch.commit(); batchOps = 0; }
  }

  if (batchOps > 0) await batch.commit();
  console.log(`  ${count} notificaciones creadas`);
}

async function createReports(uids) {
  console.log('\n── 10. REPORTES ──');
  const customerUids = [];
  for (const [email, uid] of Object.entries(uids)) {
    if (email.startsWith('cliente')) customerUids.push(uid);
  }

  const numReports = Math.min(5, customerUids.length);
  const reportIds = [];

  for (let i = 0; i < numReports; i++) {
    const reportedBy = customerUids[i];
    const status = pick(['open', 'resolved', 'dismissed']);
    await db.collection('reports').add({
      reportedBy,
      targetType: pick(TIPOS_REPORTE),
      targetId: `target-${Date.now()}-${i}`,
      reason: pick(RAZONES_REPORTE),
      status,
      assignedTo: status === 'open' ? null : pick(Object.values(uids).slice(0, 3)),
      createdAt: isoDate(rand(1, 15)),
    });
    track('reports');
    reportIds.push(reportedBy);
  }
  console.log(`  ${numReports} reportes creados`);
}

async function seed() {
  console.log('═══════════════════════════════════════════');
  console.log('  PastelHub — Seed de datos masivos');
  console.log('═══════════════════════════════════════════\n');

  if (CONFIG.clean) {
    console.log('🧹 Limpiando datos existentes...');
    await cleanDatabase();
    console.log('  Base de datos limpiada.\n');
  }

  const startTime = Date.now();

  const uids = await createUsers();
  const customerUids = await createCustomerProfiles(uids);
  const { shopIds, ownerUids } = await createShops(uids);
  const shopOwners = {};
  shopIds.forEach((sid, i) => { shopOwners[sid] = ownerUids[i % ownerUids.length]; });
  const allProductIds = await createProducts(shopIds);
  const orderIds = await createOrders(uids, shopIds, allProductIds);
  await createPayments(orderIds);
  await createReviews(uids, shopIds, orderIds);
  await createPromotions(shopIds, allProductIds);
  await createNotifications(uids, orderIds, shopIds, shopOwners);
  await createReports(uids);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n═══════════════════════════════════════════');
  console.log('  RESULTADOS');
  console.log('═══════════════════════════════════════════');
  const total = Object.values(dbRun.created).reduce((a, b) => a + b, 0);
  for (const [col, count] of Object.entries(dbRun.created)) {
    console.log(`  ${col.padEnd(25)} ${count}`);
  }
  console.log('  ─────────────────────────────────────────');
  console.log(`  TOTAL: ${total} documentos en ${Object.keys(dbRun.created).length} colecciones`);
  console.log(`  Tiempo: ${elapsed}s`);
  console.log('═══════════════════════════════════════════\n');

  if (!CONFIG.noAuth) {
    console.log('📧 Credenciales de acceso (contraseña: 123456):');
    console.log(`  Admin:     admin@pastelhub.com`);
    for (let i = 0; i < CONFIG.owners; i++) {
      console.log(`  Owner ${i + 1}:  ${emailsOwners[i]}`);
    }
    console.log(`  Clientes:  cliente1@pastelhub.test ... cliente${CONFIG.customers}@pastelhub.test`);
  }
  console.log('');
  process.exit(0);
}

seed().catch(err => {
  console.error('Error durante seed:', err);
  process.exit(1);
});
