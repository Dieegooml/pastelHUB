const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/customers', () => {
  it('responde 200 con lista de customers', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'c1' }]);
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/customers/:id', () => {
  it('responde 200 con el customer', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ defaultAddressId: '' });
    const res = await request(app)
      .get('/api/customers/c-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 404 si no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/customers/inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/customers/:id/full', () => {
  it('responde 200 con customer y direcciones', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ defaultAddressId: '' }), id: 'c-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ docs: [{ id: 'addr-1', data: () => ({ street: 'Av 123' }) }], empty: false });
    const res = await request(app)
      .get('/api/customers/c-1/full')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.addresses).toHaveLength(1);
  });

  it('responde 404 si el customer no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/customers/inexistente/full')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/customers', () => {
  it('crea customer correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ roles: ['customer'] }), id: 'u1' });
    global.mockFirestore.get.mockResolvedValueOnce({ exists: false, data: () => undefined, id: null });
    global.mockFirestore.set.mockResolvedValue();
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', 'Bearer token-valido')
      .send({ uid: 'u1' });
    expect(res.status).toBe(201);
  });

  it('responde 404 si el usuario no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', 'Bearer token-valido')
      .send({ uid: 'u-inexistente' });
    expect(res.status).toBe(404);
  });

  it('responde 400 si ya tiene perfil customer', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ roles: ['customer'] }), id: 'u1' });
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ defaultAddressId: '' }), id: 'u1' });
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', 'Bearer token-valido')
      .send({ uid: 'u1' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/customers/:id/default-address', () => {
  it('actualiza direccion por defecto', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ defaultAddressId: '' }), id: 'c-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ street: 'Av 123' }), id: 'addr-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ docs: [{ id: 'addr-1', ref: 'ref1' }], empty: false });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/customers/c-1/default-address')
      .set('Authorization', 'Bearer token-valido')
      .send({ addressId: 'addr-1' });
    expect(res.status).toBe(200);
    expect(res.body.defaultAddressId).toBe('addr-1');
  });

  it('responde 400 si falta addressId', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ defaultAddressId: '' });
    const res = await request(app)
      .patch('/api/customers/c-1/default-address')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });

  it('responde 404 si el customer no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .patch('/api/customers/inexistente/default-address')
      .set('Authorization', 'Bearer token-valido')
      .send({ addressId: 'addr-1' });
    expect(res.status).toBe(404);
  });

  it('responde 404 si la direccion no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ defaultAddressId: '' }), id: 'c-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ exists: false, data: () => undefined, id: null });
    const res = await request(app)
      .patch('/api/customers/c-1/default-address')
      .set('Authorization', 'Bearer token-valido')
      .send({ addressId: 'addr-inexistente' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/customers/:id', () => {
  it('elimina customer y sus direcciones', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({}), id: 'c-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ docs: [{ id: 'addr-1', ref: 'ref1' }], empty: false });
    const res = await request(app)
      .delete('/api/customers/c-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 404 si no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .delete('/api/customers/inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/customers/:id/addresses', () => {
  it('responde 200 con direcciones', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ defaultAddressId: '' }), id: 'c-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ docs: [{ id: 'addr-1', data: () => ({ street: 'Av 123' }) }], empty: false });
    const res = await request(app)
      .get('/api/customers/c-1/addresses')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('responde 404 si el customer no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/customers/inexistente/addresses')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/customers/:id/addresses/:addressId', () => {
  it('responde 200 con la direccion', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ street: 'Av 123', city: 'Lima' });
    const res = await request(app)
      .get('/api/customers/c-1/addresses/addr-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 404 si la direccion no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/customers/c-1/addresses/addr-inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/customers/:id/addresses', () => {
  it('crea direccion correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ defaultAddressId: '' }), id: 'c-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ empty: true, docs: [] });
    global.mockFirestore.add.mockResolvedValue({ id: 'new-addr' });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .post('/api/customers/c-1/addresses')
      .set('Authorization', 'Bearer token-valido')
      .send({ street: 'Av 123', city: 'Lima' });
    expect(res.status).toBe(201);
    expect(res.body.street).toBe('Av 123');
  });

  it('responde 400 si faltan campos', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ defaultAddressId: '' });
    const res = await request(app)
      .post('/api/customers/c-1/addresses')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });

  it('responde 404 si el customer no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .post('/api/customers/inexistente/addresses')
      .set('Authorization', 'Bearer token-valido')
      .send({ street: 'Av 123', city: 'Lima' });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/customers/:id/addresses/:addressId', () => {
  it('actualiza direccion correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ street: 'Av 123', city: 'Lima' });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .put('/api/customers/c-1/addresses/addr-1')
      .set('Authorization', 'Bearer token-valido')
      .send({ street: 'Av 456' });
    expect(res.status).toBe(200);
    expect(res.body.street).toBe('Av 456');
  });

  it('responde 404 si la direccion no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .put('/api/customers/c-1/addresses/addr-inexistente')
      .set('Authorization', 'Bearer token-valido')
      .send({ street: 'Av 456' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/customers/:id/addresses/:addressId', () => {
  it('elimina direccion correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ street: 'Av 123' }), id: 'addr-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ defaultAddressId: 'addr-other' }), id: 'c-1' });
    global.mockFirestore.delete.mockResolvedValue();
    const res = await request(app)
      .delete('/api/customers/c-1/addresses/addr-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 404 si la direccion no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .delete('/api/customers/c-1/addresses/addr-inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});
