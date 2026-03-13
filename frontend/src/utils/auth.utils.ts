import { STORAGE_KEYS } from '../constants';
import type { AuthSessionUser } from '../types';

export interface StoredAuthSession {
  token: string;
  user: AuthSessionUser;
}

export const saveAuthSession = (session: StoredAuthSession): void => {
  localStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify(session));
};

export const getAuthSession = (): StoredAuthSession | null => {
  const raw = localStorage.getItem(STORAGE_KEYS.authSession);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuthSession;
  } catch {
    localStorage.removeItem(STORAGE_KEYS.authSession);
    return null;
  }
};

export const clearAuthSession = (): void => {
  localStorage.removeItem(STORAGE_KEYS.authSession);
};
