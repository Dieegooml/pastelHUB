require('dotenv').config();
const compression = require('compression');
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const { createTraceMiddleware } = require('./utils/logger');
const { verifyToken, requireAdmin } = require('./middlewares/auth');
const { db } = require('./config/firebase');
const cache = require('./utils/cache');

const shopCache = cache.createStore('shops', { ttl: 60000 });
const productCache = cache.createStore('products', { ttl: 60000 });
const promotionCache = cache.createStore('promotions', { ttl: 60000 });
const reviewCache = cache.createStore('reviews', { ttl: 30000 });

const clientUrl = process.env.CLIENT_URL || 'http://localhost';
const corsOptions = {
  origin: [
    clientUrl,
    'http://localhost',
    'http://localhost:80',
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id'],
  credentials: true,
};

const app = express();
app.set('etag', 'weak');

const publicCache = (req, res, next) => {
  if (req.method === 'GET' && !req.headers.authorization) {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  }
  next();
};

const blockedIPs = new Set(
  (process.env.BLOCKED_IPS || '').split(',').map(s => s.trim()).filter(Boolean)
);

function blockIPs(req, res, next) {
  const ip = req.ip;
  if (blockedIPs.has(ip)) {
    logger.warn('Blocked IP attempted access', { ip, path: req.path });
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
}

function suspiciousRequestLogger(req, res, next) {
  const warnings = [];

  if (!req.headers['user-agent']) {
    warnings.push('missing-user-agent');
  }

  const suspiciousPaths = [
    '/admin', '/wp-admin', '/wp-login', '/.env', '/config',
    '/_ah', '/.git', '/vendor', '/phpmyadmin', '/sql',
  ];
  if (suspiciousPaths.some(p => req.path.startsWith(p))) {
    warnings.push('unusual-path');
  }

  if (/['"\\;$(){}\n\r]/.test(req.path)) {
    warnings.push('path-injection-attempt');
  }

  if (warnings.length > 0) {
    logger.warn('Suspicious request detected', {
      ip: req.ip,
      method: req.method,
      path: req.path,
      warnings,
      userAgent: req.headers['user-agent'] || 'missing',
    });
  }

  next();
}

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación. Intenta de nuevo en un minuto.' },
});

app.use(compression());
app.use(helmet());
app.use(cors(corsOptions));
app.use(createTraceMiddleware());
app.use(blockIPs);
app.use(suspiciousRequestLogger);
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));
app.use(generalLimiter);
app.use('/api/auth', authLimiter);

app.use((req, res, next) => {
  if (req.path.length > 1 && req.path.endsWith('/')) {
    req.url = req.url.slice(0, -1);
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger.log(level, 'HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      userId: req.user?.uid || 'anonymous',
      traceId: req.traceId,
    });
  });
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/shops', publicCache, require('./routes/shops'));
app.use('/api/products', publicCache, require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/promotions', publicCache, require('./routes/promotions'));
app.use('/api/reviews', publicCache, require('./routes/reviews'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/support', require('./routes/support'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin/backup', require('./routes/backups'));
app.use('/api/uploads', require('./routes/uploads'));

app.get('/api/health', async (req, res) => {
  try {
    await db.collection('health').doc('_check').get();
    const cacheStats = cache.allStats();
    res.json({
      status: 'ok',
      firestore: 'connected',
      cache: cacheStats,
      uptime: process.uptime(),
    });
  } catch (e) {
    res.status(503).json({ status: 'error', firestore: 'disconnected', message: e.message });
  }
});

app.get('/api/metrics', (req, res) => {
  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();
  res.json({
    uptime: process.uptime(),
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
    },
    cpu: {
      user: Math.round(cpu.user / 1000) + 'ms',
      system: Math.round(cpu.system / 1000) + 'ms',
    },
    nodeVersion: process.version,
    platform: process.platform,
    env: process.env.NODE_ENV || 'development',
    cache: cache.allStats(),
  });
});

app.get('/api/admin/cache/stats', verifyToken, requireAdmin, (req, res) => {
  res.json(cache.allStats());
});

app.use((req, res, next) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  const traceId = req.traceId || 'unknown';
  logger.error('Error global', { stack: err.stack, method: req.method, path: req.path, traceId });
  res.status(500).json({ error: 'Error interno del servidor', traceId });
});

module.exports = app;
