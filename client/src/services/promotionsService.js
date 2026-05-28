import { api } from './apiService';

export const promotionsService = {
  getByShopPublic:   (shopId)              => api.get(`/promotions/shop/${shopId}`),
  getByShopAll:      (shopId)              => api.get(`/promotions/shop/${shopId}/all`),
  getById:           (id)                  => api.get(`/promotions/${id}`),
  create:            (data)                => api.post('/promotions', data),
  update:            (id, data)            => api.put(`/promotions/${id}`, data),
  toggle:            (id)                  => api.patch(`/promotions/${id}/toggle`),
  delete:            (id)                  => api.delete(`/promotions/${id}`),
};
