import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/auth', () => {
  const fn = vi.fn();
  return {
    signInWithEmailAndPassword: fn,
    signOut: fn,
    sendPasswordResetEmail: fn,
    getAuth: fn,
  };
});

vi.mock('../config/firebase', () => ({
  auth: {},
}));

vi.mock('../services/apiService', () => ({
  api: { post: vi.fn(), get: vi.fn() },
}));

import { authService } from '../services/authService';
import * as apiModule from '../services/apiService';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sync', () => {
    it('llama a api.post con /auth/sync', async () => {
      apiModule.api.post.mockResolvedValue({ data: 'ok' });
      const result = await authService.sync();
      expect(apiModule.api.post).toHaveBeenCalledWith('/auth/sync');
      expect(result.data).toBe('ok');
    });
  });

  describe('getMe', () => {
    it('llama a api.get con /auth/me', async () => {
      apiModule.api.get.mockResolvedValue({ uid: 'u1' });
      const result = await authService.getMe();
      expect(apiModule.api.get).toHaveBeenCalledWith('/auth/me');
      expect(result.uid).toBe('u1');
    });
  });

  describe('assignRole', () => {
    it('llama a api.post con uid y roles', async () => {
      apiModule.api.post.mockResolvedValue({ success: true });
      const result = await authService.assignRole('u1', ['admin']);
      expect(apiModule.api.post).toHaveBeenCalledWith('/auth/assign-role', { uid: 'u1', roles: ['admin'] });
      expect(result.success).toBe(true);
    });
  });
});
