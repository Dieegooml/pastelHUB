import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/firebase', () => ({
  auth: { currentUser: { getIdToken: vi.fn().mockResolvedValue('mock-token') } },
}));

vi.mock('firebase/auth', () => ({
  signOut: vi.fn(),
}));

import { api } from '../services/apiService';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockResponse(ok, status, body) {
  return { ok, status, json: () => Promise.resolve(body) };
}

describe('apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET sends Authorization header and returns data on success', async () => {
    mockFetch.mockResolvedValue(mockResponse(true, 200, { data: 'ok' }));
    const result = await api.get('/test');
    expect(result).toEqual({ data: 'ok' });
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer mock-token');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('POST sends method and body correctly', async () => {
    mockFetch.mockResolvedValue(mockResponse(true, 201, { id: 'new' }));
    const result = await api.post('/create', { name: 'foo' });
    expect(result).toEqual({ id: 'new' });
    const opts = mockFetch.mock.calls[0][1];
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ name: 'foo' });
  });

  it('PUT sends method and body correctly', async () => {
    mockFetch.mockResolvedValue(mockResponse(true, 200, { updated: true }));
    const result = await api.put('/update/1', { name: 'bar' });
    expect(result).toEqual({ updated: true });
    expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
  });

  it('DELETE sends method correctly', async () => {
    mockFetch.mockResolvedValue(mockResponse(true, 200, { deleted: true }));
    const result = await api.delete('/del/1');
    expect(result).toEqual({ deleted: true });
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
  });

  it('PATCH sends method and body correctly', async () => {
    mockFetch.mockResolvedValue(mockResponse(true, 200, { patched: true }));
    const result = await api.patch('/patch/1', { field: 'val' });
    expect(result).toEqual({ patched: true });
    expect(mockFetch.mock.calls[0][1].method).toBe('PATCH');
  });

  it('throws error with message from response body on non-401 failure', async () => {
    mockFetch.mockResolvedValue(mockResponse(false, 400, { error: 'Bad request' }));
    await expect(api.get('/fail')).rejects.toThrow('Bad request');
  });

  it('retries with fresh token when 401 and currentUser exists', async () => {
    const { auth } = await import('../config/firebase');
    const mockUser = {
      getIdToken: vi.fn()
        .mockResolvedValueOnce('expired-token')
        .mockResolvedValueOnce('fresh-token'),
    };
    auth.currentUser = mockUser;

    mockFetch
      .mockResolvedValueOnce(mockResponse(false, 401, { error: 'Unauthorized' }))
      .mockResolvedValueOnce(mockResponse(true, 200, { data: 'retried' }));

    const result = await api.get('/retry');
    expect(result).toEqual({ data: 'retried' });
    expect(mockUser.getIdToken).toHaveBeenCalledTimes(2);
  });

  it('throws on 401 when no currentUser', async () => {
    const { auth } = await import('../config/firebase');
    auth.currentUser = null;

    mockFetch.mockResolvedValue(mockResponse(false, 401, { error: 'Unauthorized' }));

    await expect(api.get('/fail-401')).rejects.toThrow('Unauthorized');
  });

  it('throws on 401 retry failure', async () => {
    const { auth } = await import('../config/firebase');
    const mockUser = { getIdToken: vi.fn().mockResolvedValue('fresh-token') };
    auth.currentUser = mockUser;

    mockFetch
      .mockResolvedValueOnce(mockResponse(false, 401, { error: 'Unauthorized' }))
      .mockResolvedValueOnce(mockResponse(false, 401, { error: 'Still unauthorized' }));

    await expect(api.get('/fail-twice')).rejects.toThrow('Still unauthorized');
  });
});
