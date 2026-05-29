import { api } from './apiService';

export const reviewsService = {
  getAll:           ()                      => api.get('/reviews'),
  getById:          (id)                    => api.get(`/reviews/${id}`),
  getByShop:        (shopId)                => api.get(`/reviews/shop/${shopId}`),
  getByCustomer:    (customerId)            => api.get(`/reviews/customer/${customerId}`),
  getByStatus:      (status)                => api.get(`/reviews/status/${status}`),
  getByOrder:       (orderId)               => api.get(`/reviews/by-order/${orderId}`),
  create:           (data)                  => api.post('/reviews', data),
  update:           (id, data)              => api.put(`/reviews/${id}`, data),
  delete:           (id)                    => api.delete(`/reviews/${id}`),
  moderate:         (id, status)            => api.patch(`/reviews/${id}/status`, { status }),
  reply:            (id, ownerReply)        => api.patch(`/reviews/${id}/reply`, { ownerReply }),
};
