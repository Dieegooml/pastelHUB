import { api } from './apiService';

export const shopsService = {
  getAll:            ()           => api.get('/shops'),
  getById:           (id)         => api.get(`/shops/${id}`),
  create:            (data)       => api.post('/shops', data),
  update:            (id, data)   => api.put(`/shops/${id}`, data),
  delete:            (id)         => api.delete(`/shops/${id}`),
  updateStatus:      (id, status) => api.patch(`/shops/${id}/status`, { status }),

  // Schedules
  getSchedules:      (id)         => api.get(`/shops/${id}/schedules`),
  addSchedule:       (id, data)   => api.post(`/shops/${id}/schedules`, data),
  updateSchedule:    (id, day, data) => api.put(`/shops/${id}/schedules/${day}`, data),
  deleteSchedule:    (id, day)    => api.delete(`/shops/${id}/schedules/${day}`),

  // Categories
  getCategories:     (id)         => api.get(`/shops/${id}/categories`),
  addCategory:       (id, data)   => api.post(`/shops/${id}/categories`, data),
  updateCategory:    (id, catId, data) => api.put(`/shops/${id}/categories/${catId}`, data),
  deleteCategory:    (id, catId)  => api.delete(`/shops/${id}/categories/${catId}`),
};
