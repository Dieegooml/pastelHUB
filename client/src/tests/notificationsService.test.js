import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/apiService', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

import { notificationsService } from '../services/notificationsService';
import * as apiModule from '../services/apiService';

describe('notificationsService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getAll llama a api.get /notifications', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    const res = await notificationsService.getAll();
    expect(apiModule.api.get).toHaveBeenCalledWith('/notifications');
    expect(res.data).toEqual([]);
  });

  it('getByUser llama a api.get /notifications/user/:userId', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await notificationsService.getByUser('u1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/notifications/user/u1');
  });

  it('getUnreadByUser llama a api.get /notifications/user/:userId/unread', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await notificationsService.getUnreadByUser('u1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/notifications/user/u1/unread');
  });

  it('getUnreadCount llama a api.get /notifications/user/:userId/unread/count', async () => {
    apiModule.api.get.mockResolvedValue({ count: 3 });
    const res = await notificationsService.getUnreadCount('u1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/notifications/user/u1/unread/count');
    expect(res.count).toBe(3);
  });

  it('getById llama a api.get /notifications/:id', async () => {
    apiModule.api.get.mockResolvedValue({ id: 'n1', title: 'Notificación' });
    const res = await notificationsService.getById('n1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/notifications/n1');
    expect(res.title).toBe('Notificación');
  });

  it('create llama a api.post /notifications con datos', async () => {
    const data = { user_id: 'u1', title: 'Test', message: 'Mensaje' };
    apiModule.api.post.mockResolvedValue({ id: 'n1' });
    const res = await notificationsService.create(data);
    expect(apiModule.api.post).toHaveBeenCalledWith('/notifications', data);
    expect(res.id).toBe('n1');
  });

  it('createBulk llama a api.post /notifications/bulk con datos', async () => {
    const data = { userIds: ['u1', 'u2'], title: 'Bulk', message: 'Para todos' };
    apiModule.api.post.mockResolvedValue({ created: 2 });
    const res = await notificationsService.createBulk(data);
    expect(apiModule.api.post).toHaveBeenCalledWith('/notifications/bulk', data);
    expect(res.created).toBe(2);
  });

  it('delete llama a api.delete /notifications/:id', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    const res = await notificationsService.delete('n1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/notifications/n1');
    expect(res.deleted).toBe(true);
  });

  it('deleteByUser llama a api.delete /notifications/user/:userId', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    const res = await notificationsService.deleteByUser('u1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/notifications/user/u1');
    expect(res.deleted).toBe(true);
  });

  it('markAsRead llama a api.patch /notifications/:id/read', async () => {
    apiModule.api.patch.mockResolvedValue({ updated: true });
    const res = await notificationsService.markAsRead('n1');
    expect(apiModule.api.patch).toHaveBeenCalledWith('/notifications/n1/read');
    expect(res.updated).toBe(true);
  });

  it('markAllAsRead llama a api.patch /notifications/user/:userId/read-all', async () => {
    apiModule.api.patch.mockResolvedValue({ updated: true });
    const res = await notificationsService.markAllAsRead('u1');
    expect(apiModule.api.patch).toHaveBeenCalledWith('/notifications/user/u1/read-all');
    expect(res.updated).toBe(true);
  });
});
