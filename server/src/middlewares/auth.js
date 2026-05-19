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

module.exports = { verifyToken, requireAdmin };