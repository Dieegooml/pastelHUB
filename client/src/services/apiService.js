import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { triggerRateLimit } from './rateLimitHandler';

const BASE = import.meta.env.VITE_API_URL || '';

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

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
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
  get:    (path) => apiFetch(path),
  post:   (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put:    (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
  patch:  (path, body) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
};