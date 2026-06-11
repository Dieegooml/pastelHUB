const winston = require('winston');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'pastelhub-server' },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, service, traceId, ...meta }) => {
              const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
              const traceStr = traceId ? ` [${traceId}]` : '';
              return `${timestamp}${traceStr} [${level}]: ${message}${metaStr}`;
            })
          ),
    }),
  ],
});

function createTraceMiddleware() {
  return (req, res, next) => {
    req.traceId = req.headers['x-trace-id'] || uuidv4().slice(0, 8);
    res.setHeader('X-Trace-Id', req.traceId);
    next();
  };
}

function childLogger(traceId) {
  return logger.child({ traceId });
}

module.exports = logger;
module.exports.createTraceMiddleware = createTraceMiddleware;
module.exports.childLogger = childLogger;
