const app = require('./app');

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log('Servidor en puerto', PORT);
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`El puerto ${PORT} está en uso`);
  } else {
    console.error('Error al iniciar el servidor:', err.message);
  }
  process.exit(1);
});