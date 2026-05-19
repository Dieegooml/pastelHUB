const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/orders', () => {
  it('responde 200 con lista de ordenes', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'o1', status: 'pending' }]);
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/orders/shop/:shopId', () => {
  it('responde 200 con ordenes de la pasteleria', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'o1', shop: { shop_id: 's1' } }]);
    const res = await request(app)
      .get('/api/orders/shop/s1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/orders/customer/:userId', () => {
  it('responde 200 con ordenes del cliente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'o1', customer: { user_id: 'u1' } }]);
    const res = await request(app)
      .get('/api/orders/customer/u1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/orders/status/:status', () => {
  it('responde 200 filtrando por estado valido', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'o1', status: 'delivered' }]);
    const res = await request(app)
      .get('/api/orders/status/delivered')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 400 con estado invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .get('/api/orders/status/invalido')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/orders/:id', () => {
  it('responde 200 con la orden', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'pending' });
    const res = await request(app)
      .get('/api/orders/o-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
  });

  it('responde 404 si no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/orders/inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/orders', () => {
  const validOrder = {
    customer: { user_id: 'u1' },
    shop: { shop_id: 's1' },
    items: [{ product_id: 'p1', name: 'Pastel', quantity: 2, price_at_purchase: 25 }],
    payment: { method: 'yape' },
  };

  it('crea una orden correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ full_name: 'Test User' });
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ full_name: 'Test User' }), id: 'u1' });
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ name: 'Pasteleria Test' }), id: 's1' });
    global.mockFirestore.add.mockResolvedValue({ id: 'new-order' });
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer token-valido')
      .send(validOrder);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
  });

  it('responde 400 si faltan campos requeridos', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });

  it('responde 400 con metodo de pago invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer token-valido')
      .send({ ...validOrder, payment: { method: 'bitcoin' } });
    expect(res.status).toBe(400);
  });

  it('responde 404 si el cliente no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer token-valido')
      .send(validOrder);
    expect(res.status).toBe(404);
  });

  it('responde 404 si la pasteleria no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ full_name: 'Test' }), id: 'u1' });
    global.mockFirestore.get.mockResolvedValueOnce({ exists: false, data: () => undefined, id: null });
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer token-valido')
      .send(validOrder);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/orders/:id/status', () => {
  it('actualiza estado correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'pending', status_history: ['pending'] });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/orders/o-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'confirmed' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });

  it('responde 400 con estado invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'pending', status_history: ['pending'] });
    const res = await request(app)
      .patch('/api/orders/o-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('responde 404 si la orden no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .patch('/api/orders/inexistente/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'confirmed' });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/orders/:id/payment-status', () => {
  it('actualiza estado del pago correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'pending', payment: { method: 'yape', status: 'pending' } });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/orders/o-1/payment-status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'paid' });
    expect(res.status).toBe(200);
    expect(res.body.payment.status).toBe('paid');
  });

  it('responde 400 con estado invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ payment: { method: 'yape', status: 'pending' } });
    const res = await request(app)
      .patch('/api/orders/o-1/payment-status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'invalid' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/orders/:id/review', () => {
  it('agrega reseña a orden entregada', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'delivered', review: { rating: 0, comment: '', reply_text: '' } });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/orders/o-1/review')
      .set('Authorization', 'Bearer token-valido')
      .send({ rating: 5, comment: 'Excelente' });
    expect(res.status).toBe(200);
    expect(res.body.review.rating).toBe(5);
  });

  it('responde 400 si la orden no esta entregada', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'pending', review: { rating: 0 } });
    const res = await request(app)
      .patch('/api/orders/o-1/review')
      .set('Authorization', 'Bearer token-valido')
      .send({ rating: 5 });
    expect(res.status).toBe(400);
  });

  it('responde 400 si el rating es invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'delivered', review: { rating: 0 } });
    const res = await request(app)
      .patch('/api/orders/o-1/review')
      .set('Authorization', 'Bearer token-valido')
      .send({ rating: 6 });
    expect(res.status).toBe(400);
  });

  it('responde 400 si ya tiene reseña', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'delivered', review: { rating: 4, comment: 'Rico' } });
    const res = await request(app)
      .patch('/api/orders/o-1/review')
      .set('Authorization', 'Bearer token-valido')
      .send({ rating: 5 });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/orders/:id/review/reply', () => {
  it('responde a una reseña correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'delivered', review: { rating: 4, comment: 'Rico', reply_text: '' } });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/orders/o-1/review/reply')
      .set('Authorization', 'Bearer token-valido')
      .send({ reply_text: 'Gracias!' });
    expect(res.status).toBe(200);
    expect(res.body.review.reply_text).toBe('Gracias!');
  });

  it('responde 400 si falta reply_text', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ review: { rating: 4 } });
    const res = await request(app)
      .patch('/api/orders/o-1/review/reply')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });

  it('responde 400 si no hay reseña', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ review: { rating: 0, comment: '', reply_text: '' } });
    const res = await request(app)
      .patch('/api/orders/o-1/review/reply')
      .set('Authorization', 'Bearer token-valido')
      .send({ reply_text: 'Gracias' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/orders/:id', () => {
  it('elimina orden en estado pending', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'pending' });
    global.mockFirestore.delete.mockResolvedValue();
    const res = await request(app)
      .delete('/api/orders/o-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 400 si la orden no se puede eliminar', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'delivered' });
    const res = await request(app)
      .delete('/api/orders/o-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(400);
  });
});
