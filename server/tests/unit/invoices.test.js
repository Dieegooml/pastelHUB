const request = require('supertest');
const app = require('../../src/app');

const ORDER_DATA = {
  id: 'o1',
  shop: { shop_id: 's1', name: 'Pasteleria Test' },
  customer: { user_id: 'u1', name: 'Juan Perez' },
  items: [{ name: 'Pastel', quantity: 2, price_at_purchase: 15 }],
  totals: { subtotal: 30, delivery_fee: 5, total: 35 },
  delivery_type: 'delivery',
  payment: { method: 'yape', status: 'paid' },
};

describe('POST /api/invoices', () => {
  it('responde 401 sin token', async () => {
    const res = await request(app).post('/api/invoices').send({ orderId: 'o1' });
    expect(res.status).toBe(401);
  });

  it('responde 403 si no es admin', async () => {
    global.mockToken('customer-uid', ['customer']);
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', 'Bearer token-valido')
      .send({ orderId: 'o1' });
    expect(res.status).toBe(403);
  });

  it('crea factura correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);

    global.mockFirestore.get
      .mockResolvedValueOnce({ exists: true, id: 'o1', data: () => ORDER_DATA })
      .mockResolvedValueOnce({ empty: true })
      .mockResolvedValueOnce({ exists: true, data: () => ({ name: 'Pasteleria Test' }) })
      .mockResolvedValueOnce({ exists: true, data: () => ({ name: 'Juan Perez', email: 'juan@test.com' }) })
      .mockResolvedValueOnce({ empty: false, docs: [{ data: () => ({ paymentMethod: 'yape', paymentStatus: 'paid' }) }] });

    global.mockFirestore.add.mockResolvedValue({ id: 'inv-1' });
    global.mockFirestore.runTransaction = jest.fn(async (cb) => {
      const t = {
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ nextNumber: 5 }) }),
        set: jest.fn(),
      };
      return cb(t);
    });

    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', 'Bearer token-valido')
      .send({ orderId: 'o1' });
    expect(res.status).toBe(201);
    expect(res.body.invoiceNumber).toMatch(/^INV-\d{6}$/);
  });

  it('responde 400 si la orden ya tiene factura', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get
      .mockResolvedValueOnce({ exists: true, id: 'o1', data: () => ORDER_DATA })
      .mockResolvedValueOnce({ empty: false });

    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', 'Bearer token-valido')
      .send({ orderId: 'o1' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/invoices', () => {
  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/invoices');
    expect(res.status).toBe(401);
  });

  it('lista facturas como admin', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'inv-1', invoiceNumber: 'INV-000001', total: 35 }]);
    const res = await request(app)
      .get('/api/invoices')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/invoices/:id', () => {
  it('responde 404 si no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/invoices/inv-inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });

  it('responde 200 con la factura', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValue({ exists: true, data: () => ({
      invoiceNumber: 'INV-000001', total: 35, customerId: 'u1',
    }), id: 'test-id' });
    const res = await request(app)
      .get('/api/invoices/inv-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.invoiceNumber).toBe('INV-000001');
  });
});

describe('GET /api/invoices/:id/pdf', () => {
  it('descarga PDF de factura existente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({
      invoiceNumber: 'INV-000001',
      shopName: 'Pasteleria Test',
      customerName: 'Juan Perez',
      customerEmail: 'juan@test.com',
      items: [{ name: 'Pastel', quantity: 1, price_at_purchase: 20 }],
      subtotal: 20,
      deliveryFee: 5,
      total: 25,
      deliveryType: 'delivery',
      paymentMethod: 'yape',
      paymentStatus: 'paid',
      issueDate: new Date().toISOString(),
      status: 'issued',
      customerId: 'u1',
    });
    const res = await request(app)
      .get('/api/invoices/inv-1/pdf')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });
});

describe('PATCH /api/invoices/:id/status', () => {
  it('anula factura como admin', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'issued', customerId: 'u1' });
    const res = await request(app)
      .patch('/api/invoices/inv-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'cancelled' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  it('responde 403 si no es admin', async () => {
    global.mockToken('owner-uid', ['owner']);
    const res = await request(app)
      .patch('/api/invoices/inv-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'cancelled' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/invoices/order/:orderId', () => {
  it('responde 404 si no hay factura para la orden', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ empty: true });
    const res = await request(app)
      .get('/api/invoices/order/o-inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });

  it('customer puede ver factura de su propia orden', async () => {
    global.mockToken('u1', ['customer']);
    global.mockFirestore.get.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'inv-1', data: () => ({ customerId: 'u1', orderId: 'o1' }) }],
    });
    const res = await request(app)
      .get('/api/invoices/order/o1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('customer recibe 403 si la orden no le pertenece', async () => {
    global.mockToken('u1', ['customer']);
    global.mockFirestore.get.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'inv-1', data: () => ({ customerId: 'otro', orderId: 'o1' }) }],
    });
    const res = await request(app)
      .get('/api/invoices/order/o-ajena')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(403);
  });
});

describe('GET /api/invoices - filtros y roles', () => {
  it('filtra por customerId si no es admin ni moderator', async () => {
    global.mockToken('u1', ['customer']);
    global.mockCollection([{ id: 'inv-1', customerId: 'u1', invoiceNumber: 'INV-000001' }]);
    const res = await request(app)
      .get('/api/invoices')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(global.mockFirestore.where).toHaveBeenCalledWith('customerId', '==', 'u1');
  });

  it('moderador requiere parametro shop_id', async () => {
    global.mockToken('mod-uid', ['moderator']);
    const res = await request(app)
      .get('/api/invoices')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('shop_id');
  });

  it('moderador con shop_id funciona', async () => {
    global.mockToken('mod-uid', ['moderator']);
    global.mockCollection([{ id: 'inv-1', shop_id: 's1', invoiceNumber: 'INV-000001' }]);
    const res = await request(app)
      .get('/api/invoices')
      .set('Authorization', 'Bearer token-valido')
      .query({ shop_id: 's1' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('admin filtra por shop_id', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'inv-1', shop_id: 's1', invoiceNumber: 'INV-000001' }]);
    const res = await request(app)
      .get('/api/invoices')
      .set('Authorization', 'Bearer token-valido')
      .query({ shop_id: 's1' });
    expect(res.status).toBe(200);
    expect(global.mockFirestore.where).toHaveBeenCalledWith('shop_id', '==', 's1');
  });

  it('owner solo ve sus propias facturas (customerId)', async () => {
    global.mockToken('owner-uid', ['owner']);
    global.mockCollection([{ id: 'inv-1', customerId: 'owner-uid', invoiceNumber: 'INV-000001' }]);
    const res = await request(app)
      .get('/api/invoices')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(global.mockFirestore.where).toHaveBeenCalledWith('customerId', '==', 'owner-uid');
  });
});

describe('GET /api/invoices/shop/:shopId', () => {
  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/invoices/shop/s1');
    expect(res.status).toBe(401);
  });

  it('responde 404 si la pasteleria no existe', async () => {
    global.mockToken('owner-uid', ['owner']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/invoices/shop/s-inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });

  it('lista facturas de la pasteleria como owner dueno', async () => {
    global.mockToken('owner-uid', ['owner']);
    global.mockCollection([{ id: 'inv-1', invoiceNumber: 'INV-000001', shop_id: 's1' }]);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ owner_id: 'owner-uid' }) });
    const res = await request(app)
      .get('/api/invoices/shop/s1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].invoiceNumber).toBe('INV-000001');
  });

  it('responde 403 si no es owner ni admin', async () => {
    global.mockToken('customer-uid', ['customer']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ owner_id: 'owner-uid' }) });
    const res = await request(app)
      .get('/api/invoices/shop/s1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(403);
  });

  it('admin puede ver facturas de cualquier pasteleria', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'inv-1', shop_id: 's1', invoiceNumber: 'INV-000001' }]);
    const res = await request(app)
      .get('/api/invoices/shop/s2')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/invoices/:id - autorizacion', () => {
  it('customer puede ver su propia factura', async () => {
    global.mockToken('u1', ['customer']);
    global.mockFirestore.get.mockResolvedValue({ exists: true, data: () => ({
      invoiceNumber: 'INV-000001', customerId: 'u1', shop_id: 's1',
    }), id: 'inv-1' });
    const res = await request(app)
      .get('/api/invoices/inv-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.invoiceNumber).toBe('INV-000001');
  });

  it('customer recibe 403 si no es su factura', async () => {
    global.mockToken('u1', ['customer']);
    global.mockFirestore.get.mockResolvedValue({ exists: true, data: () => ({
      invoiceNumber: 'INV-000001', customerId: 'otro-usuario', shop_id: 's1',
    }), id: 'inv-1' });
    const res = await request(app)
      .get('/api/invoices/inv-ajena')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(403);
  });

  it('owner puede ver factura de su pasteleria', async () => {
    global.mockToken('owner-uid', ['owner']);
    global.mockFirestore.get
      .mockResolvedValueOnce({ exists: true, id: 'inv-1', data: () => ({
        invoiceNumber: 'INV-000001', customerId: 'u1', shop_id: 's1',
      }) })
      .mockResolvedValueOnce({ exists: true, data: () => ({ owner_id: 'owner-uid' }) });
    const res = await request(app)
      .get('/api/invoices/inv-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('owner recibe 403 si no es su pasteleria', async () => {
    global.mockToken('owner-uid', ['owner']);
    global.mockFirestore.get
      .mockResolvedValueOnce({ exists: true, id: 'inv-1', data: () => ({
        invoiceNumber: 'INV-000001', customerId: 'u1', shop_id: 's2',
      }) })
      .mockResolvedValueOnce({ exists: false });
    const res = await request(app)
      .get('/api/invoices/inv-ajena')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(403);
  });

  it('moderador puede ver cualquier factura', async () => {
    global.mockToken('mod-uid', ['moderator']);
    global.mockFirestore.get.mockResolvedValue({ exists: true, data: () => ({
      invoiceNumber: 'INV-000001', customerId: 'otro', shop_id: 's1',
    }), id: 'inv-1' });
    const res = await request(app)
      .get('/api/invoices/inv-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/invoices/:id/pdf - autorizacion', () => {
  it('customer puede descargar su propio PDF', async () => {
    global.mockToken('u1', ['customer']);
    global.mockDocExists({
      invoiceNumber: 'INV-000001', customerId: 'u1',
      shopName: 'Test', customerName: 'Test', customerEmail: '',
      items: [], subtotal: 0, deliveryFee: 0, total: 0,
      deliveryType: 'delivery', paymentMethod: 'yape', paymentStatus: 'paid',
      issueDate: new Date().toISOString(), status: 'issued',
    });
    const res = await request(app)
      .get('/api/invoices/inv-1/pdf')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });

  it('customer recibe 403 al descargar PDF ajeno', async () => {
    global.mockToken('u1', ['customer']);
    global.mockDocExists({
      invoiceNumber: 'INV-000001', customerId: 'otro',
    });
    const res = await request(app)
      .get('/api/invoices/inv-ajena/pdf')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(403);
  });

  it('owner puede descargar PDF de su pasteleria', async () => {
    global.mockToken('owner-uid', ['owner']);
    global.mockFirestore.get
      .mockResolvedValueOnce({ exists: true, data: () => ({
        invoiceNumber: 'INV-000001', customerId: 'u1', shop_id: 's1',
        shopName: 'Test', customerName: 'Test', customerEmail: '',
        items: [], subtotal: 0, deliveryFee: 0, total: 0,
        deliveryType: 'delivery', paymentMethod: 'yape', paymentStatus: 'paid',
        issueDate: new Date().toISOString(), status: 'issued',
      }), id: 'inv-1' })
      .mockResolvedValueOnce({ exists: true, data: () => ({ owner_id: 'owner-uid' }) });
    const res = await request(app)
      .get('/api/invoices/inv-1/pdf')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });
});

describe('generateInvoiceFromPayment', () => {
  const { generateInvoiceFromPayment } = require('../../src/routes/invoices');

  it('retorna null si ya existe factura', async () => {
    global.mockFirestore.get.mockResolvedValueOnce({ empty: false });
    const result = await generateInvoiceFromPayment('o1');
    expect(result).toBeNull();
  });

  it('retorna null si orden no existe', async () => {
    global.mockFirestore.get
      .mockResolvedValueOnce({ empty: true })
      .mockResolvedValueOnce({ exists: false });
    const result = await generateInvoiceFromPayment('o1');
    expect(result).toBeNull();
  });

  it('genera factura auto-magicamente desde pago exitoso', async () => {
    global.mockFirestore.get
      .mockResolvedValueOnce({ empty: true })
      .mockResolvedValueOnce({ exists: true, id: 'o1', data: () => ({
        shop: { shop_id: 's1', name: 'Pasteleria' },
        customer: { user_id: 'u1', name: 'Juan' },
        items: [{ name: 'Pastel', quantity: 1, price_at_purchase: 20 }],
        totals: { subtotal: 20, delivery_fee: 5, total: 25 },
        delivery_type: 'delivery',
        payment: { method: 'yape', status: 'paid' },
      }) })
      .mockResolvedValueOnce({ exists: true, data: () => ({ name: 'Pasteleria Test' }) })
      .mockResolvedValueOnce({ exists: true, data: () => ({ name: 'Juan Perez', email: 'juan@test.com' }) })
      .mockResolvedValueOnce({ empty: false, docs: [{ data: () => ({ paymentMethod: 'yape', paymentStatus: 'paid' }) }] });

    global.mockFirestore.runTransaction = jest.fn(async (cb) => {
      const t = {
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ nextNumber: 5 }) }),
        set: jest.fn(),
      };
      return cb(t);
    });

    global.mockFirestore.add.mockResolvedValue({ id: 'inv-auto' });

    const result = await generateInvoiceFromPayment('o1');
    expect(result).not.toBeNull();
    expect(result.id).toBe('inv-auto');
    expect(result.invoiceNumber).toMatch(/^INV-\d{6}$/);
    expect(result.orderId).toBe('o1');
    expect(result.customerName).toBe('Juan Perez');
    expect(result.updatedAt).toBeDefined();
  });
});
