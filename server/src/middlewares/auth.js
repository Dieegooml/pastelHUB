const { admin } = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  if (process.env.LOAD_TEST === 'true' && process.env.LOAD_TEST_REAL_AUTH !== 'true') {
    req.user = { uid: 'load-test-user', email: 'load@test.com', roles: ['admin'] };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
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

const requireOwner = (req, res, next) => {
  const roles = req.user?.roles || [];
  if (roles.includes('admin') || roles.includes('owner')) {
    return next();
  }
  res.status(403).json({ error: 'Solo owners o admins' });
};

const requireSelfOrAdmin = (paramName = 'id') => {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    if (roles.includes('admin')) return next();
    if (req.user?.uid === req.params[paramName]) return next();
    return res.status(403).json({ error: 'No tienes permiso' });
  };
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

const requireAssignRole = (req, res, next) => {
  const roles = req.user?.roles || [];
  if (roles.includes('admin')) return next();
  if (roles.includes('moderator')) {
    const { roles: targetRoles } = req.body;
    if (targetRoles && targetRoles.includes('admin')) {
      return res.status(403).json({ error: 'Solo admins pueden asignar el rol admin' });
    }
    return next();
  }
  res.status(403).json({ error: 'Solo admins o moderadores' });
};

const requireSelfOrStaff = (paramName = 'id') => {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    if (roles.includes('admin') || roles.includes('moderator')) return next();
    if (req.user?.uid === req.params[paramName]) return next();
    return res.status(403).json({ error: 'No tienes permiso' });
  };
};

module.exports = { verifyToken, requireAdmin, requireOwner, requireModerator, requireCustomer, requireOwnerOrAdmin, requireSelfOrAdmin, requireAssignRole, requireSelfOrStaff };