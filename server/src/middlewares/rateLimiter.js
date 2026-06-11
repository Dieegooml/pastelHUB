const { rateLimit, defaultKeyGenerator } = require('express-rate-limit');
const logger = require('../utils/logger');

const isLoadTest = process.env.LOAD_TEST === 'true' || process.env.LOAD_TEST_REAL_AUTH === 'true';
const isTest = process.env.NODE_ENV === 'test' || typeof global.it === 'function';
const windowMs = isLoadTest ? 5 * 1000 : 15 * 60 * 1000;
const testMax = isLoadTest ? 100000 : 500;

const roleLimits = {
  admin: parseInt(process.env.RATE_LIMIT_ADMIN) || (isLoadTest ? 200000 : 2000),
  moderator: parseInt(process.env.RATE_LIMIT_MODERATOR) || (isLoadTest ? 150000 : 1000),
  owner: parseInt(process.env.RATE_LIMIT_OWNER) || (isLoadTest ? 100000 : 1000),
  customer: parseInt(process.env.RATE_LIMIT_CUSTOMER) || (isLoadTest ? 100000 : 500),
  anonymous: parseInt(process.env.RATE_LIMIT_ANONYMOUS) || (isLoadTest ? 50000 : 200),
};

const authRoleLimits = {
  admin: parseInt(process.env.AUTH_RATE_LIMIT_ADMIN) || (isLoadTest ? 50000 : 100),
  moderator: parseInt(process.env.AUTH_RATE_LIMIT_MODERATOR) || (isLoadTest ? 40000 : 75),
  owner: parseInt(process.env.AUTH_RATE_LIMIT_OWNER) || (isLoadTest ? 30000 : 60),
  customer: parseInt(process.env.AUTH_RATE_LIMIT_CUSTOMER) || (isLoadTest ? 20000 : 50),
  anonymous: parseInt(process.env.AUTH_RATE_LIMIT_ANONYMOUS) || (isLoadTest ? 10000 : 20),
};

function createRoleLimiter(options = {}) {
  const { auth, ...rateLimitOptions } = options;
  const limits = auth ? authRoleLimits : roleLimits;
  const generalMax = testMax;

  return rateLimit({
    windowMs: options.windowMs || windowMs,
    max: (req) => {
      const roles = req.user?.roles || [];
      let roleKey = 'anonymous';
      if (roles.includes('admin')) roleKey = 'admin';
      else if (roles.includes('moderator')) roleKey = 'moderator';
      else if (roles.includes('owner')) roleKey = 'owner';
      else if (roles.includes('customer')) roleKey = 'customer';

      const limit = limits[roleKey] || generalMax;
      logger.debug('Rate limit check', { role: roleKey, limit, path: req.path });
      return limit;
    },
    message: { error: 'Demasiadas peticiones, intenta en 15 minutos' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.user?.uid || defaultKeyGenerator(req);
    },
    skip: () => isTest,
    ...rateLimitOptions,
  });
}

module.exports = { createRoleLimiter, roleLimits, authRoleLimits };
