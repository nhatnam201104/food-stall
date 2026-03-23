import { useFonts } from 'expo-font';
import * as Location from 'expo-location';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { useAuthStore } from '../stores/auth.store';
import type { AuthStore } from '../stores/auth.store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((state: AuthStore) => state.isAuthenticated);
  const isHydrated = useAuthStore((state: AuthStore) => state.isHydrated);
  const hydrateFromStorage = useAuthStore((state: AuthStore) => state.hydrateFromStorage);
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/Space_Mono/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hide();
    }
  }, [loaded]);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isHydrated, router, segments]);

  useEffect(() => {
    if (!loaded || !isHydrated) return;

    let cancelled = false;

    const requestGpsPermissionOnFirstLaunch = async () => {
      try {
        const askedBefore = await AsyncStorage.getItem(STORAGE_KEYS.gpsPermissionAsked);
        if (askedBefore === '1') return;

        const currentPermission = await Location.getForegroundPermissionsAsync();
        let finalStatus = currentPermission.status;

        if (finalStatus !== 'granted' && currentPermission.canAskAgain) {
          const requestResult = await Location.requestForegroundPermissionsAsync();
          finalStatus = requestResult.status;
        }

        await AsyncStorage.setItem(STORAGE_KEYS.gpsPermissionAsked, '1');

        if (finalStatus !== 'granted' && !cancelled) {
          Alert.alert(
            'GPS permission',
            'Bạn có thể bật quyền vị trí trong Settings để app theo dõi vị trí realtime và kích hoạt audio theo điểm đứng của bạn.',
          );
        }
      } catch {
        // ignore permission prompt errors
      }
    };

    void requestGpsPermissionOnFirstLaunch();

    return () => {
      cancelled = true;
    };
  }, [loaded, isHydrated]);

  if (!loaded || !isHydrated) {
    return null;
  }

  return <SafeAreaProvider>
        <Stack>
          {/* auth là nhóm trang đăng nhập, đăng ký */}
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          {/* (tabs) là nhóm trang có thanh menu dưới cùng */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style='light'/>
    </SafeAreaProvider>
}
