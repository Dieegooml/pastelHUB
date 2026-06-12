import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/apiService', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

import { supportService } from '../services/supportService';
import * as apiModule from '../services/apiService';

describe('supportService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('createTicket llama a api.post /support/tickets', async () => {
    const data = { subject: 'Ayuda' };
    apiModule.api.post.mockResolvedValue({ id: 't1' });
    const res = await supportService.createTicket(data);
    expect(apiModule.api.post).toHaveBeenCalledWith('/support/tickets', data);
    expect(res.id).toBe('t1');
  });

  it('getTickets llama a api.get /support/tickets', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await supportService.getTickets();
    expect(apiModule.api.get).toHaveBeenCalledWith('/support/tickets');
  });

  it('getTickets con status llama a api.get con query', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await supportService.getTickets('open');
    expect(apiModule.api.get).toHaveBeenCalledWith('/support/tickets?status=open');
  });

  it('getTicket llama a api.get /support/tickets/:id', async () => {
    apiModule.api.get.mockResolvedValue({ id: 't1' });
    const res = await supportService.getTicket('t1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/support/tickets/t1');
    expect(res.id).toBe('t1');
  });

  it('updateStatus llama a api.patch /support/tickets/:id/status', async () => {
    apiModule.api.patch.mockResolvedValue({ updated: true });
    const res = await supportService.updateStatus('t1', 'closed');
    expect(apiModule.api.patch).toHaveBeenCalledWith('/support/tickets/t1/status', { status: 'closed' });
    expect(res.updated).toBe(true);
  });

  it('assign llama a api.patch /support/tickets/:id/assign', async () => {
    apiModule.api.patch.mockResolvedValue({ assigned: true });
    const res = await supportService.assign('t1');
    expect(apiModule.api.patch).toHaveBeenCalledWith('/support/tickets/t1/assign', {});
    expect(res.assigned).toBe(true);
  });

  it('getMessages llama a api.get /support/tickets/:id/messages', async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    await supportService.getMessages('t1');
    expect(apiModule.api.get).toHaveBeenCalledWith('/support/tickets/t1/messages');
  });

  it('sendMessage llama a api.post /support/tickets/:id/messages', async () => {
    apiModule.api.post.mockResolvedValue({ id: 'm1' });
    const res = await supportService.sendMessage('t1', 'Gracias');
    expect(apiModule.api.post).toHaveBeenCalledWith('/support/tickets/t1/messages', { message: 'Gracias' });
    expect(res.id).toBe('m1');
  });
});
