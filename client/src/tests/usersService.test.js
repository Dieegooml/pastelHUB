import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/apiService', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

import { usersService } from '../services/usersService';
import * as apiModule from '../services/apiService';

describe('usersService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getAll llama a api.get /users', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    const res = await usersService.getAll();
    expect(apiModule.api.get).toHaveBeenCalledWith('/users');
    expect(res.data).toEqual([]);
  });

  it('getById llama a api.get /users/:id', async () => {
    apiModule.api.get.mockResolvedValue({ id: 'u1' });
    const res = await usersService.getById('u1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/users/u1');
    expect(res.id).toBe('u1');
  });

  it('create llama a api.post /users con datos', async () => {
    const data = { email: 'test@test.com' };
    apiModule.api.post.mockResolvedValue({ id: 'u1' });
    const res = await usersService.create(data);
    expect(apiModule.api.post).toHaveBeenCalledWith('/users', data);
    expect(res.id).toBe('u1');
  });

  it('update llama a api.put /users/:id con datos', async () => {
    apiModule.api.put.mockResolvedValue({ updated: true });
    const res = await usersService.update('u1', { name: 'New' });
    expect(apiModule.api.put).toHaveBeenCalledWith('/users/u1', { name: 'New' });
    expect(res.updated).toBe(true);
  });

  it('delete llama a api.delete /users/:id', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    const res = await usersService.delete('u1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/users/u1');
    expect(res.deleted).toBe(true);
  });

  it('updateStatus llama a api.patch /users/:id/status', async () => {
    apiModule.api.patch.mockResolvedValue({ updated: true });
    const res = await usersService.updateStatus('u1', true);
    expect(apiModule.api.patch).toHaveBeenCalledWith('/users/u1/status', { isActive: true });
    expect(res.updated).toBe(true);
  });

  it('getAddresses llama a api.get /users/:id/addresses', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await usersService.getAddresses('u1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/users/u1/addresses');
  });

  it('addAddress llama a api.post /users/:id/addresses', async () => {
    const addr = { street: 'Main' };
    apiModule.api.post.mockResolvedValue({ id: 'a1' });
    await usersService.addAddress('u1', addr);
    expect(apiModule.api.post).toHaveBeenCalledWith('/users/u1/addresses', addr);
  });

  it('updateAddress llama a api.put /users/:id/addresses/:addressId', async () => {
    apiModule.api.put.mockResolvedValue({ updated: true });
    await usersService.updateAddress('u1', 'a1', { street: 'New' });
    expect(apiModule.api.put).toHaveBeenCalledWith('/users/u1/addresses/a1', { street: 'New' });
  });

  it('deleteAddress llama a api.delete /users/:id/addresses/:addressId', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    await usersService.deleteAddress('u1', 'a1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/users/u1/addresses/a1');
  });
});
