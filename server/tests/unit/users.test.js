const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/users', () => {
  it('responde 200 con lista de usuarios', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([
      { id: 'u1', email: 'uno@test.com', full_name: 'Usuario 1' },
      { id: 'u2', email: 'dos@test.com', full_name: 'Usuario 2' },
    ]);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('POST /api/users', () => {
  it('responde 400 si falta password', async () => {
    global.mockToken('admin-uid', ['admin']);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer token-valido')
      .send({ name: 'Test', email: 'test@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('password');
  });

  it('responde 400 si falta email', async () => {
    global.mockToken('admin-uid', ['admin']);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer token-valido')
      .send({ name: 'Test', password: '123456' });

    expect(res.status).toBe(400);
  });

  it('crea un usuario con datos validos', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirebaseAuth.createUser.mockResolvedValue({ uid: 'new-uid' });
    global.mockFirebaseAuth.setCustomUserClaims.mockResolvedValue();
    global.mockFirestore.set.mockResolvedValue();

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer token-valido')
      .send({ name: 'Nuevo Usuario', email: 'nuevo@test.com', password: '123456' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('nuevo@test.com');
  });
});

describe('PUT /api/users/:id', () => {
  it('actualiza un usuario existente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ email: 'user@test.com', full_name: 'Original' });
    global.mockFirestore.update.mockResolvedValue();

    const res = await request(app)
      .put('/api/users/user-1')
      .set('Authorization', 'Bearer token-valido')
      .send({ name: 'Actualizado' });

    expect(res.status).toBe(200);
  });

  it('responde 404 si el usuario no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();

    const res = await request(app)
      .put('/api/users/user-inexistente')
      .set('Authorization', 'Bearer token-valido')
      .send({ name: 'Nadie' });

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/users/:id/status', () => {
  it('responde 400 si falta isActive', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ email: 'user@test.com', isActive: true });

    const res = await request(app)
      .patch('/api/users/user-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('isActive debe ser');
  });

  it('activa/desactiva usuario correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ email: 'user@test.com', isActive: true });
    global.mockFirebaseAuth.updateUser.mockResolvedValue();
    global.mockFirestore.update.mockResolvedValue();

    const res = await request(app)
      .patch('/api/users/user-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
  });
});

describe('DELETE /api/users/:id', () => {
  it('elimina un usuario existente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ email: 'delete@test.com' });
    global.mockFirebaseAuth.deleteUser.mockResolvedValue();
    global.mockFirestore.delete.mockResolvedValue();

    const res = await request(app)
      .delete('/api/users/user-to-delete')
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('eliminado');
  });
});

describe('GET /api/users/:id', () => {
  it('responde 200 con el usuario', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ email: 'user@test.com', full_name: 'Test User' });
    const res = await request(app)
      .get('/api/users/user-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('user@test.com');
  });

  it('responde 404 si no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/users/inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

// ── ADDRESSES (array embebido) ────────────────────────────────────────

describe('GET /api/users/:id/addresses', () => {
  it('responde 200 con direcciones del usuario', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ addresses: [{ address_id: 'a1', street: 'Av 123', city: 'Lima' }] });
    const res = await request(app)
      .get('/api/users/user-1/addresses')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('responde 404 si el usuario no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/users/inexistente/addresses')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/users/:id/addresses', () => {
  it('agrega direccion correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ addresses: [] });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .post('/api/users/user-1/addresses')
      .set('Authorization', 'Bearer token-valido')
      .send({ street: 'Av 123', city: 'Lima' });
    expect(res.status).toBe(201);
    expect(res.body.street).toBe('Av 123');
  });

  it('responde 400 si faltan campos', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ addresses: [] });
    const res = await request(app)
      .post('/api/users/user-1/addresses')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });

  it('responde 404 si el usuario no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .post('/api/users/inexistente/addresses')
      .set('Authorization', 'Bearer token-valido')
      .send({ street: 'Av 123', city: 'Lima' });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/users/:id/addresses/:addressId', () => {
  it('actualiza direccion correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ addresses: [{ address_id: 'a1', street: 'Av 123', city: 'Lima' }] });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .put('/api/users/user-1/addresses/a1')
      .set('Authorization', 'Bearer token-valido')
      .send({ street: 'Av 456' });
    expect(res.status).toBe(200);
    expect(res.body.street).toBe('Av 456');
  });

  it('responde 404 si la direccion no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ addresses: [] });
    const res = await request(app)
      .put('/api/users/user-1/addresses/a-inexistente')
      .set('Authorization', 'Bearer token-valido')
      .send({ street: 'Av 456' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/users/:id/addresses/:addressId', () => {
  it('elimina direccion correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ addresses: [{ address_id: 'a1', street: 'Av 123', city: 'Lima', is_default: true }] });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .delete('/api/users/user-1/addresses/a1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 404 si la direccion no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ addresses: [] });
    const res = await request(app)
      .delete('/api/users/user-1/addresses/a-inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});
