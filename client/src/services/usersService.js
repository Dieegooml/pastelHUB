import { api } from './apiService';

export const usersService = {
  getAll:        ()             => api.get('/users'),
  getById:       (id)           => api.get(`/users/${id}`),
  create:        (data)         => api.post('/users', data),
  update:        (id, data)     => api.put(`/users/${id}`, data),
  delete:        (id)           => api.delete(`/users/${id}`),
  updateStatus:  (id, isActive) => api.patch(`/users/${id}/status`, { isActive }),

  // Addresses
  getAddresses:  (id)                   => api.get(`/users/${id}/addresses`),
  addAddress:    (id, data)             => api.post(`/users/${id}/addresses`, data),
  updateAddress: (id, addressId, data)  => api.put(`/users/${id}/addresses/${addressId}`, data),
  deleteAddress: (id, addressId)        => api.delete(`/users/${id}/addresses/${addressId}`),
};
