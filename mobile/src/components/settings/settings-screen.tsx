import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/auth.store";
import type { AuthStore } from "../../stores/auth.store";
import { useAudioStore } from "../../stores/audioStore";
import { useTourStore } from "../../stores/tourStore";
import { useLocationStore } from "../../stores/locationStore";
import { styles } from "./settings-screen.styles";

const SettingsScreen = () => {
  const logout = useAuthStore((state: AuthStore) => state.logout);
  const user = useAuthStore((state: AuthStore) => state.user);

  // ── Today Snapshot data ────────────────────────────────────────────────────
  const playedPoiIds = useAudioStore((s) => s.playedPoiIds);
  const activeTour = useTourStore((s) => s.activeTour);
  const tourStatus = useTourStore((s) => s.tourStatus);
  const currentStepIndex = useTourStore((s) => s.currentStepIndex);
  const nearbyPoisCount = useLocationStore((s) => s.nearbyPoisCount);
  const totalPoisHeardCount = useLocationStore((s) => s.totalPoisHeardCount);

  /** POIs heard in the current session (resets when tour restarts) */
  const poisHeardSession = playedPoiIds.length;
  const totalStops = activeTour?.tourPois?.length ?? 0;
  const stepsCompleted =
    tourStatus === "completed" ? totalStops : currentStepIndex;

  const tourProgressLabel =
    tourStatus === "idle"
      ? "No tour"
      : tourStatus === "completed"
        ? "Done ✓"
        : `${stepsCompleted}/${totalStops}`;

  const tourStatusLabel =
    tourStatus === "idle"
      ? "—"
      : tourStatus === "active"
        ? "▶ Active"
        : tourStatus === "paused"
          ? "⏸ Paused"
          : "✓ Completed";

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: handleLogout },
    ]);
  };

  const handleProfilePress = () => {
    router.push("/profile");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Settings</Text>
        <Text style={styles.subheading}>
          Your travel profile and app snapshot
        </Text>

        <Pressable onPress={handleProfilePress} style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={{ width: 54, height: 54, borderRadius: 27 }}
              />
            ) : (
              <Text style={styles.avatarText}>
                {(user?.fullName?.[0] || "T").toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.fullName || "Tourist User"}</Text>
            <Text style={styles.email}>
              {user?.email || "tourist@example.com"}
            </Text>
            <Text style={styles.role}>Role: Tourist</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>

        {/* ── Today's Snapshot ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's snapshot</Text>
          <View style={styles.statsRow}>
            {/* POIs on map / nearby */}
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{nearbyPoisCount}</Text>
              <Text style={styles.statLabel}>POIs nearby</Text>
            </View>

            {/* POIs heard this session */}
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{poisHeardSession}</Text>
              <Text style={styles.statLabel}>POIs heard</Text>
            </View>

            {/* Total POIs heard all-time */}
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalPoisHeardCount}</Text>
              <Text style={styles.statLabel}>Total heard</Text>
            </View>
          </View>

          {/* Tour progress row */}
          {tourStatus !== "idle" && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={[styles.statCard, { flex: 1 }]}>
                <Text style={styles.statNumber}>{tourProgressLabel}</Text>
                <Text style={styles.statLabel}>Tour stops</Text>
              </View>
              <View style={[styles.statCard, { flex: 1 }]}>
                <Text style={[styles.statNumber, { fontSize: 13 }]}>
                  {tourStatusLabel}
                </Text>
                <Text style={styles.statLabel}>Tour status</Text>
              </View>
            </View>
          )}

          {/* Active tour name row */}
          {activeTour && (
            <View
              style={{
                backgroundColor: "#eef2ff",
                borderRadius: 10,
                padding: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Ionicons name="map-outline" size={16} color="#4338ca" />
              <Text
                style={{
                  fontSize: 13,
                  color: "#4338ca",
                  fontWeight: "600",
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {activeTour.name}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coming soon</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>🔔 Smart POI notifications</Text>
            <Text style={styles.featureDesc}>
              Get context-aware suggestions when approaching interesting places.
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>🎧 Audio guide preferences</Text>
            <Text style={styles.featureDesc}>
              Set language, playback speed and auto-play behavior.
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>🗺️ Offline map packs</Text>
            <Text style={styles.featureDesc}>
              Download city bundles for seamless travel without connection.
            </Text>
          </View>
        </View>

        <Pressable onPress={confirmLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
