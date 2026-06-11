import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/apiService', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

import { paymentsService } from '../services/paymentsService';
import * as apiModule from '../services/apiService';

describe('paymentsService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getAll llama a api.get /payments', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    const res = await paymentsService.getAll();
    expect(apiModule.api.get).toHaveBeenCalledWith('/payments');
    expect(res.data).toEqual([]);
  });

  it('getById llama a api.get /payments/:id', async () => {
    apiModule.api.get.mockResolvedValue({ id: 'pay1', paymentStatus: 'completed' });
    const res = await paymentsService.getById('pay1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/payments/pay1');
    expect(res.paymentStatus).toBe('completed');
  });

  it('getByOrder llama a api.get /payments/order/:orderId', async () => {
    apiModule.api.get.mockResolvedValue({ id: 'pay1' });
    const res = await paymentsService.getByOrder('o1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/payments/order/o1');
    expect(res.id).toBe('pay1');
  });

  it('create llama a api.post /payments con datos', async () => {
    const data = { order_id: 'o1', method: 'card', amount: 50 };
    apiModule.api.post.mockResolvedValue({ id: 'pay1' });
    const res = await paymentsService.create(data);
    expect(apiModule.api.post).toHaveBeenCalledWith('/payments', data);
    expect(res.id).toBe('pay1');
  });

  it('update llama a api.put /payments/:id con datos', async () => {
    apiModule.api.put.mockResolvedValue({ updated: true });
    const res = await paymentsService.update('pay1', { method: 'cash' });
    expect(apiModule.api.put).toHaveBeenCalledWith('/payments/pay1', { method: 'cash' });
    expect(res.updated).toBe(true);
  });

  it('delete llama a api.delete /payments/:id', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    const res = await paymentsService.delete('pay1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/payments/pay1');
    expect(res.deleted).toBe(true);
  });

  it('updateStatus llama a api.patch /payments/:id/status', async () => {
    apiModule.api.patch.mockResolvedValue({ updated: true });
    const res = await paymentsService.updateStatus('pay1', 'completed', 'txn_001');
    expect(apiModule.api.patch).toHaveBeenCalledWith('/payments/pay1/status', {
      paymentStatus: 'completed', transaction_ref: 'txn_001',
    });
    expect(res.updated).toBe(true);
  });

  it('processGateway llama a api.post /payments/gateway', async () => {
    const data = { orderId: 'o1', amount: 50, paymentMethod: 'card' };
    apiModule.api.post.mockResolvedValue({ success: true, transactionRef: 'ref_001' });
    const res = await paymentsService.processGateway(data);
    expect(apiModule.api.post).toHaveBeenCalledWith('/payments/gateway', data);
    expect(res.success).toBe(true);
  });
});
