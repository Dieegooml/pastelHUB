import { api } from './apiService';
import { auth } from '../config/firebase';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const invoicesService = {
  getAll: () => api.get('/invoices'),
  getById: (id) => api.get(`/invoices/${id}`),
  getByOrder: (orderId) => api.get(`/invoices/order/${orderId}`),
  getByShop: (shopId) => api.get(`/invoices/shop/${shopId}`),
  generate: (orderId) => api.post('/invoices', { orderId }),
  updateStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
  downloadPdf: async (id) => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${BASE}/invoices/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const data = text ? JSON.parse(text) : {};
      throw new Error(data.error || `Error HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factura-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
