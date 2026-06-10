require('dotenv').config();
const compression = require('compression');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { db } = require('./config/firebase');

// Configuración de CORS
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
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Configuración de limiters
const isLoadTest = process.env.LOAD_TEST === 'true' || process.env.LOAD_TEST_REAL_AUTH === 'true';
const isDev = process.env.NODE_ENV === 'development';

const limiter = rateLimit({
  windowMs: isLoadTest ? 5 * 1000 : 15 * 60 * 1000, // 5s (test) / 15 min
  max: isLoadTest ? 100000 : 500,                     // 100k (test) / 500 (prod & dev)
  message: { error: 'Demasiadas peticiones, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: isLoadTest ? 5 * 1000 : 15 * 60 * 1000, // 5s (test) / 15 min
  max: isLoadTest ? 20000 : 50,                       // 20k (test) / 50 (prod & dev)
  message: { error: 'Demasiados intentos de autenticación, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
app.set('etag', 'weak');

// Cache-Control para endpoints públicos GET
const publicCache = (req, res, next) => {
  if (req.method === 'GET' && !req.headers.authorization) {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  }
  next();
};

// Compresión de respuestas
app.use(compression());

// Seguridad HTTP headers
app.use(helmet());

// CORS configurado
app.use(cors(corsOptions));

// Limiter general para todas las rutas (antes del body parser para evitar DoS)
app.use(limiter);

// Parseo de JSON con límite de tamaño
app.use(express.json({ limit: '100kb' }));

// Normalizar trailing slash para Express 5 (router.get('/') no coincide sin /)
app.use((req, res, next) => {
  if (req.path.length > 1 && req.path.endsWith('/')) {
    req.url = req.url.slice(0, -1);
  }
  next();
});

// Logging de peticiones HTTP
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      userId: req.user?.uid || 'anonymous',
    });
  });
  next();
});

// Rutas API
app.use('/api/auth', authLimiter, require('./routes/auth'));
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

// Ruta para salud del servidor
app.get('/api/health', async (req, res) => {
  try {
    await db.collection('health').doc('_check').get();
    res.json({ status: 'ok', firestore: 'connected' });
  } catch (e) {
    res.status(503).json({ status: 'error', firestore: 'disconnected', message: e.message });
  }
});

// Métricas de monitoreo (uso interno)
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
  });
});

// Manejo de rutas inexistentes (solo API)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  logger.error('Error global', { stack: err.stack, method: req.method, path: req.path });
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;