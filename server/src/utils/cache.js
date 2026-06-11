const logger = require('./logger');

const stores = new Map();
const TTL = parseInt(process.env.CACHE_TTL) || 60000;
const MAX_ENTRIES = parseInt(process.env.CACHE_MAX_ENTRIES) || 5000;
const CLEANUP_INTERVAL = parseInt(process.env.CACHE_CLEANUP_INTERVAL) || 30000;

function createStore(name, options = {}) {
  const store = {
    _data: new Map(),
    _name: name,
    _ttl: options.ttl || TTL,
    _maxEntries: options.maxEntries || MAX_ENTRIES,
    _hits: 0,
    _misses: 0,
    _sets: 0,
    _evictions: 0,
  };

  stores.set(name, store);
  return store;
}

function get(store, key) {
  const entry = store._data.get(key);
  if (!entry) {
    store._misses++;
    return null;
  }
  if (Date.now() - entry.ts > store._ttl) {
    store._data.delete(key);
    store._misses++;
    return null;
  }
  store._hits++;
  entry.access = Date.now();
  return entry.data;
}

function set(store, key, data) {
  if (store._data.size >= store._maxEntries) {
    let oldest = Infinity;
    let oldestKey = null;
    for (const [k, v] of store._data) {
      if (v.access < oldest) {
        oldest = v.access;
        oldestKey = k;
      }
    }
    if (oldestKey) {
      store._data.delete(oldestKey);
      store._evictions++;
    }
  }
  store._data.set(key, { data, ts: Date.now(), access: Date.now() });
  store._sets++;
}

function del(store, key) {
  store._data.delete(key);
}

function clear(store) {
  store._data.clear();
}

function invalidatePrefix(store, prefix) {
  for (const k of store._data.keys()) {
    if (k.startsWith(prefix)) store._data.delete(k);
  }
}

function stats(store) {
  return {
    name: store._name,
    size: store._data.size,
    maxEntries: store._maxEntries,
    ttl: store._ttl,
    hits: store._hits,
    misses: store._misses,
    sets: store._sets,
    evictions: store._evictions,
    hitRate: store._hits + store._misses > 0
      ? (store._hits / (store._hits + store._misses) * 100).toFixed(1) + '%'
      : '0%',
  };
}

function allStats() {
  const result = {};
  for (const [name, store] of stores) {
    result[name] = stats(store);
  }
  return result;
}

setInterval(() => {
  const now = Date.now();
  for (const [, store] of stores) {
    let before = store._data.size;
    for (const [k, v] of store._data) {
      if (now - v.ts > store._ttl) store._data.delete(k);
    }
    if (store._data.size !== before) {
      logger.debug('Cache cleanup', { store: store._name, removed: before - store._data.size, remaining: store._data.size });
    }
  }
}, CLEANUP_INTERVAL);

module.exports = { createStore, get, set, del, clear, invalidatePrefix, stats, allStats };
