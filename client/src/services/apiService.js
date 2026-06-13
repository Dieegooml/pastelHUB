import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { triggerRateLimit } from './rateLimitHandler';

const BASE = import.meta.env.VITE_API_URL || '';

const getCache = new Map();
const GET_CACHE_TTL = 30000;

function getCached(path) {
  const entry = getCache.get(path);
  if (entry && Date.now() - entry.ts < GET_CACHE_TTL) return entry.data;
  getCache.delete(path);
  return null;
}

function setCache(path, data) {
  getCache.set(path, { data, ts: Date.now() });
  if (getCache.size > 200) {
    const now = Date.now();
    for (const [k, v] of getCache) {
      if (now - v.ts > GET_CACHE_TTL) getCache.delete(k);
    }
  }
}

function invalidateCache(prefix) {
  if (prefix) {
    for (const k of getCache.keys()) {
      if (k.startsWith(prefix)) getCache.delete(k);
    }
  } else {
    getCache.clear();
  }
}

async function getHeaders() {
  const token = await auth.currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse(res) {
  if (res.status === 429) triggerRateLimit();
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    const err = new Error(data.error || data.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const RETRY_DELAYS = [200, 400, 800];
const MAX_RETRIES = 3;

async function retryableFetch(url, options, attempt = 0) {
  try {
    const res = await fetch(url, options);
    if (res.status < 500 && res.status !== 429) return res;
    if (attempt >= MAX_RETRIES) return res;
    await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
    return retryableFetch(url, options, attempt + 1);
  } catch (err) {
    if (attempt >= MAX_RETRIES) throw err;
    await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
    return retryableFetch(url, options, attempt + 1);
  }
}

async function apiFetch(path, options = {}) {
  const res = await retryableFetch(`${BASE}${path}`, {
    ...options,
    headers: { ...(await getHeaders()), ...options.headers },
  });

  if (res.status !== 401) return handleResponse(res);

  // 401 — try refreshing the token once and retry
  if (auth.currentUser) {
    const newToken = await auth.currentUser.getIdToken(true);
    const retryRes = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
        ...options.headers,
      },
    });
    if (retryRes.ok) return handleResponse(retryRes);
    if (retryRes.status === 401) {
      try { await signOut(auth); } catch {}
      const text2 = await retryRes.text().catch(() => '');
      const data2 = text2 ? JSON.parse(text2) : {};
      const err = new Error(data2.error || `HTTP ${retryRes.status}`);
      err.status = retryRes.status;
      throw err;
    }
    return handleResponse(retryRes);
  }

  const text = await res.text().catch(() => '');
  const data = text ? JSON.parse(text) : {};
  const err = new Error(data.error || `HTTP ${res.status}`);
  err.status = res.status;
  throw err;
}

export const api = {
  get: (path) => {
    const cached = getCached(path);
    if (cached) return Promise.resolve(cached);
    return apiFetch(path).then(data => { setCache(path, data); return data; });
  },
  post:   (path, body) => { invalidateCache(path.split('/').slice(0, 2).join('/')); return apiFetch(path, { method: 'POST', body: JSON.stringify(body) }); },
  put:    (path, body) => { invalidateCache(path.split('/').slice(0, 2).join('/')); return apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }); },
  delete: (path) => { invalidateCache(path.split('/').slice(0, 2).join('/')); return apiFetch(path, { method: 'DELETE' }); },
  patch:  (path, body) => { invalidateCache(path.split('/').slice(0, 2).join('/')); return apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }); },
};