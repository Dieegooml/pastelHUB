import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/apiService', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

import { chatService } from '../services/chatService';
import * as apiModule from '../services/apiService';

describe('chatService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('createSession llama a api.post /chat/sessions', async () => {
    apiModule.api.post.mockResolvedValue({ id: 's1' });
    const res = await chatService.createSession('contexto');
    expect(apiModule.api.post).toHaveBeenCalledWith('/chat/sessions', { context: 'contexto' });
    expect(res.id).toBe('s1');
  });

  it('getSessions llama a api.get /chat/sessions', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await chatService.getSessions();
    expect(apiModule.api.get).toHaveBeenCalledWith('/chat/sessions');
  });

  it('getSessions con status llama a api.get con query', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await chatService.getSessions('open');
    expect(apiModule.api.get).toHaveBeenCalledWith('/chat/sessions?status=open');
  });

  it('getSession llama a api.get /chat/sessions/:id', async () => {
    apiModule.api.get.mockResolvedValue({ id: 's1' });
    const res = await chatService.getSession('s1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/chat/sessions/s1');
    expect(res.id).toBe('s1');
  });

  it('sendMessage llama a api.post /chat/sessions/:id/messages', async () => {
    apiModule.api.post.mockResolvedValue({ id: 'm1' });
    const res = await chatService.sendMessage('s1', 'hola');
    expect(apiModule.api.post).toHaveBeenCalledWith('/chat/sessions/s1/messages', { message: 'hola' });
    expect(res.id).toBe('m1');
  });

  it('deleteSession llama a api.delete /chat/sessions/:id', async () => {
    apiModule.api.delete.mockResolvedValue({ deleted: true });
    const res = await chatService.deleteSession('s1');
    expect(apiModule.api.delete).toHaveBeenCalledWith('/chat/sessions/s1');
    expect(res.deleted).toBe(true);
  });
});
