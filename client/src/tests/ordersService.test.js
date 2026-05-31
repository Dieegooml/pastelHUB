import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/apiService', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

import { ordersService } from '../services/ordersService';
import * as apiModule from '../services/apiService';

describe('ordersService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getAll llama a api.get /orders', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    const res = await ordersService.getAll();
    expect(apiModule.api.get).toHaveBeenCalledWith('/orders');
    expect(res.data).toEqual([]);
  });

  it('getById llama a api.get /orders/:id', async () => {
    apiModule.api.get.mockResolvedValue({ id: 'o1' });
    const res = await ordersService.getById('o1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/orders/o1');
    expect(res.id).toBe('o1');
  });

  it('getByShop llama a api.get /orders/shop/:shopId', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await ordersService.getByShop('s1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/orders/shop/s1');
  });

  it('getSummary llama a api.get con query days', async () => {
    apiModule.api.get.mockResolvedValue({ total: 100 });
    const res = await ordersService.getSummary('s1', 7);
    expect(apiModule.api.get).toHaveBeenCalledWith('/orders/shop/s1/summary?days=7');
    expect(res.total).toBe(100);
  });

  it('getMy llama a api.get /orders/my', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await ordersService.getMy();
    expect(apiModule.api.get).toHaveBeenCalledWith('/orders/my');
  });

  it('getByCustomer llama a api.get /orders/customer/:userId', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await ordersService.getByCustomer('u1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/orders/customer/u1');
  });

  it('getByStatus llama a api.get /orders/status/:status', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await ordersService.getByStatus('pending');
    expect(apiModule.api.get).toHaveBeenCalledWith('/orders/status/pending');
  });

  it('create llama a api.post /orders con datos', async () => {
    const data = { shop_id: 's1', items: [] };
    apiModule.api.post.mockResolvedValue({ id: 'o1' });
    const res = await ordersService.create(data);
    expect(apiModule.api.post).toHaveBeenCalledWith('/orders', data);
    expect(res.id).toBe('o1');
  });

  it('delete llama a api.delete /orders/:id', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    const res = await ordersService.delete('o1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/orders/o1');
    expect(res.deleted).toBe(true);
  });

  it('cancelOrder llama a api.patch /orders/:id/cancel', async () => {
    apiModule.api.patch.mockResolvedValue({ updated: true });
    const res = await ordersService.cancelOrder('o1');
    expect(apiModule.api.patch).toHaveBeenCalledWith('/orders/o1/cancel');
    expect(res.updated).toBe(true);
  });

  it('updateStatus llama a api.patch /orders/:id/status', async () => {
    apiModule.api.patch.mockResolvedValue({ updated: true });
    const res = await ordersService.updateStatus('o1', 'confirmed');
    expect(apiModule.api.patch).toHaveBeenCalledWith('/orders/o1/status', { status: 'confirmed' });
    expect(res.updated).toBe(true);
  });

  it('updatePaymentStatus llama a api.patch /orders/:id/payment-status', async () => {
    apiModule.api.patch.mockResolvedValue({ updated: true });
    const res = await ordersService.updatePaymentStatus('o1', 'paid', 'txn_123');
    expect(apiModule.api.patch).toHaveBeenCalledWith('/orders/o1/payment-status', {
      status: 'paid', transaction_ref: 'txn_123',
    });
    expect(res.updated).toBe(true);
  });
});
