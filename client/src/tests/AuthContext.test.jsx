import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
}));

vi.mock('../config/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
      getIdTokenResult: vi.fn().mockResolvedValue({ claims: { roles: ['customer'] } }),
    },
  },
}));

import { AuthProvider, useAuth } from '../context/AuthContext';

function TestConsumer() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <div data-testid="no-user">no-user</div>;
  return <div data-testid="user-info">{`uid:${user.uid} roles:${user.roles.join(',')}`}</div>;
}

function RefreshConsumer() {
  const { user, loading, refreshUser } = useAuth();
  if (loading) return null;
  return (
    <div>
      <div data-testid="user-info">{`uid:${user.uid} roles:${user.roles.join(',')}`}</div>
      <button data-testid="refresh-btn" onClick={refreshUser}>refresh</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user when onAuthStateChanged returns a user', async () => {
    const { onAuthStateChanged } = await import('firebase/auth');
    const mockUser = {
      uid: 'u1',
      email: 'a@b.com',
      displayName: 'Test',
      photoURL: null,
      getIdTokenResult: vi.fn().mockResolvedValue({ claims: { roles: ['admin'] } }),
    };
    onAuthStateChanged.mockImplementation((_auth, cb) => { cb(mockUser); return vi.fn(); });

    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user-info')).toHaveTextContent('uid:u1 roles:admin'));
  });

  it('sets user to null when onAuthStateChanged returns null', async () => {
    const { onAuthStateChanged } = await import('firebase/auth');
    onAuthStateChanged.mockImplementation((_auth, cb) => { cb(null); return vi.fn(); });

    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('no-user')).toBeInTheDocument());
  });

  it('updates user roles after refreshUser is called', async () => {
    const { onAuthStateChanged } = await import('firebase/auth');
    const { auth } = await import('../config/firebase');

    const mockUser = {
      uid: 'u1',
      email: 'a@b.com',
      displayName: 'Test',
      photoURL: null,
      getIdTokenResult: vi.fn().mockResolvedValue({ claims: { roles: ['customer'] } }),
    };
    onAuthStateChanged.mockImplementation((_auth, cb) => { cb(mockUser); return vi.fn(); });

    auth.currentUser = {
      uid: 'u1',
      email: 'a@b.com',
      displayName: 'Test',
      photoURL: null,
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
      getIdTokenResult: vi.fn().mockResolvedValue({ claims: { roles: ['customer'] } }),
    };

    render(<AuthProvider><RefreshConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user-info')).toHaveTextContent('uid:u1 roles:customer'));

    auth.currentUser.getIdTokenResult.mockResolvedValue({ claims: { roles: ['admin', 'owner'] } });
    fireEvent.click(screen.getByTestId('refresh-btn'));
    await waitFor(() => expect(screen.getByTestId('user-info')).toHaveTextContent('uid:u1 roles:admin,owner'));
  });
});
