import { api } from './apiService';

export const productsService = {
  getAll:           ()                 => api.get('/products'),
  getById:          (id)               => api.get(`/products/${id}`),
  getByShop:        (shopId)           => api.get(`/products/shop/${shopId}`),
  create:           (data)             => api.post('/products', data),
  update:           (id, data)         => api.put(`/products/${id}`, data),
  delete:           (id)               => api.delete(`/products/${id}`),
  updateAvailability: (id, is_available) => api.patch(`/products/${id}/availability`, { is_available }),

  // Variants
  getVariants:      (id)                       => api.get(`/products/${id}/variants`),
  addVariant:       (id, data)                 => api.post(`/products/${id}/variants`, data),
  updateVariant:    (id, variantId, data)      => api.put(`/products/${id}/variants/${variantId}`, data),
  deleteVariant:    (id, variantId)            => api.delete(`/products/${id}/variants/${variantId}`),
};
