import { api } from './apiService';

export const supportService = {
  createTicket:     (data)                  => api.post('/support/tickets', data),
  getTickets:       (status)                => api.get('/support/tickets' + (status ? `?status=${status}` : '')),
  getTicket:        (id)                    => api.get(`/support/tickets/${id}`),
  updateStatus:     (id, status)            => api.patch(`/support/tickets/${id}/status`, { status }),
  assign:           (id)                    => api.patch(`/support/tickets/${id}/assign`, {}),
  getMessages:      (id)                    => api.get(`/support/tickets/${id}/messages`),
  sendMessage:      (id, message)           => api.post(`/support/tickets/${id}/messages`, { message }),
};
