import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/apiService', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

import { reportsService } from '../services/reportsService';
import * as apiModule from '../services/apiService';

describe('reportsService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getAll llama a api.get /reports', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    const res = await reportsService.getAll();
    expect(apiModule.api.get).toHaveBeenCalledWith('/reports');
    expect(res.data).toEqual([]);
  });

  it('getById llama a api.get /reports/:id', async () => {
    apiModule.api.get.mockResolvedValue({ id: 'r1' });
    const res = await reportsService.getById('r1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/reports/r1');
    expect(res.id).toBe('r1');
  });

  it('getByStatus llama a api.get /reports/status/:status', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await reportsService.getByStatus('open');
    expect(apiModule.api.get).toHaveBeenCalledWith('/reports/status/open');
  });

  it('getByTarget llama a api.get /reports/target/:targetType', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await reportsService.getByTarget('review');
    expect(apiModule.api.get).toHaveBeenCalledWith('/reports/target/review');
  });

  it('getByModerator llama a api.get /reports/moderator/:moderatorId', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await reportsService.getByModerator('mod-1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/reports/moderator/mod-1');
  });

  it('getByUser llama a api.get /reports/user/:userId', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await reportsService.getByUser('u1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/reports/user/u1');
  });

  it('create llama a api.post /reports con datos', async () => {
    const data = { targetType: 'review', targetId: 'r1' };
    apiModule.api.post.mockResolvedValue({ id: 'r1' });
    const res = await reportsService.create(data);
    expect(apiModule.api.post).toHaveBeenCalledWith('/reports', data);
    expect(res.id).toBe('r1');
  });

  it('update llama a api.put /reports/:id con datos', async () => {
    apiModule.api.put.mockResolvedValue({ updated: true });
    const res = await reportsService.update('r1', { reason: 'Spam' });
    expect(apiModule.api.put).toHaveBeenCalledWith('/reports/r1', { reason: 'Spam' });
    expect(res.updated).toBe(true);
  });

  it('delete llama a api.delete /reports/:id', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    const res = await reportsService.delete('r1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/reports/r1');
    expect(res.deleted).toBe(true);
  });

  it('assignModerator llama a api.patch /reports/:id/assign', async () => {
    apiModule.api.patch.mockResolvedValue({ updated: true });
    const res = await reportsService.assignModerator('r1', 'mod-1');
    expect(apiModule.api.patch).toHaveBeenCalledWith('/reports/r1/assign', { moderatorId: 'mod-1' });
    expect(res.updated).toBe(true);
  });

  it('updateStatus llama a api.patch /reports/:id/status', async () => {
    apiModule.api.patch.mockResolvedValue({ updated: true });
    const res = await reportsService.updateStatus('r1', 'resolved');
    expect(apiModule.api.patch).toHaveBeenCalledWith('/reports/r1/status', { status: 'resolved' });
    expect(res.updated).toBe(true);
  });
});
