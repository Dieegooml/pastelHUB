import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/apiService', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

import { customersService } from '../services/customersService';
import * as apiModule from '../services/apiService';

describe('customersService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getAll llama a api.get /customers', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    const res = await customersService.getAll();
    expect(apiModule.api.get).toHaveBeenCalledWith('/customers');
    expect(res.data).toEqual([]);
  });

  it('getById llama a api.get /customers/:id', async () => {
    apiModule.api.get.mockResolvedValue({ id: 'c1' });
    const res = await customersService.getById('c1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/customers/c1');
    expect(res.id).toBe('c1');
  });

  it('create llama a api.post /customers con datos', async () => {
    const data = { fullName: 'Test' };
    apiModule.api.post.mockResolvedValue({ id: 'c1' });
    const res = await customersService.create(data);
    expect(apiModule.api.post).toHaveBeenCalledWith('/customers', data);
    expect(res.id).toBe('c1');
  });

  it('delete llama a api.delete /customers/:id', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    const res = await customersService.delete('c1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/customers/c1');
    expect(res.deleted).toBe(true);
  });

  it('getAddresses llama a api.get /customers/:id/addresses', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await customersService.getAddresses('c1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/customers/c1/addresses');
  });

  it('addAddress llama a api.post /customers/:id/addresses', async () => {
    const addr = { street: 'Main' };
    apiModule.api.post.mockResolvedValue({ id: 'a1' });
    await customersService.addAddress('c1', addr);
    expect(apiModule.api.post).toHaveBeenCalledWith('/customers/c1/addresses', addr);
  });

  it('updateAddress llama a api.put /customers/:id/addresses/:addressId', async () => {
    apiModule.api.put.mockResolvedValue({ updated: true });
    await customersService.updateAddress('c1', 'a1', { street: 'New' });
    expect(apiModule.api.put).toHaveBeenCalledWith('/customers/c1/addresses/a1', { street: 'New' });
  });

  it('deleteAddress llama a api.delete /customers/:id/addresses/:addressId', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    await customersService.deleteAddress('c1', 'a1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/customers/c1/addresses/a1');
  });
});
