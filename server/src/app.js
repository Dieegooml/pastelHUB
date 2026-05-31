require('dotenv').config();
const compression = require('compression');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

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
  max: isDev ? 500 : 100,          // 500 (dev) / 100 (prod)
  message: { error: 'Demasiadas peticiones, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: isLoadTest ? 5 * 1000 : 15 * 60 * 1000, // 5s (test) / 15 min
  max: isDev ? 100 : 10,           // 100 (dev) / 10 (prod)
  message: { error: 'Demasiados intentos de autenticación, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

// Compresión de respuestas
app.use(compression());

// Seguridad HTTP headers
app.use(helmet());

// CORS configurado
app.use(cors(corsOptions));

// Limiter general para todas las rutas (antes del body parser para evitar DoS)
app.use(limiter);

// Parseo de JSON con límite de tamaño
app.use(express.json({ limit: '10mb' }));

// Rutas API
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/support', require('./routes/support'));
app.use('/api/invoices', require('./routes/invoices'));

// Ruta para salud del servidor
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Manejo de rutas inexistentes (solo API)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error global:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;