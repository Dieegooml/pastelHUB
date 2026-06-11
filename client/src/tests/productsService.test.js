import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/apiService', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

import { productsService } from '../services/productsService';
import * as apiModule from '../services/apiService';

describe('productsService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getAll llama a api.get /products', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    const res = await productsService.getAll();
    expect(apiModule.api.get).toHaveBeenCalledWith('/products');
    expect(res.data).toEqual([]);
  });

  it('getByShop llama a api.get /products/shop/:shopId', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await productsService.getByShop('s1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/products/shop/s1');
  });

  it('getById llama a api.get /products/:id', async () => {
    apiModule.api.get.mockResolvedValue({ id: 'p1', name: 'Pastel' });
    const res = await productsService.getById('p1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/products/p1');
    expect(res.name).toBe('Pastel');
  });

  it('create llama a api.post /products con datos', async () => {
    const data = { name: 'Nuevo pastel', price: 30, shop_id: 's1' };
    apiModule.api.post.mockResolvedValue({ id: 'p1' });
    const res = await productsService.create(data);
    expect(apiModule.api.post).toHaveBeenCalledWith('/products', data);
    expect(res.id).toBe('p1');
  });

  it('update llama a api.put /products/:id con datos', async () => {
    apiModule.api.put.mockResolvedValue({ updated: true });
    const res = await productsService.update('p1', { price: 35 });
    expect(apiModule.api.put).toHaveBeenCalledWith('/products/p1', { price: 35 });
    expect(res.updated).toBe(true);
  });

  it('delete llama a api.delete /products/:id', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    const res = await productsService.delete('p1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/products/p1');
    expect(res.deleted).toBe(true);
  });

  it('updateAvailability llama a api.patch /products/:id/availability', async () => {
    apiModule.api.patch.mockResolvedValue({ updated: true });
    const res = await productsService.updateAvailability('p1', false);
    expect(apiModule.api.patch).toHaveBeenCalledWith('/products/p1/availability', { is_available: false });
    expect(res.updated).toBe(true);
  });

  it('getVariants llama a api.get /products/:id/variants', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await productsService.getVariants('p1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/products/p1/variants');
  });

  it('addVariant llama a api.post /products/:id/variants', async () => {
    const data = { name: 'Grande', price_extra: 5 };
    apiModule.api.post.mockResolvedValue({ id: 'v1' });
    await productsService.addVariant('p1', data);
    expect(apiModule.api.post).toHaveBeenCalledWith('/products/p1/variants', data);
  });

  it('updateVariant llama a api.put /products/:id/variants/:variantId', async () => {
    apiModule.api.put.mockResolvedValue({ updated: true });
    await productsService.updateVariant('p1', 'v1', { price_extra: 8 });
    expect(apiModule.api.put).toHaveBeenCalledWith('/products/p1/variants/v1', { price_extra: 8 });
  });

  it('deleteVariant llama a api.delete /products/:id/variants/:variantId', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    await productsService.deleteVariant('p1', 'v1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/products/p1/variants/v1');
  });
});
