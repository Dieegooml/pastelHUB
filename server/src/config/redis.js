const Redis = require('ioredis');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || '';
let client = null;
let _ready = false;

function getClient() {
  if (!REDIS_URL) return null;
  if (!client) {
    client = new Redis(REDIS_URL, {
      lazyConnect: true,
      retryStrategy: (t) => Math.min(t * 50, 2000),
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    client.on('ready', () => { _ready = true; });
    client.on('close', () => { _ready = false; });
    client.on('error', (err) => {
      logger.warn('Redis no disponible, operando sin cache distribuido', { error: err.message });
      _ready = false;
    });
  }
  return client;
}

function isReady() {
  return _ready;
}

module.exports = { getClient, isReady };
