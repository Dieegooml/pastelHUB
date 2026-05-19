const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/shops', () => {
  it('responde 200 con lista vacia cuando no hay pastelerias', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([]);

    const res = await request(app)
      .get('/api/shops')
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/shops');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/shops', () => {
  it('responde 400 si falta owner_id o name', async () => {
    global.mockToken('admin-uid', ['admin']);

    const res = await request(app)
      .post('/api/shops')
      .set('Authorization', 'Bearer token-valido')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('owner_id y name');
  });

  it('crea una pasteleria con datos validos', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ email: 'owner@test.com' });
    global.mockFirestore.add.mockResolvedValue({ id: 'new-shop-id' });

    const res = await request(app)
      .post('/api/shops')
      .set('Authorization', 'Bearer token-valido')
      .send({ owner_id: 'owner-uid', name: 'Pasteleria Test' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Pasteleria Test');
  });
});

describe('GET /api/shops/:id', () => {
  it('responde 404 si la pasteleria no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();

    const res = await request(app)
      .get('/api/shops/inexistente')
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('no encontrada');
  });

  it('responde con la pasteleria si existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Mi Pasteleria', owner_id: 'owner-uid' });

    const res = await request(app)
      .get('/api/shops/mi-pasteleria')
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Mi Pasteleria');
  });
});

describe('DELETE /api/shops/:id', () => {
  it('elimina una pasteleria existente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Pasteleria' });
    global.mockFirestore.delete.mockResolvedValue();

    const res = await request(app)
      .delete('/api/shops/pasteleria-1')
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(200);
  });
});

describe('PUT /api/shops/:id', () => {
  it('actualiza una pasteleria existente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Original' });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .put('/api/shops/shop-1')
      .set('Authorization', 'Bearer token-valido')
      .send({ name: 'Actualizado' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Actualizado');
  });

  it('responde 404 si la pasteleria no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .put('/api/shops/inexistente')
      .set('Authorization', 'Bearer token-valido')
      .send({ name: 'Nuevo' });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/shops/:id/status', () => {
  it('cambia estado correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'pending' });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/shops/shop-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
  });

  it('responde 400 con estado invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'pending' });
    const res = await request(app)
      .patch('/api/shops/shop-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'invalid' });
    expect(res.status).toBe(400);
  });
});

// ── SCHEDULES ─────────────────────────────────────────────────────────

describe('GET /api/shops/:id/schedules', () => {
  it('responde 200 con horarios', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ schedules: [{ day: 'Mon', open_time: '08:00', close_time: '17:00' }] });
    const res = await request(app)
      .get('/api/shops/shop-1/schedules')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('POST /api/shops/:id/schedules', () => {
  it('agrega horario correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ schedules: [] });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .post('/api/shops/shop-1/schedules')
      .set('Authorization', 'Bearer token-valido')
      .send({ day: 'Mon', open_time: '08:00', close_time: '17:00' });
    expect(res.status).toBe(201);
    expect(res.body.day).toBe('Mon');
  });

  it('responde 400 si faltan campos', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ schedules: [] });
    const res = await request(app)
      .post('/api/shops/shop-1/schedules')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });

  it('responde 400 con dia invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ schedules: [] });
    const res = await request(app)
      .post('/api/shops/shop-1/schedules')
      .set('Authorization', 'Bearer token-valido')
      .send({ day: 'Invalid', open_time: '08:00', close_time: '17:00' });
    expect(res.status).toBe(400);
  });

  it('responde 400 si el dia ya existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ schedules: [{ day: 'Mon', open_time: '08:00', close_time: '17:00' }] });
    const res = await request(app)
      .post('/api/shops/shop-1/schedules')
      .set('Authorization', 'Bearer token-valido')
      .send({ day: 'Mon', open_time: '09:00', close_time: '18:00' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/shops/:id/schedules/:day', () => {
  it('actualiza horario correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ schedules: [{ day: 'Mon', open_time: '08:00', close_time: '17:00' }] });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .put('/api/shops/shop-1/schedules/Mon')
      .set('Authorization', 'Bearer token-valido')
      .send({ open_time: '09:00' });
    expect(res.status).toBe(200);
    expect(res.body.open_time).toBe('09:00');
  });

  it('responde 404 si el horario no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ schedules: [] });
    const res = await request(app)
      .put('/api/shops/shop-1/schedules/Mon')
      .set('Authorization', 'Bearer token-valido')
      .send({ open_time: '09:00' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/shops/:id/schedules/:day', () => {
  it('elimina horario correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ schedules: [{ day: 'Mon', open_time: '08:00', close_time: '17:00' }] });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .delete('/api/shops/shop-1/schedules/Mon')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 404 si el horario no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ schedules: [] });
    const res = await request(app)
      .delete('/api/shops/shop-1/schedules/Mon')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

// ── CATEGORIES ────────────────────────────────────────────────────────

describe('GET /api/shops/:id/categories', () => {
  it('responde 200 con categorias', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ categories: [{ category_id: 'cat1', name: 'Tortas' }] });
    const res = await request(app)
      .get('/api/shops/shop-1/categories')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('POST /api/shops/:id/categories', () => {
  it('agrega categoria correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ categories: [] });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .post('/api/shops/shop-1/categories')
      .set('Authorization', 'Bearer token-valido')
      .send({ name: 'Tortas' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Tortas');
  });

  it('responde 400 si falta name', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ categories: [] });
    const res = await request(app)
      .post('/api/shops/shop-1/categories')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/shops/:id/categories/:categoryId', () => {
  it('actualiza categoria correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ categories: [{ category_id: 'cat1', name: 'Tortas' }] });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .put('/api/shops/shop-1/categories/cat1')
      .set('Authorization', 'Bearer token-valido')
      .send({ name: 'Pasteles' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Pasteles');
  });

  it('responde 404 si la categoria no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ categories: [] });
    const res = await request(app)
      .put('/api/shops/shop-1/categories/cat-inexistente')
      .set('Authorization', 'Bearer token-valido')
      .send({ name: 'Pasteles' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/shops/:id/categories/:categoryId', () => {
  it('elimina categoria correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ categories: [{ category_id: 'cat1', name: 'Tortas' }] });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .delete('/api/shops/shop-1/categories/cat1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 404 si la categoria no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ categories: [] });
    const res = await request(app)
      .delete('/api/shops/shop-1/categories/cat-inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});
