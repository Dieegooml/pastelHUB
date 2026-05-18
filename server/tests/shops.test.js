const request = require('supertest');
const app = require('../src/app');

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