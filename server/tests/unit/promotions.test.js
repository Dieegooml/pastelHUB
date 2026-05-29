const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/promotions/shop/:shopId', () => {
  it('responde 200 con promociones activas de la pasteleria (publico)', async () => {
    const now = new Date().toISOString();
    global.mockCollection([
      { id: 'p1', shop_id: 's1', name: 'Descuento', type: 'discount', is_active: true, start_date: '2020-01-01', end_date: '2099-12-31' },
    ]);
    const res = await request(app).get('/api/promotions/shop/s1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('filtra promociones vencidas en endpoint publico', async () => {
    global.mockCollection([
      { id: 'p1', shop_id: 's1', name: 'Vencida', type: 'discount', is_active: true, start_date: '2020-01-01', end_date: '2020-12-31' },
    ]);
    const res = await request(app).get('/api/promotions/shop/s1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('GET /api/promotions/shop/:shopId/all', () => {
  it('responde 200 con todas las promociones (admin)', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'p1', shop_id: 's1', name: 'Descuento' }]);
    const res = await request(app)
      .get('/api/promotions/shop/s1/all')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/promotions/shop/s1/all');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/promotions/:id', () => {
  it('responde 200 con la promocion', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Descuento', type: 'discount', is_active: true });
    const res = await request(app)
      .get('/api/promotions/p-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Descuento');
  });

  it('responde 404 si no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/promotions/inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/promotions', () => {
  it('crea promocion correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Mi Pasteleria', owner_id: 'admin-uid' });
    global.mockFirestore.add.mockResolvedValue({ id: 'new-promo' });
    const res = await request(app)
      .post('/api/promotions')
      .set('Authorization', 'Bearer token-valido')
      .send({ shop_id: 'shop-1', name: 'Descuento', type: 'discount' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Descuento');
  });

  it('responde 400 si faltan campos', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .post('/api/promotions')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });

  it('responde 400 con tipo invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .post('/api/promotions')
      .set('Authorization', 'Bearer token-valido')
      .send({ shop_id: 'shop-1', name: 'Test', type: 'invalido' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/promotions/:id', () => {
  it('actualiza promocion existente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Original', type: 'discount', shop_id: 'shop-1' });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .put('/api/promotions/p-1')
      .set('Authorization', 'Bearer token-valido')
      .send({ name: 'Actualizado' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Actualizado');
  });

  it('responde 404 si la promocion no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .put('/api/promotions/inexistente')
      .set('Authorization', 'Bearer token-valido')
      .send({ name: 'Nuevo' });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/promotions/:id/toggle', () => {
  it('cambia estado correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Promo', is_active: true, shop_id: 'shop-1' });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/promotions/p-1/toggle')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.is_active).toBe(false);
  });

  it('responde 404 si la promocion no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .patch('/api/promotions/inexistente/toggle')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/promotions/:id', () => {
  it('elimina promocion correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Promo', shop_id: 'shop-1' });
    global.mockFirestore.delete.mockResolvedValue();
    const res = await request(app)
      .delete('/api/promotions/p-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 404 si la promocion no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .delete('/api/promotions/inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});
