const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/reviews', () => {
  it('responde 200 con lista de resenas', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'r1', rating: 5 }]);
    const res = await request(app)
      .get('/api/reviews')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/reviews');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/reviews/shop/:shopId', () => {
  it('responde 200 con resenas de la pasteleria', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'r1', shop_id: 's1', rating: 4 }]);
    const res = await request(app)
      .get('/api/reviews/shop/s1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/reviews/customer/:customerId', () => {
  it('responde 200 con resenas del cliente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'r1', customer_id: 'c1' }]);
    const res = await request(app)
      .get('/api/reviews/customer/c1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/reviews/status/:status', () => {
  it('responde 200 filtrando por estado valido', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'r1', status: 'approved' }]);
    const res = await request(app)
      .get('/api/reviews/status/approved')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 400 con estado invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .get('/api/reviews/status/invalido')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/reviews/:id', () => {
  it('responde 200 con la resena', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ rating: 5, comment: 'Muy bueno' });
    const res = await request(app)
      .get('/api/reviews/r-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(5);
  });

  it('responde 404 si no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/reviews/inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/reviews', () => {
  it('crea una resena correctamente', async () => {
    global.mockToken('test-uid', ['customer']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ status: 'delivered', customer: { user_id: 'test-uid' } }), id: 'o-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ empty: true, docs: [] });
    global.mockFirestore.get.mockResolvedValue({ docs: [{ data: () => ({ rating: 5 }) }], empty: false });
    global.mockFirestore.add.mockResolvedValue({ id: 'new-review' });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', 'Bearer token-valido')
      .send({ shopId: 's1', orderId: 'o-1', rating: 5, comment: 'Excelente' });
    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(5);
    expect(res.body.customerId).toBe('test-uid');
  });

  it('responde 400 si faltan campos', async () => {
    global.mockToken('test-uid', ['customer']);
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });

  it('responde 400 con rating invalido', async () => {
    global.mockToken('test-uid', ['customer']);
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', 'Bearer token-valido')
      .send({ shopId: 's1', orderId: 'o-1', rating: 6 });
    expect(res.status).toBe(400);
  });

  it('responde 404 si la orden no existe', async () => {
    global.mockToken('test-uid', ['customer']);
    global.mockDocNotExists();
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', 'Bearer token-valido')
      .send({ shopId: 's1', orderId: 'o-inexistente', rating: 5 });
    expect(res.status).toBe(404);
  });

  it('responde 400 si la orden no fue entregada', async () => {
    global.mockToken('test-uid', ['customer']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ status: 'pending', customer: { user_id: 'test-uid' } }), id: 'o-1' });
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', 'Bearer token-valido')
      .send({ shopId: 's1', orderId: 'o-1', rating: 5 });
    expect(res.status).toBe(400);
  });

  it('responde 400 si la orden ya tiene resena', async () => {
    global.mockToken('test-uid', ['customer']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ status: 'delivered', customer: { user_id: 'test-uid' } }), id: 'o-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ empty: false, docs: [{ id: 'r1', data: () => ({}) }] });
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', 'Bearer token-valido')
      .send({ shopId: 's1', orderId: 'o-1', rating: 5 });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/reviews/:id/status', () => {
  it('modera resena correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    const reviewDoc = { exists: true, data: () => ({ shop_id: 's1', status: 'pending', rating: 5 }), id: 'r-1' };
    const recalcResult = { docs: [{ data: () => ({ rating: 5 }) }], empty: false };
    global.mockFirestore.get.mockResolvedValueOnce(reviewDoc);
    global.mockFirestore.get.mockResolvedValueOnce(recalcResult);
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/reviews/r-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
  });

  it('responde 400 con estado invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ shop_id: 's1', status: 'pending' });
    const res = await request(app)
      .patch('/api/reviews/r-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'invalid' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/reviews/:id/reply', () => {
  it('responde a la resena correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ rating: 5, owner_reply: '' });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/reviews/r-1/reply')
      .set('Authorization', 'Bearer token-valido')
      .send({ ownerReply: 'Gracias por tu review' });
    expect(res.status).toBe(200);
    expect(res.body.ownerReply).toBe('Gracias por tu review');
  });

  it('responde 400 si falta ownerReply', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ rating: 5 });
    const res = await request(app)
      .patch('/api/reviews/r-1/reply')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/reviews/:id', () => {
  it('edita resena en estado pending', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'pending', rating: 3, comment: 'Regular' });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .put('/api/reviews/r-1')
      .set('Authorization', 'Bearer token-valido')
      .send({ rating: 5, comment: 'Excelente' });
    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(5);
  });

  it('responde 400 si no esta pending', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'approved', rating: 5 });
    const res = await request(app)
      .put('/api/reviews/r-1')
      .set('Authorization', 'Bearer token-valido')
      .send({ rating: 3 });
    expect(res.status).toBe(400);
  });

  it('acepta rating 0 (escala 0-5)', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'pending', rating: 3 });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .put('/api/reviews/r-1')
      .set('Authorization', 'Bearer token-valido')
      .send({ rating: 0 });
    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(0);
  });

  it('responde 400 con rating mayor a 5', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'pending', rating: 3 });
    const res = await request(app)
      .put('/api/reviews/r-1')
      .set('Authorization', 'Bearer token-valido')
      .send({ rating: 6 });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/reviews/:id', () => {
  it('elimina resena correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ shop_id: 's1', rating: 5 }), id: 'r-1' });
    global.mockFirestore.get.mockResolvedValue({ docs: [{ data: () => ({ rating: 5 }) }], empty: false });
    global.mockFirestore.delete.mockResolvedValue();
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .delete('/api/reviews/r-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 404 si no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .delete('/api/reviews/inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});
