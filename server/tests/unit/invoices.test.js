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
});
