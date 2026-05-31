import { api } from './apiService';

export const invoicesService = {
  getAll: () => api.get('/invoices'),
  getById: (id) => api.get(`/invoices/${id}`),
  getByOrder: (orderId) => api.get(`/invoices/order/${orderId}`),
  getByShop: (shopId) => api.get(`/invoices/shop/${shopId}`),
  generate: (orderId) => api.post('/invoices', { orderId }),
  updateStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
  downloadPdf: (id) => `${api.defaults?.baseURL || ''}/api/invoices/${id}/pdf`,
};
