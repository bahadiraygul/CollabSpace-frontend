import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth-store';

const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  roles: ['USER'],
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('auth-store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  describe('initial state', () => {
    it('should have null user by default', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it('should have null tokens by default', () => {
      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });

    it('should not be authenticated by default', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setAuth', () => {
    it('should set user, tokens and mark as authenticated', () => {
      const { setAuth } = useAuthStore.getState();

      setAuth(mockUser, 'access-token-123', 'refresh-token-456');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('access-token-123');
      expect(state.refreshToken).toBe('refresh-token-456');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('setTokens', () => {
    it('should update tokens without changing user', () => {
      const { setAuth, setTokens } = useAuthStore.getState();

      // First set initial auth
      setAuth(mockUser, 'old-access', 'old-refresh');

      // Then update tokens
      setTokens('new-access', 'new-refresh');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('new-access');
      expect(state.refreshToken).toBe('new-refresh');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear all auth data', () => {
      const { setAuth, logout } = useAuthStore.getState();

      // First set auth
      setAuth(mockUser, 'access-token', 'refresh-token');

      // Then logout
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
