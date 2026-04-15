import { useFonts } from "expo-font";
import * as Location from "expo-location";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Alert, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { STORAGE_KEYS } from "../constants/storage.constants";
import { useAuthStore } from "../stores/auth.store";
import type { AuthStore } from "../stores/auth.store";
import { useLocationStore } from "../stores/locationStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore(
    (state: AuthStore) => state.isAuthenticated,
  );
  const isHydrated = useAuthStore((state: AuthStore) => state.isHydrated);
  const hydrateFromStorage = useAuthStore(
    (state: AuthStore) => state.hydrateFromStorage,
  );
  const [loaded] = useFonts({
    SpaceMono: require("../../assets/fonts/Space_Mono/SpaceMono-Regular.ttf"),
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

    const inAuthGroup = segments[0] === "auth";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/auth/login");
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isHydrated, router, segments]);

  useEffect(() => {
    if (!loaded || !isHydrated) return;

    let cancelled = false;

    const checkGpsPermissionOnEveryLaunch = async () => {
      try {
        // Always check and sync current permission state to store
        const currentPermission =
          await Location.getForegroundPermissionsAsync();
        let finalStatus = currentPermission.status;

        const askedBefore = await AsyncStorage.getItem(
          STORAGE_KEYS.gpsPermissionAsked,
        );

        if (askedBefore !== "1") {
          // First launch — request permission
          if (finalStatus !== "granted" && currentPermission.canAskAgain) {
            const requestResult =
              await Location.requestForegroundPermissionsAsync();
            finalStatus = requestResult.status;
          }
          await AsyncStorage.setItem(STORAGE_KEYS.gpsPermissionAsked, "1");
        }

        // Always sync permission state to location store (critical for GPS watching)
        const granted = finalStatus === "granted";
        useLocationStore.getState().setHasPermission(granted);
        // GPS permission synced

        if (!granted && !cancelled) {
          Alert.alert(
            "Cần quyền vị trí",
            "Ứng dụng cần quyền vị trí để kích hoạt Audio Guide và chỉ đường. Vui lòng mở Cài đặt để cấp quyền.",
            [
              {
                text: "Mở cài đặt",
                onPress: () => {
                  void Linking.openSettings();
                },
              },
              { text: "Bỏ qua", style: "cancel" },
            ],
          );
        }
      } catch {
        // ignore permission prompt errors
      }
    };

    void checkGpsPermissionOnEveryLaunch();

    return () => {
      cancelled = true;
    };
  }, [loaded, isHydrated]);

  if (!loaded || !isHydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack>
        {/* auth là nhóm trang đăng nhập, đăng ký */}
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        {/* (tabs) là nhóm trang có thanh menu dưới cùng */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Tour detail — push over tabs */}
        <Stack.Screen
          name="tour/[id]"
          options={{ title: "Tour Detail", headerBackTitle: "Back" }}
        />
      </Stack>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
