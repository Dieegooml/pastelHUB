import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/apiService', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

vi.mock('../config/firebase', () => ({
  auth: { currentUser: { getIdToken: vi.fn().mockResolvedValue('mock-token') } },
}));

import { invoicesService } from '../services/invoicesService';
import * as apiModule from '../services/apiService';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockResponse(ok, status, body) {
  const text = JSON.stringify(body);
  return { ok, status, text: () => Promise.resolve(text), json: () => Promise.resolve(body), blob: () => Promise.resolve(new Blob(['pdf'])) };
}

describe('invoicesService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getAll llama a api.get /invoices', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    const res = await invoicesService.getAll();
    expect(apiModule.api.get).toHaveBeenCalledWith('/invoices');
    expect(res.data).toEqual([]);
  });

  it('getById llama a api.get /invoices/:id', async () => {
    apiModule.api.get.mockResolvedValue({ id: 'i1' });
    const res = await invoicesService.getById('i1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/invoices/i1');
    expect(res.id).toBe('i1');
  });

  it('getByOrder llama a api.get /invoices/order/:orderId', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await invoicesService.getByOrder('o1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/invoices/order/o1');
  });

  it('getByShop llama a api.get /invoices/shop/:shopId', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await invoicesService.getByShop('s1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/invoices/shop/s1');
  });

  it('generate llama a api.post /invoices', async () => {
    apiModule.api.post.mockResolvedValue({ id: 'i1' });
    const res = await invoicesService.generate('o1');
    expect(apiModule.api.post).toHaveBeenCalledWith('/invoices', { orderId: 'o1' });
    expect(res.id).toBe('i1');
  });

  it('updateStatus llama a api.patch /invoices/:id/status', async () => {
    apiModule.api.patch.mockResolvedValue({ updated: true });
    const res = await invoicesService.updateStatus('i1', 'paid');
    expect(apiModule.api.patch).toHaveBeenCalledWith('/invoices/i1/status', { status: 'paid' });
    expect(res.updated).toBe(true);
  });

  it('downloadPdf descarga y hace click en el enlace', async () => {
    mockFetch.mockResolvedValue(mockResponse(true, 200, {}));
    const clickSpy = vi.fn();
    const appendSpy = vi.fn();
    const removeSpy = vi.fn();
    const revokeSpy = vi.fn();
    document.createElement = vi.fn(() => ({
      href: '',
      download: '',
      click: clickSpy,
    }));
    document.body.appendChild = appendSpy;
    document.body.removeChild = removeSpy;
    URL.createObjectURL = vi.fn(() => 'blob:url');
    URL.revokeObjectURL = revokeSpy;

    await invoicesService.downloadPdf('i1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/invoices/i1/pdf'),
      expect.objectContaining({ headers: { Authorization: 'Bearer mock-token' } })
    );
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith('blob:url');
  });

  it('downloadPdf lanza error si fetch falla', async () => {
    mockFetch.mockResolvedValue(mockResponse(false, 404, { error: 'Not found' }));
    await expect(invoicesService.downloadPdf('i1')).rejects.toThrow('Not found');
  });
});
