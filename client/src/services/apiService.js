import { auth } from '../config/firebase';

const BASE = import.meta.env.VITE_API_URL;

async function getHeaders() {
  const token = await auth.currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export const api = {
  get: async (path) => {
    const res = await fetch(`${BASE}${path}`, { headers: await getHeaders() });
    return res.json();
  },
  post: async (path, body) => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST', headers: await getHeaders(), body: JSON.stringify(body),
    });
    return res.json();
  },
  put: async (path, body) => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'PUT', headers: await getHeaders(), body: JSON.stringify(body),
    });
    return res.json();
  },
  delete: async (path) => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'DELETE', headers: await getHeaders(),
    });
    return res.json();
  },
  patch: async (path, body) => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'PATCH', headers: await getHeaders(), body: JSON.stringify(body),
    });
    return res.json();
  },
};