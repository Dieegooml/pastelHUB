import { api } from './apiService';

export const customersService = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  delete: (id) => api.delete(`/customers/${id}`),
  getAddresses: (id) => api.get(`/customers/${id}/addresses`),
  addAddress: (id, data) => api.post(`/customers/${id}/addresses`, data),
  updateAddress: (id, addressId, data) => api.put(`/customers/${id}/addresses/${addressId}`, data),
  deleteAddress: (id, addressId) => api.delete(`/customers/${id}/addresses/${addressId}`),
};
