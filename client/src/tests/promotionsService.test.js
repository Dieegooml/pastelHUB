import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/apiService', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

import { promotionsService } from '../services/promotionsService';
import * as apiModule from '../services/apiService';

describe('promotionsService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getAll llama a api.get /promotions', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    const res = await promotionsService.getAll();
    expect(apiModule.api.get).toHaveBeenCalledWith('/promotions');
    expect(res.data).toEqual([]);
  });

  it('getByShopPublic llama a api.get /promotions/shop/:shopId', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await promotionsService.getByShopPublic('s1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/promotions/shop/s1');
  });

  it('getByShopAll llama a api.get /promotions/shop/:shopId/all', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await promotionsService.getByShopAll('s1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/promotions/shop/s1/all');
  });

  it('getById llama a api.get /promotions/:id', async () => {
    apiModule.api.get.mockResolvedValue({ id: 'p1' });
    const res = await promotionsService.getById('p1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/promotions/p1');
    expect(res.id).toBe('p1');
  });

  it('create llama a api.post /promotions con datos', async () => {
    const data = { type: 'discount' };
    apiModule.api.post.mockResolvedValue({ id: 'p1' });
    const res = await promotionsService.create(data);
    expect(apiModule.api.post).toHaveBeenCalledWith('/promotions', data);
    expect(res.id).toBe('p1');
  });

  it('update llama a api.put /promotions/:id con datos', async () => {
    apiModule.api.put.mockResolvedValue({ updated: true });
    const res = await promotionsService.update('p1', { type: 'bogo' });
    expect(apiModule.api.put).toHaveBeenCalledWith('/promotions/p1', { type: 'bogo' });
    expect(res.updated).toBe(true);
  });

  it('toggle llama a api.patch /promotions/:id/toggle', async () => {
    apiModule.api.patch.mockResolvedValue({ active: true });
    const res = await promotionsService.toggle('p1');
    expect(apiModule.api.patch).toHaveBeenCalledWith('/promotions/p1/toggle');
    expect(res.active).toBe(true);
  });

  it('delete llama a api.delete /promotions/:id', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    const res = await promotionsService.delete('p1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/promotions/p1');
    expect(res.deleted).toBe(true);
  });
});
