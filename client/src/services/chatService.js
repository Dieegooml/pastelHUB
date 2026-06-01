import { api } from './apiService';

export const chatService = {
  createSession: (context) => api.post('/chat/sessions', { context }),
  getSessions:   (status) => api.get('/chat/sessions' + (status ? `?status=${status}` : '')),
  getSession:    (id) => api.get(`/chat/sessions/${id}`),
  sendMessage:   (id, message) => api.post(`/chat/sessions/${id}/messages`, { message }),
  deleteSession: (id) => api.delete(`/chat/sessions/${id}`),
};
