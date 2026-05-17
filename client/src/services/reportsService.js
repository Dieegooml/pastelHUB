import { api } from './apiService';

export const reportsService = {
  getAll:           ()                   => api.get('/reports'),
  getById:          (id)                 => api.get(`/reports/${id}`),
  getByStatus:      (status)             => api.get(`/reports/status/${status}`),
  getByTarget:      (targetType)         => api.get(`/reports/target/${targetType}`),
  getByModerator:   (moderatorId)        => api.get(`/reports/moderator/${moderatorId}`),
  getByUser:        (userId)             => api.get(`/reports/user/${userId}`),
  create:           (data)               => api.post('/reports', data),
  update:           (id, data)           => api.put(`/reports/${id}`, data),
  delete:           (id)                 => api.delete(`/reports/${id}`),
  assignModerator:  (id, moderatorId)    => api.patch(`/reports/${id}/assign`, { moderatorId }),
  updateStatus:     (id, status)         => api.patch(`/reports/${id}/status`, { status }),
};
