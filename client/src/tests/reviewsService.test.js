import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/apiService', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

import { reviewsService } from '../services/reviewsService';
import * as apiModule from '../services/apiService';

describe('reviewsService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getAll llama a api.get /reviews', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    const res = await reviewsService.getAll();
    expect(apiModule.api.get).toHaveBeenCalledWith('/reviews');
    expect(res.data).toEqual([]);
  });

  it('getById llama a api.get /reviews/:id', async () => {
    apiModule.api.get.mockResolvedValue({ id: 'r1', rating: 5 });
    const res = await reviewsService.getById('r1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/reviews/r1');
    expect(res.rating).toBe(5);
  });

  it('getByShop llama a api.get /reviews/shop/:shopId', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await reviewsService.getByShop('s1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/reviews/shop/s1');
  });

  it('getByCustomer llama a api.get /reviews/customer/:customerId', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await reviewsService.getByCustomer('c1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/reviews/customer/c1');
  });

  it('getByStatus llama a api.get /reviews/status/:status', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await reviewsService.getByStatus('approved');
    expect(apiModule.api.get).toHaveBeenCalledWith('/reviews/status/approved');
  });

  it('getByOrder llama a api.get /reviews/by-order/:orderId', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await reviewsService.getByOrder('o1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/reviews/by-order/o1');
  });

  it('create llama a api.post /reviews con datos', async () => {
    const data = { order_id: 'o1', rating: 5, comment: 'Excelente' };
    apiModule.api.post.mockResolvedValue({ id: 'r1' });
    const res = await reviewsService.create(data);
    expect(apiModule.api.post).toHaveBeenCalledWith('/reviews', data);
    expect(res.id).toBe('r1');
  });

  it('update llama a api.put /reviews/:id con datos', async () => {
    apiModule.api.put.mockResolvedValue({ updated: true });
    const res = await reviewsService.update('r1', { comment: 'Actualizado' });
    expect(apiModule.api.put).toHaveBeenCalledWith('/reviews/r1', { comment: 'Actualizado' });
    expect(res.updated).toBe(true);
  });

  it('delete llama a api.delete /reviews/:id', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    const res = await reviewsService.delete('r1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/reviews/r1');
    expect(res.deleted).toBe(true);
  });

  it('moderate llama a api.patch /reviews/:id/status', async () => {
    apiModule.api.patch.mockResolvedValue({ updated: true });
    const res = await reviewsService.moderate('r1', 'approved');
    expect(apiModule.api.patch).toHaveBeenCalledWith('/reviews/r1/status', { status: 'approved' });
    expect(res.updated).toBe(true);
  });

  it('reply llama a api.patch /reviews/:id/reply', async () => {
    apiModule.api.patch.mockResolvedValue({ updated: true });
    const res = await reviewsService.reply('r1', 'Gracias por tu compra');
    expect(apiModule.api.patch).toHaveBeenCalledWith('/reviews/r1/reply', { ownerReply: 'Gracias por tu compra' });
    expect(res.updated).toBe(true);
  });
});
