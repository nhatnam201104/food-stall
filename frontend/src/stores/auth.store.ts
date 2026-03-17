import { create } from 'zustand';
import { authService } from '../services/auth.service';
import type { AuthSessionUser, LoginPayload, MerchantRegisterPayload, UpdateProfilePayload } from '../types/auth.types';
import { clearAuthSession, getAuthSession, saveAuthSession } from '../utils/auth.utils';

interface AuthStore {
  user: AuthSessionUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrateFromStorage: () => void;
  login: (payload: LoginPayload) => Promise<AuthSessionUser | null>;
  registerMerchant: (payload: MerchantRegisterPayload) => Promise<boolean>;
  logout: () => void;
  updateProfile: (payload: UpdateProfilePayload) => Promise<boolean>;
  clearError: () => void;
}

const setSession = (user: AuthSessionUser, token: string): void => {
  saveAuthSession({ user, token });
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
};

const clearSession = (): void => {
  clearAuthSession();
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,
  error: null,

  hydrateFromStorage: () => {
    const session = getAuthSession();
    if (!session) {
      set({ isHydrated: true });
      return;
    }
    set({ user: session.user, token: session.token, isAuthenticated: true, isHydrated: true });
  },

  login: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.login(payload);
      const { token, user } = res.data.data!;
      setSession(user, token);
      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      return user;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = axiosErr.response?.data?.message || 'Login failed. Please try again.';
      set({ isLoading: false, error: message });
      return null;
    }
  },

  registerMerchant: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await authService.register(payload);
      set({ isLoading: false, error: null });
      return true;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = axiosErr.response?.data?.message || 'Registration failed. Please try again.';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: async () => {
    try { await authService.logout(); } catch { /* silent */ }
    clearSession();
    set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
  },

  updateProfile: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.updateProfile(payload);
      const updatedUser = res.data.data!;
      const token = get().token!;
      setSession(updatedUser, token);
      set({ user: updatedUser, isLoading: false });
      return true;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = axiosErr.response?.data?.message || 'Update failed. Please try again.';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
