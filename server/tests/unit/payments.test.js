const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/payments', () => {
  it('responde 200 con lista de pagos', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'pay1', amount: 50 }]);
    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/payments');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/payments/status/:status', () => {
  it('responde 200 filtrando por estado valido', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'pay1', paymentStatus: 'paid' }]);
    const res = await request(app)
      .get('/api/payments/status/paid')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 400 con estado invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .get('/api/payments/status/invalido')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/payments/order/:orderId', () => {
  it('responde 200 con el pago de la orden', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'pay1', orderId: 'o-1', amount: 50 }]);
    const res = await request(app)
      .get('/api/payments/order/o-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 404 si no hay pago para la orden', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([]);
    const res = await request(app)
      .get('/api/payments/order/o-inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/payments/:id', () => {
  it('responde 200 con el pago', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ amount: 50, paymentStatus: 'paid' });
    const res = await request(app)
      .get('/api/payments/pay-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(50);
  });

  it('responde 404 si no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/payments/inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/payments', () => {
  it('crea un pago correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ status: 'pending' }), id: 'o-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ empty: true, docs: [] });
    global.mockFirestore.add.mockResolvedValue({ id: 'new-pay' });
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', 'Bearer token-valido')
      .send({ orderId: 'o-1', paymentMethod: 'yape', amount: 50 });
    expect(res.status).toBe(201);
    expect(res.body.paymentStatus).toBe('pending');
  });

  it('responde 400 si faltan campos', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });

  it('responde 400 con metodo invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', 'Bearer token-valido')
      .send({ orderId: 'o-1', paymentMethod: 'bitcoin', amount: 50 });
    expect(res.status).toBe(400);
  });

  it('responde 404 si la orden no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', 'Bearer token-valido')
      .send({ orderId: 'o-inexistente', paymentMethod: 'yape', amount: 50 });
    expect(res.status).toBe(404);
  });

  it('responde 400 si la orden ya tiene pago', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ status: 'pending' }), id: 'o-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ empty: false, docs: [{ id: 'pay1' }] });
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', 'Bearer token-valido')
      .send({ orderId: 'o-1', paymentMethod: 'yape', amount: 50 });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/payments/:id/status', () => {
  it('actualiza estado del pago', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ paymentStatus: 'pending' });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/payments/pay-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ paymentStatus: 'paid' });
    expect(res.status).toBe(200);
    expect(res.body.paymentStatus).toBe('paid');
  });

  it('responde 400 con estado invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ paymentStatus: 'pending' });
    const res = await request(app)
      .patch('/api/payments/pay-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ paymentStatus: 'invalid' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/payments/:id', () => {
  it('actualiza pago en estado pending', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ paymentStatus: 'pending', amount: 50 });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .put('/api/payments/pay-1')
      .set('Authorization', 'Bearer token-valido')
      .send({ amount: 60 });
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(60);
  });

  it('responde 400 si no esta pending', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ paymentStatus: 'paid', amount: 50 });
    const res = await request(app)
      .put('/api/payments/pay-1')
      .set('Authorization', 'Bearer token-valido')
      .send({ amount: 60 });
    expect(res.status).toBe(400);
  });

  it('responde 400 con metodo invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ paymentStatus: 'pending', amount: 50 });
    const res = await request(app)
      .put('/api/payments/pay-1')
      .set('Authorization', 'Bearer token-valido')
      .send({ paymentMethod: 'bitcoin' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/payments/:id', () => {
  it('elimina pago en estado pending', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ paymentStatus: 'pending' });
    global.mockFirestore.delete.mockResolvedValue();
    const res = await request(app)
      .delete('/api/payments/pay-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 400 si no esta pending ni failed', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ paymentStatus: 'paid' });
    const res = await request(app)
      .delete('/api/payments/pay-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(400);
  });
});
