import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage.constants';
import type { StoredAuthSession } from '../types/auth.types';

export const saveAuthSession = async (session: StoredAuthSession): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify(session));
  await AsyncStorage.setItem(STORAGE_KEYS.authToken, session.token);
};

export const getAuthSession = async (): Promise<StoredAuthSession | null> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.authSession);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAuthSession;
  } catch {
    await clearAuthSession();
    return null;
  }
};

export const getAccessToken = async (): Promise<string | null> => AsyncStorage.getItem(STORAGE_KEYS.authToken);

export const clearAuthSession = async (): Promise<void> => {
  await AsyncStorage.multiRemove([STORAGE_KEYS.authSession, STORAGE_KEYS.authToken]);
};
