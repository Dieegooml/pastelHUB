const { admin } = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  if (process.env.LOAD_TEST === 'true' && process.env.LOAD_TEST_REAL_AUTH !== 'true') {
    req.user = { uid: 'load-test-user', email: 'load@test.com', roles: ['admin'] };
    return next();
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const requireAdmin = (req, res, next) => {
  const roles = req.user?.roles || [];
  if (!roles.includes('admin')) {
    return res.status(403).json({ error: 'Solo admins' });
  }
  next();
};

const requireModerator = (req, res, next) => {
  const roles = req.user?.roles || [];
  if (roles.includes('admin') || roles.includes('moderator')) {
    return next();
  }
  res.status(403).json({ error: 'Solo moderadores o admins' });
};

const requireCustomer = (req, res, next) => {
  const roles = req.user?.roles || [];
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }
  if (!roles.includes('customer') && !roles.includes('admin')) {
    return res.status(403).json({ error: 'Solo clientes o admins' });
  }
  next();
};

const requireOwnerOrAdmin = (getResourceOwnerId) => {
  return async (req, res, next) => {
    const roles = req.user?.roles || [];
    if (roles.includes('admin')) return next();

    try {
      const ownerId = await getResourceOwnerId(req);
      if (req.user.uid === ownerId) return next();
    } catch (e) {
      const status = e.status || 500;
      return res.status(status).json({ error: e.message || 'Error al verificar propiedad del recurso' });
    }

    res.status(403).json({ error: 'No eres el propietario de este recurso' });
  };
};

module.exports = { verifyToken, requireAdmin, requireModerator, requireCustomer, requireOwnerOrAdmin };