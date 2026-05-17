import { api } from './apiService';

export const notificationsService = {
  getAll:           ()                   => api.get('/notifications'),
  getByUser:        (userId)             => api.get(`/notifications/user/${userId}`),
  getUnreadByUser:  (userId)             => api.get(`/notifications/user/${userId}/unread`),
  getById:          (id)                 => api.get(`/notifications/${id}`),
  create:           (data)               => api.post('/notifications', data),
  createBulk:       (data)               => api.post('/notifications/bulk', data),
  delete:           (id)                 => api.delete(`/notifications/${id}`),
  deleteByUser:     (userId)             => api.delete(`/notifications/user/${userId}`),
  markAsRead:       (id)                 => api.patch(`/notifications/${id}/read`),
  markAllAsRead:    (userId)             => api.patch(`/notifications/user/${userId}/read-all`),
};
