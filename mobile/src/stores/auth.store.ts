import { create } from 'zustand';
import { authService } from '../services/auth.service';
import type {
  ForgotPasswordPayload,
  LoginPayload,
  TouristRegisterPayload,
  TouristSessionUser,
} from '../types/auth.types';
import { clearAuthSession, getAuthSession, saveAuthSession } from '../utils/auth-storage.util';

export interface AuthStore {
  user: TouristSessionUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrateFromStorage: () => Promise<void>;
  loginTourist: (payload: LoginPayload) => Promise<boolean>;
  registerTourist: (payload: TouristRegisterPayload) => Promise<boolean>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const getErrorMessage = (err: unknown, fallback: string): string => {
  const axiosErr = err as {
    message?: string;
    response?: {
      data?: {
        message?: string;
        errors?: Array<{ field?: string; message?: string }>;
      } | string;
    };
  };

  const data = axiosErr.response?.data;
  if (!data) {
    const raw = axiosErr.message?.trim();
    if (raw && /timeout|network error|ecconnaborted/i.test(raw)) {
      return 'Cannot connect to server (timeout/network). Please check API IP, backend server status, and phone/emulator network.';
    }
    return raw && !/^request failed/i.test(raw) ? raw : fallback;
  }

  if (typeof data === 'string') {
    const text = data.trim();
    return text || fallback;
  }

  const baseMessage = data.message || fallback;
  const details = Array.isArray(data.errors)
    ? data.errors
        .map((item) => {
          const field = item.field?.trim();
          const message = item.message?.trim();
          if (!message) return '';
          return field && field !== 'unknown' ? `${field}: ${message}` : message;
        })
        .filter(Boolean)
    : [];

  if (!details.length) return baseMessage;
  return `${baseMessage}\n• ${details.join('\n• ')}`;
};

const toTouristUser = (user: {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
}): TouristSessionUser | null => {
  if (user.role !== 'tourist') return null;

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: 'tourist',
    isActive: user.isActive,
  };
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,
  error: null,

  hydrateFromStorage: async () => {
    try {
      const session = await getAuthSession();

      if (!session) {
        set({ isHydrated: true, isAuthenticated: false, token: null, user: null });
        return;
      }

      set({ token: session.token, user: session.user, isAuthenticated: true });

      try {
        const res = await authService.me();
        const me = res.data.data;

        if (!me || me.role !== 'tourist' || !me.isActive) {
          await clearAuthSession();
          set({ token: null, user: null, isAuthenticated: false, isHydrated: true });
          return;
        }

        await saveAuthSession({ token: session.token, user: me });
        set({ token: session.token, user: me, isAuthenticated: true, isHydrated: true });
      } catch {
        await clearAuthSession();
        set({ token: null, user: null, isAuthenticated: false, isHydrated: true });
      }
    } catch {
      await clearAuthSession();
      set({ token: null, user: null, isAuthenticated: false, isHydrated: true });
    }
  },

  loginTourist: async (payload): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.loginTourist(payload);
      const data = res.data.data;

      if (!data) {
        set({ isLoading: false, error: 'Login failed. Please try again.' });
        return false;
      }

      const touristUser = toTouristUser(data.user);

      if (!touristUser) {
        set({ isLoading: false, error: 'This account is not allowed on tourist mobile app.' });
        return false;
      }

      await saveAuthSession({ token: data.token, user: touristUser });

      set({
        user: touristUser,
        token: data.token,
        isAuthenticated: true,
        isHydrated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err) {
      set({ isLoading: false, error: getErrorMessage(err, 'Login failed. Please try again.') });
      return false;
    }
  },

  registerTourist: async (payload): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      await authService.registerTourist(payload);

      const loginRes = await authService.loginTourist({ email: payload.email, password: payload.password });
      const loginData = loginRes.data.data;

      if (!loginData) {
        set({ isLoading: false, error: 'Account created but auto login failed. Please login manually.' });
        return false;
      }

      const touristUser = toTouristUser(loginData.user);

      if (!touristUser) {
        set({ isLoading: false, error: 'This account is not allowed on tourist mobile app.' });
        return false;
      }

      await saveAuthSession({ token: loginData.token, user: touristUser });
      set({
        user: touristUser,
        token: loginData.token,
        isAuthenticated: true,
        isHydrated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err) {
      set({ isLoading: false, error: getErrorMessage(err, 'Registration failed. Please try again.') });
      return false;
    }
  },

  forgotPassword: async (payload): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      await authService.forgotPassword(payload);
      set({ isLoading: false, error: null });
      return true;
    } catch (err) {
      set({ isLoading: false, error: getErrorMessage(err, 'Unable to process forgot password request.') });
      return false;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // ignore network/logout errors
    }

    await clearAuthSession();
    set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
