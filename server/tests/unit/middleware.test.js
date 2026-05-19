const request = require('supertest');
const app = require('../../src/app');

describe('verifyToken middleware', () => {
  it('rechaza peticion sin token (401)', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token requerido');
  });

  it('rechaza peticion con token invalido (401)', async () => {
    global.mockFirebaseAuth.verifyIdToken.mockRejectedValue(new Error('Token invalido'));
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer token-malo');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token inválido');
  });

  it('rechaza peticion con Authorization mal formado (401)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'InvalidHeader');
    expect(res.status).toBe(401);
  });
});

describe('requireAdmin middleware', () => {
  it('rechaza si el usuario no tiene rol admin (403)', async () => {
    global.mockToken('test-uid', ['customer']);
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Solo admins');
  });

  it('permite acceso si el usuario tiene rol admin', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([]);
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });
});
