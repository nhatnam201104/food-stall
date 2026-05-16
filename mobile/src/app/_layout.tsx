import { useFonts } from "expo-font";
import * as Location from "expo-location";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Alert, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { STORAGE_KEYS } from "../constants/storage.constants";
import { useLocationStore } from "../stores/locationStore";
import { useLanguageStore } from "../stores/languageStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../../assets/fonts/Space_Mono/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    useLanguageStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hide();
    }
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;

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
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack>
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
