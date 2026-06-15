const { getClient, isReady } = require('../config/redis');
const logger = require('./logger');

const DEFAULT_TTL = 60;

async function get(key) {
  if (!isReady()) return null;
  try {
    const data = await getClient().get(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    logger.warn('redisCache.get error', { key, error: e.message });
    return null;
  }
}

async function set(key, data, ttl = DEFAULT_TTL) {
  if (!isReady()) return;
  try {
    await getClient().setEx(key, ttl, JSON.stringify(data));
  } catch (e) {
    logger.warn('redisCache.set error', { key, error: e.message });
  }
}

async function del(key) {
  if (!isReady()) return;
  try {
    await getClient().del(key);
  } catch (e) {
    logger.warn('redisCache.del error', { key, error: e.message });
  }
}

async function invalidatePrefix(prefix) {
  if (!isReady()) return;
  try {
    const stream = getClient().scanStream({ match: `${prefix}*`, count: 100 });
    for await (const keys of stream) {
      if (keys.length) await getClient().del(...keys);
    }
  } catch (e) {
    logger.warn('redisCache.invalidatePrefix error', { prefix, error: e.message });
  }
}

module.exports = { get, set, del, invalidatePrefix, DEFAULT_TTL };
