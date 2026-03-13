import { create } from 'zustand';
import { mockAuthService } from '../mock/auth.mock.service';
import type { AuthSessionUser, LoginPayload, MerchantRegisterPayload } from '../types';
import { clearAuthSession, getAuthSession, saveAuthSession } from '../utils/auth.utils';

interface AuthStore {
  user: AuthSessionUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrateFromStorage: () => void;
  login: (payload: LoginPayload) => Promise<AuthSessionUser | null>;
  registerMerchant: (payload: MerchantRegisterPayload) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const setSession = (user: AuthSessionUser, token: string): void => {
  saveAuthSession({ user, token });
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  hydrateFromStorage: () => {
    const session = getAuthSession();

    if (!session) {
      return;
    }

    set({
      user: session.user,
      token: session.token,
      isAuthenticated: true,
    });
  },

  login: async (payload) => {
    set({ isLoading: true, error: null });
    const result = await mockAuthService.login(payload);

    if (!result.success || !result.user || !result.token) {
      set({ isLoading: false, error: result.message });
      return null;
    }

    setSession(result.user, result.token);
    set({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false, error: null });
    return result.user;
  },

  registerMerchant: async (payload) => {
    set({ isLoading: true, error: null });
    const servicePayload = {
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      phone: payload.phone,
      shopName: payload.shopName,
      address: payload.address,
    };
    const result = await mockAuthService.registerMerchant(servicePayload);

    if (!result.success) {
      set({ isLoading: false, error: result.message });
      return false;
    }

    set({ isLoading: false, error: null });
    return true;
  },

  logout: () => {
    clearAuthSession();
    set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
