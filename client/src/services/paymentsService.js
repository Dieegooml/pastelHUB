import { api } from './apiService';

export const paymentsService = {
  getAll: () => api.get('/payments'),
  getById: (id) => api.get(`/payments/${id}`),
  getByOrder: (orderId) => api.get(`/payments/order/${orderId}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
  updateStatus: (id, paymentStatus, transaction_ref) => api.patch(`/payments/${id}/status`, { paymentStatus, transaction_ref }),
  processGateway: (data) => api.post('/payments/gateway', data),
};
