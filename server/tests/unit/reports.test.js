const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/reports', () => {
  it('responde 200 con lista de reportes', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'r1', reason: 'Spam' }]);
    const res = await request(app)
      .get('/api/reports')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/reports');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/reports/status/:status', () => {
  it('responde 200 filtrando por estado valido', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'r1', status: 'open' }]);
    const res = await request(app)
      .get('/api/reports/status/open')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 400 con estado invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .get('/api/reports/status/invalido')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/reports/target/:targetType', () => {
  it('responde 200 filtrando por tipo valido', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'r1', targetType: 'review' }]);
    const res = await request(app)
      .get('/api/reports/target/review')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 400 con tipo invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .get('/api/reports/target/invalido')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/reports/moderator/:moderatorId', () => {
  it('responde 200 con reportes del moderador', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'r1', assignedTo: 'mod-1' }]);
    const res = await request(app)
      .get('/api/reports/moderator/mod-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/reports/user/:userId', () => {
  it('responde 200 con reportes del usuario', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'r1', reportedBy: 'u1' }]);
    const res = await request(app)
      .get('/api/reports/user/u1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/reports/:id', () => {
  it('responde 200 con el reporte', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ reason: 'Spam', status: 'open' });
    const res = await request(app)
      .get('/api/reports/r-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.reason).toBe('Spam');
  });

  it('responde 404 si no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/reports/inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/reports', () => {
  it('crea un reporte correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ email: 'test@test.com' }), id: 'u1' });
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ rating: 5 }), id: 'rev-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ empty: true, docs: [] });
    global.mockFirestore.add.mockResolvedValue({ id: 'new-report' });
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', 'Bearer token-valido')
      .send({ reportedBy: 'u1', targetType: 'review', targetId: 'rev-1', reason: 'Spam' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('open');
  });

  it('responde 400 si faltan campos', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });

  it('responde 400 con targetType invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', 'Bearer token-valido')
      .send({ reportedBy: 'u1', targetType: 'invalid', targetId: 't1', reason: 'Test' });
    expect(res.status).toBe(400);
  });

  it('responde 404 si el usuario que reporta no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', 'Bearer token-valido')
      .send({ reportedBy: 'u-inexistente', targetType: 'review', targetId: 'rev-1', reason: 'Spam' });
    expect(res.status).toBe(404);
  });

  it('responde 404 si el objetivo no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ email: 'test@test.com' }), id: 'u1' });
    global.mockFirestore.get.mockResolvedValueOnce({ exists: false, data: () => undefined, id: null });
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', 'Bearer token-valido')
      .send({ reportedBy: 'u1', targetType: 'review', targetId: 'rev-inexistente', reason: 'Spam' });
    expect(res.status).toBe(404);
  });

  it('responde 400 si ya reporto el mismo contenido', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ email: 'test@test.com' }), id: 'u1' });
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ rating: 5 }), id: 'rev-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ empty: false, docs: [{ id: 'existing-report' }] });
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', 'Bearer token-valido')
      .send({ reportedBy: 'u1', targetType: 'review', targetId: 'rev-1', reason: 'Spam' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/reports/:id/assign', () => {
  it('asigna reporte a moderador correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ status: 'open' }), id: 'r-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ roles: ['moderator'] }), id: 'mod-1' });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/reports/r-1/assign')
      .set('Authorization', 'Bearer token-valido')
      .send({ moderatorId: 'mod-1' });
    expect(res.status).toBe(200);
    expect(res.body.assignedTo).toBe('mod-1');
  });

  it('responde 400 si el reporte no esta open', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'resolved' });
    const res = await request(app)
      .patch('/api/reports/r-1/assign')
      .set('Authorization', 'Bearer token-valido')
      .send({ moderatorId: 'mod-1' });
    expect(res.status).toBe(400);
  });

  it('responde 400 si falta moderatorId', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'open' });
    const res = await request(app)
      .patch('/api/reports/r-1/assign')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });

  it('responde 404 si el moderador no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ status: 'open' }), id: 'r-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ exists: false, data: () => undefined, id: null });
    const res = await request(app)
      .patch('/api/reports/r-1/assign')
      .set('Authorization', 'Bearer token-valido')
      .send({ moderatorId: 'mod-inexistente' });
    expect(res.status).toBe(404);
  });

  it('responde 400 si el usuario no es moderador', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ status: 'open' }), id: 'r-1' });
    global.mockFirestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ roles: ['customer'] }), id: 'mod-1' });
    const res = await request(app)
      .patch('/api/reports/r-1/assign')
      .set('Authorization', 'Bearer token-valido')
      .send({ moderatorId: 'mod-1' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/reports/:id/status', () => {
  it('resuelve reporte correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'open' });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/reports/r-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'resolved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('resolved');
  });

  it('responde 400 si el reporte no esta open', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'resolved' });
    const res = await request(app)
      .patch('/api/reports/r-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'dismissed' });
    expect(res.status).toBe(400);
  });

  it('responde 400 con estado invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'open' });
    const res = await request(app)
      .patch('/api/reports/r-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'invalid' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/reports/:id', () => {
  it('edita reporte en estado open', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'open', reason: 'Original' });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .put('/api/reports/r-1')
      .set('Authorization', 'Bearer token-valido')
      .send({ reason: 'Actualizado' });
    expect(res.status).toBe(200);
    expect(res.body.reason).toBe('Actualizado');
  });

  it('responde 400 si no esta open', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'resolved' });
    const res = await request(app)
      .put('/api/reports/r-1')
      .set('Authorization', 'Bearer token-valido')
      .send({ reason: 'Nuevo' });
    expect(res.status).toBe(400);
  });

  it('responde 400 si falta reason', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'open' });
    const res = await request(app)
      .put('/api/reports/r-1')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/reports/:id', () => {
  it('elimina reporte en estado open', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'open' });
    global.mockFirestore.delete.mockResolvedValue();
    const res = await request(app)
      .delete('/api/reports/r-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 400 si no esta open', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ status: 'resolved' });
    const res = await request(app)
      .delete('/api/reports/r-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(400);
  });
});
