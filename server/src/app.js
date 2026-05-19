require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Configuración de CORS
const corsOptions = {
  origin: [
    'http://localhost:5173',        // desarrollo React/Vite
    'http://localhost:3000',        // alternativo desarrollo
    'http://localhost:3001',        // backend
    // agregar dominio de producción cuando se despliegue
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Configuración de limiters
const isLoadTest = process.env.LOAD_TEST === 'true' || process.env.LOAD_TEST_REAL_AUTH === 'true';

const limiter = rateLimit({
  windowMs: isLoadTest ? 5 * 1000 : 15 * 60 * 1000, // 5s (test) / 15 min
  max: 100,                   // 100 requests por IP
  message: { error: 'Demasiadas peticiones, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: isLoadTest ? 5 * 1000 : 15 * 60 * 1000, // 5s (test) / 15 min
  max: 10,                    // 10 requests por IP
  message: { error: 'Demasiados intentos de autenticación, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

// Seguridad HTTP headers
app.use(helmet());

// CORS configurado
app.use(cors(corsOptions));

// Parseo de JSON
app.use(express.json());

// Limiter general para todas las rutas
app.use(limiter);

// Rutas API
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/customers', require('./routes/customers'));

// Ruta para salud del servidor
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Manejo de rutas inexistentes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error global:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;