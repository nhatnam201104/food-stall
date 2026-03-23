import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';
import type { AuthStore } from '../stores/auth.store';

export default function Index() {
  const isAuthenticated = useAuthStore((state: AuthStore) => state.isAuthenticated);
  return <Redirect href={isAuthenticated ? '/(tabs)' : '/auth/login'} />;
}
