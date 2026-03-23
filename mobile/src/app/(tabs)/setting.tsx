import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/auth.store';
import type { AuthStore } from '../../stores/auth.store';

export default function SettingScreen() {
  const logout = useAuthStore((state: AuthStore) => state.logout);
  const user = useAuthStore((state: AuthStore) => state.user);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: handleLogout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Settings</Text>
        <Text style={styles.subheading}>Your travel profile and app snapshot</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(user?.fullName?.[0] || 'T').toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.fullName || 'Tourist User'}</Text>
            <Text style={styles.email}>{user?.email || 'tourist@example.com'}</Text>
            <Text style={styles.role}>Role: Tourist</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today’s snapshot</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>POIs nearby</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Tours saved</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>85%</Text>
              <Text style={styles.statLabel}>Profile complete</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coming soon</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>🔔 Smart POI notifications</Text>
            <Text style={styles.featureDesc}>Get context-aware suggestions when approaching interesting places.</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>🎧 Audio guide preferences</Text>
            <Text style={styles.featureDesc}>Set language, playback speed and auto-play behavior.</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>🗺️ Offline map packs</Text>
            <Text style={styles.featureDesc}>Download city bundles for seamless travel without connection.</Text>
          </View>
        </View>

        <Pressable onPress={confirmLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 14 },
  heading: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subheading: { fontSize: 13, color: '#6b7280' },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  profileInfo: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  email: { fontSize: 13, color: '#4b5563' },
  role: { fontSize: 12, color: '#6b7280' },
  section: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: { fontSize: 16, fontWeight: '800', color: '#4338ca' },
  statLabel: { fontSize: 11, color: '#4b5563' },
  featureItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    gap: 4,
  },
  featureTitle: { fontSize: 13, fontWeight: '700', color: '#1f2937' },
  featureDesc: { fontSize: 12, color: '#4b5563' },
  logoutButton: {
    marginTop: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});