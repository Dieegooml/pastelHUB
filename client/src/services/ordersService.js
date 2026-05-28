import { api } from './apiService';

export const ordersService = {
  getAll:           ()                   => api.get('/orders'),
  getById:          (id)                 => api.get(`/orders/${id}`),
  getByShop:        (shopId)             => api.get(`/orders/shop/${shopId}`),
  getSummary:       (shopId, days = 30)  => api.get(`/orders/shop/${shopId}/summary?days=${days}`),
  getMy:            ()                   => api.get('/orders/my'),
  getByCustomer:    (userId)             => api.get(`/orders/customer/${userId}`),
  getByStatus:      (status)             => api.get(`/orders/status/${status}`),
  create:           (data)               => api.post('/orders', data),
  delete:           (id)                 => api.delete(`/orders/${id}`),
  cancelOrder:         (id) => api.patch(`/orders/${id}/cancel`),
  updateStatus:        (id, status) => api.patch(`/orders/${id}/status`, { status }),
  updatePaymentStatus: (id, status, transaction_ref) => api.patch(`/orders/${id}/payment-status`, { status, transaction_ref }),
  addReview:        (id, rating, comment) => api.patch(`/orders/${id}/review`, { rating, comment }),
  replyReview:      (id, reply_text)     => api.patch(`/orders/${id}/review/reply`, { reply_text }),
};
