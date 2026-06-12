const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  jest.resetModules();
});

afterAll(() => {
  process.env = originalEnv;
});

describe('rateLimiter', () => {
  it('createRoleLimiter retorna un middleware function', () => {
    const { createRoleLimiter } = require('../../src/middlewares/rateLimiter');
    const middleware = createRoleLimiter();
    expect(typeof middleware).toBe('function');
    // express-rate-limit middleware tiene 3 args
    expect(middleware.length).toBe(3);
  });

  it('createRoleLimiter con auth=true retorna middleware', () => {
    const { createRoleLimiter } = require('../../src/middlewares/rateLimiter');
    const middleware = createRoleLimiter({ auth: true });
    expect(typeof middleware).toBe('function');
  });

  it('exporta roleLimits y authRoleLimits', () => {
    const { roleLimits, authRoleLimits } = require('../../src/middlewares/rateLimiter');
    expect(roleLimits.admin).toBeDefined();
    expect(roleLimits.customer).toBeDefined();
    expect(roleLimits.anonymous).toBeDefined();
    expect(authRoleLimits.admin).toBeDefined();
    expect(authRoleLimits.anonymous).toBeDefined();
  });

  it('roleLimits tiene limites para todos los roles', () => {
    const { roleLimits } = require('../../src/middlewares/rateLimiter');
    expect(Object.keys(roleLimits)).toEqual(
      expect.arrayContaining(['admin', 'moderator', 'owner', 'customer', 'anonymous'])
    );
  });

  it('authRoleLimits tiene limites menores que roleLimits', () => {
    const { roleLimits, authRoleLimits } = require('../../src/middlewares/rateLimiter');
    expect(authRoleLimits.admin).toBeLessThan(roleLimits.admin);
    expect(authRoleLimits.anonymous).toBeLessThan(roleLimits.anonymous);
  });
});
