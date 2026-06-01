const cron = require('node-cron');
const app = require('./app');
const { createBackup, ALL_COLLECTIONS } = require('./utils/backupService');

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log('Servidor en puerto', PORT);
});

if (process.env.NODE_ENV === 'production' && !process.env.LOAD_TEST) {
  const schedule = process.env.BACKUP_SCHEDULE || '0 3 * * *';
  cron.schedule(schedule, async () => {
    console.log('[BACKUP] Iniciando backup automático...');
    try {
      const result = await createBackup(ALL_COLLECTIONS);
      console.log(`[BACKUP] Completado: ${result.meta.total} documentos`);
    } catch (e) {
      console.error('[BACKUP] Error:', e.message);
    }
  });
  console.log(`[BACKUP] Programación: ${schedule}`);
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`El puerto ${PORT} está en uso`);
  } else {
    console.error('Error al iniciar el servidor:', err.message);
  }
  process.exit(1);
});

function gracefulShutdown(signal) {
  console.log(`\n${signal} recibido. Cerrando servidor...`);
  server.close(() => {
    console.log('Servidor cerrado correctamente.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forzando cierre tras 10s de espera.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
