import { auth } from '../config/firebase';

const BASE = import.meta.env.VITE_API_URL;

async function getHeaders() {
  const token = await auth.currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  get: async (path) => {
    const res = await fetch(`${BASE}${path}`, { headers: await getHeaders() });
    return handleResponse(res);
  },
  post: async (path, body) => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST', headers: await getHeaders(), body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  put: async (path, body) => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'PUT', headers: await getHeaders(), body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  delete: async (path) => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'DELETE', headers: await getHeaders(),
    });
    return handleResponse(res);
  },
  patch: async (path, body) => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'PATCH', headers: await getHeaders(), body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
};