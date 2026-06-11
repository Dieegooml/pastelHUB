const cron = require('node-cron');
const app = require('./app');
const logger = require('./utils/logger');
const { createBackup, ALL_COLLECTIONS } = require('./utils/backupService');
const { createWebSocketServer } = require('./utils/websocket');

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  logger.info('Servidor iniciado', { port: PORT, env: process.env.NODE_ENV || 'development' });
});

createWebSocketServer(server);

if (process.env.NODE_ENV === 'production' && !process.env.LOAD_TEST) {
  const schedule = process.env.BACKUP_SCHEDULE || '0 3 * * *';
  cron.schedule(schedule, async () => {
    logger.info('Backup automático iniciado');
    try {
      const result = await createBackup(ALL_COLLECTIONS);
      logger.info('Backup completado', { totalDocs: result.meta.total });
    } catch (e) {
      logger.error('Error en backup automático', { error: e.message });
    }
  });
  logger.info('Backup programado', { schedule });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error('Puerto en uso', { port: PORT });
  } else {
    logger.error('Error al iniciar servidor', { error: err.message });
  }
  process.exit(1);
});

function gracefulShutdown(signal) {
  logger.warn('Señal recibida, cerrando servidor', { signal });
  server.close(() => {
    logger.info('Servidor cerrado correctamente');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forzando cierre tras 10s de espera');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
