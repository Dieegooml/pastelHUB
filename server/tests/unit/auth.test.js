const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/auth/sync', () => {
  it('crea usuario nuevo y responde 201 con isNew: true', async () => {
    global.mockToken('new-uid', []);
    global.mockDocNotExists();
    global.mockFirestore.set.mockResolvedValue();
    global.mockFirebaseAuth.setCustomUserClaims.mockResolvedValue();

    const res = await request(app)
      .post('/api/auth/sync')
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(201);
    expect(res.body.isNew).toBe(true);
    expect(res.body.email).toBe('test@example.com');
    expect(res.body.roles).toEqual(['customer']);
    expect(global.mockFirestore.set).toHaveBeenCalledTimes(2);
  });

  it('responde 200 si el usuario ya existe (isNew: false)', async () => {
    global.mockToken('existing-uid', ['customer']);
    global.mockDocExists({ email: 'test@example.com', roles: ['customer'] });

    const res = await request(app)
      .post('/api/auth/sync')
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(200);
    expect(res.body.isNew).toBe(false);
  });

  it('crea perfil customer automaticamente si el usuario existe pero no tiene perfil', async () => {
    global.mockToken('existing-uid', ['customer']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ email: 'test@example.com', roles: ['customer'] }), id: 'u1' });
    global.mockDocNotExists();
    global.mockFirestore.set.mockResolvedValue();

    const res = await request(app)
      .post('/api/auth/sync')
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(200);
    expect(res.body.isNew).toBe(false);
    expect(global.mockFirestore.set).toHaveBeenCalled();
  });

  it('responde 401 sin token', async () => {
    const res = await request(app).post('/api/auth/sync');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('responde con datos del usuario autenticado', async () => {
    global.mockToken('my-uid', ['customer']);
    global.mockDocExists({ email: 'test@example.com', full_name: 'Test User' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@example.com');
  });

  it('responde 404 si el usuario no existe en firestore', async () => {
    global.mockToken('ghost-uid', ['customer']);
    global.mockDocNotExists();

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token-valido');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Usuario no encontrado');
  });
});

describe('POST /api/auth/assign-role', () => {
  it('responde 400 si faltan uid o roles', async () => {
    global.mockToken('admin-uid', ['admin']);

    const res = await request(app)
      .post('/api/auth/assign-role')
      .set('Authorization', 'Bearer token-valido')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('uid');
  });

  it('responde 400 si roles contiene valores invalidos', async () => {
    global.mockToken('admin-uid', ['admin']);

    const res = await request(app)
      .post('/api/auth/assign-role')
      .set('Authorization', 'Bearer token-valido')
      .send({ uid: 'some-uid', roles: ['superadmin'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid option');
  });

  it('asigna rol correctamente y responde 200', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ email: 'target@test.com', roles: ['customer'] });
    global.mockFirebaseAuth.setCustomUserClaims.mockResolvedValue();

    const res = await request(app)
      .post('/api/auth/assign-role')
      .set('Authorization', 'Bearer token-valido')
      .send({ uid: 'target-uid', roles: ['moderator'] });

    expect(res.status).toBe(200);
    expect(res.body.roles).toEqual(['moderator']);
  });
});
