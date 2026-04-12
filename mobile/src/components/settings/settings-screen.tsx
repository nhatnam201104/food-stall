import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth.store';
import type { AuthStore } from '../../stores/auth.store';
import { styles } from './settings-screen.styles';

const SettingsScreen = () => {
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

  const handleProfilePress = () => {
    router.push('/profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Settings</Text>
        <Text style={styles.subheading}>Your travel profile and app snapshot</Text>

        <Pressable onPress={handleProfilePress} style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={{ width: 54, height: 54, borderRadius: 27 }} />
            ) : (
              <Text style={styles.avatarText}>{(user?.fullName?.[0] || 'T').toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.fullName || 'Tourist User'}</Text>
            <Text style={styles.email}>{user?.email || 'tourist@example.com'}</Text>
            <Text style={styles.role}>Role: Tourist</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's snapshot</Text>
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
};

export default SettingsScreen;
