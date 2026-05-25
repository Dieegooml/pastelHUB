const request = require('supertest');
const app = require('../../src/app');
const { requireOwner, requireModerator, requireCustomer, requireOwnerOrAdmin } = require('../../src/middlewares/auth');

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

describe('requireOwner middleware', () => {
  it('rechaza si el usuario es customer (403)', () => {
    const req = { user: { uid: 'test-uid', roles: ['customer'] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireOwner(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo owners o admins' });
    expect(next).not.toHaveBeenCalled();
  });

  it('permite si el usuario es owner', () => {
    const req = { user: { uid: 'owner-uid', roles: ['owner'] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireOwner(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('permite si el usuario es admin', () => {
    const req = { user: { uid: 'admin-uid', roles: ['admin'] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireOwner(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('requireModerator middleware', () => {
  it('rechaza si el usuario es customer (403)', () => {
    const req = { user: { uid: 'test-uid', roles: ['customer'] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireModerator(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo moderadores o admins' });
    expect(next).not.toHaveBeenCalled();
  });

  it('permite si el usuario es moderator', () => {
    const req = { user: { uid: 'mod-uid', roles: ['moderator'] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireModerator(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('permite si el usuario es admin', () => {
    const req = { user: { uid: 'admin-uid', roles: ['admin'] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireModerator(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('requireCustomer middleware', () => {
  it('rechaza si no hay req.user (401)', () => {
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireCustomer(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Autenticación requerida' });
    expect(next).not.toHaveBeenCalled();
  });

  it('permite cualquier usuario autenticado', () => {
    const req = { user: { uid: 'customer-uid', roles: ['customer'] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireCustomer(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('requireOwnerOrAdmin middleware', () => {
  it('rechaza si no es admin ni propietario (403)', async () => {
    const middleware = requireOwnerOrAdmin(async (req) => {
      return 'owner-uid';
    });
    const req = { user: { uid: 'other-uid', roles: ['customer'] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'No eres el propietario de este recurso' });
    expect(next).not.toHaveBeenCalled();
  });

  it('permite si es admin', async () => {
    const middleware = requireOwnerOrAdmin(async (req) => 'owner-uid');
    const req = { user: { uid: 'admin-uid', roles: ['admin'] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('permite si es el propietario del recurso', async () => {
    const middleware = requireOwnerOrAdmin(async (req) => req.user.uid);
    const req = { user: { uid: 'owner-uid', roles: ['owner'] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
