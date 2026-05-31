import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/apiService', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

import { shopsService } from '../services/shopsService';
import * as apiModule from '../services/apiService';

describe('shopsService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getAll llama a api.get /shops', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    const res = await shopsService.getAll();
    expect(apiModule.api.get).toHaveBeenCalledWith('/shops');
    expect(res.data).toEqual([]);
  });

  it('getById llama a api.get /shops/:id', async () => {
    apiModule.api.get.mockResolvedValue({ id: 's1', name: 'Shop' });
    const res = await shopsService.getById('s1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/shops/s1');
    expect(res.name).toBe('Shop');
  });

  it('create llama a api.post /shops con datos', async () => {
    const data = { name: 'Nueva', owner_id: 'u1' };
    apiModule.api.post.mockResolvedValue({ id: 's1' });
    const res = await shopsService.create(data);
    expect(apiModule.api.post).toHaveBeenCalledWith('/shops', data);
    expect(res.id).toBe('s1');
  });

  it('update llama a api.put /shops/:id con datos', async () => {
    apiModule.api.put.mockResolvedValue({ updated: true });
    const res = await shopsService.update('s1', { name: 'Editado' });
    expect(apiModule.api.put).toHaveBeenCalledWith('/shops/s1', { name: 'Editado' });
    expect(res.updated).toBe(true);
  });

  it('delete llama a api.delete /shops/:id', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    const res = await shopsService.delete('s1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/shops/s1');
    expect(res.deleted).toBe(true);
  });

  it('updateStatus llama a api.patch /shops/:id/status', async () => {
    apiModule.api.patch.mockResolvedValue({ updated: true });
    const res = await shopsService.updateStatus('s1', 'active');
    expect(apiModule.api.patch).toHaveBeenCalledWith('/shops/s1/status', { status: 'active' });
    expect(res.updated).toBe(true);
  });

  it('getSchedules llama a api.get /shops/:id/schedules', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await shopsService.getSchedules('s1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/shops/s1/schedules');
  });

  it('addSchedule llama a api.post /shops/:id/schedules', async () => {
    const data = { day: 'monday', open: '09:00', close: '18:00' };
    apiModule.api.post.mockResolvedValue({ id: 'sch1' });
    await shopsService.addSchedule('s1', data);
    expect(apiModule.api.post).toHaveBeenCalledWith('/shops/s1/schedules', data);
  });

  it('updateSchedule llama a api.put /shops/:id/schedules/:day', async () => {
    const data = { open: '10:00' };
    apiModule.api.put.mockResolvedValue({ updated: true });
    await shopsService.updateSchedule('s1', 'monday', data);
    expect(apiModule.api.put).toHaveBeenCalledWith('/shops/s1/schedules/monday', data);
  });

  it('deleteSchedule llama a api.delete /shops/:id/schedules/:day', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    await shopsService.deleteSchedule('s1', 'monday');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/shops/s1/schedules/monday');
  });

  it('getCategories llama a api.get /shops/:id/categories', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await shopsService.getCategories('s1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/shops/s1/categories');
  });

  it('addCategory llama a api.post /shops/:id/categories', async () => {
    apiModule.api.post.mockResolvedValue({ id: 'cat1' });
    await shopsService.addCategory('s1', { name: 'Tortas' });
    expect(apiModule.api.post).toHaveBeenCalledWith('/shops/s1/categories', { name: 'Tortas' });
  });

  it('updateCategory llama a api.put /shops/:id/categories/:catId', async () => {
    apiModule.api.put.mockResolvedValue({ updated: true });
    await shopsService.updateCategory('s1', 'cat1', { name: 'Pasteles' });
    expect(apiModule.api.put).toHaveBeenCalledWith('/shops/s1/categories/cat1', { name: 'Pasteles' });
  });

  it('deleteCategory llama a api.delete /shops/:id/categories/:catId', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    await shopsService.deleteCategory('s1', 'cat1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/shops/s1/categories/cat1');
  });
});
