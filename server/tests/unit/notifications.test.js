const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/notifications', () => {
  it('responde 200 con lista de notificaciones', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'n1', message: 'Test' }]);
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/notifications/user/:userId', () => {
  it('responde 200 con notificaciones del usuario', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'n1', userId: 'u1', message: 'Test' }]);
    const res = await request(app)
      .get('/api/notifications/user/u1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/notifications/user/:userId/unread', () => {
  it('responde 200 con no leidas', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'n1', userId: 'u1', isRead: false }]);
    const res = await request(app)
      .get('/api/notifications/user/u1/unread')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/notifications/:id', () => {
  it('responde 200 con la notificacion', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ message: 'Notificacion test' });
    const res = await request(app)
      .get('/api/notifications/n-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Notificacion test');
  });

  it('responde 404 si no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/notifications/inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/notifications', () => {
  it('crea notificacion correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ email: 'test@test.com' });
    global.mockFirestore.add.mockResolvedValue({ id: 'new-notif' });
    const res = await request(app)
      .post('/api/notifications')
      .set('Authorization', 'Bearer token-valido')
      .send({ userId: 'u1', type: 'order_update', message: 'Tu orden fue actualizada' });
    expect(res.status).toBe(201);
    expect(res.body.isRead).toBe(false);
  });

  it('responde 400 si faltan campos', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .post('/api/notifications')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });

  it('responde 400 con tipo invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .post('/api/notifications')
      .set('Authorization', 'Bearer token-valido')
      .send({ userId: 'u1', type: 'invalid_type', message: 'Test' });
    expect(res.status).toBe(400);
  });

  it('responde 404 si el usuario no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .post('/api/notifications')
      .set('Authorization', 'Bearer token-valido')
      .send({ userId: 'u-inexistente', type: 'order_update', message: 'Test' });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/notifications/bulk', () => {
  it('crea notificaciones masivas correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.add.mockResolvedValue({ id: 'bulk-1' });
    const res = await request(app)
      .post('/api/notifications/bulk')
      .set('Authorization', 'Bearer token-valido')
      .send({ userIds: ['u1', 'u2'], type: 'order_update', message: 'Actualizacion masiva' });
    expect(res.status).toBe(201);
    expect(res.body.count).toBe(2);
  });

  it('responde 400 si faltan campos', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .post('/api/notifications/bulk')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });

  it('responde 400 con tipo invalido', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .post('/api/notifications/bulk')
      .set('Authorization', 'Bearer token-valido')
      .send({ userIds: ['u1'], type: 'invalid', message: 'Test' });
    expect(res.status).toBe(400);
  });

  it('responde 400 si supera 500 usuarios', async () => {
    global.mockToken('admin-uid', ['admin']);
    const muchos = Array(501).fill('u1');
    const res = await request(app)
      .post('/api/notifications/bulk')
      .set('Authorization', 'Bearer token-valido')
      .send({ userIds: muchos, type: 'order_update', message: 'Test' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/notifications/:id/read', () => {
  it('marca notificacion como leida', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ isRead: false });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/notifications/n-1/read')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.isRead).toBe(true);
  });

  it('responde 404 si no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .patch('/api/notifications/inexistente/read')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/notifications/user/:userId/read-all', () => {
  it('marca todas como leidas', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'n1', ref: 'ref1' }]);
    const res = await request(app)
      .patch('/api/notifications/user/u1/read-all')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  it('responde si no hay no leidas', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([]);
    const res = await request(app)
      .patch('/api/notifications/user/u1/read-all')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });
});

describe('DELETE /api/notifications/:id', () => {
  it('elimina notificacion correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ message: 'Test' });
    global.mockFirestore.delete.mockResolvedValue();
    const res = await request(app)
      .delete('/api/notifications/n-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/notifications/user/:userId', () => {
  it('elimina todas las notificaciones del usuario', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'n1', ref: 'ref1' }]);
    const res = await request(app)
      .delete('/api/notifications/user/u1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });
});
