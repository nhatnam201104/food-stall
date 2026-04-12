import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../stores/auth.store';
import type { AuthStore } from '../../../stores/auth.store';
import { styles } from './profile-view.styles';

const ProfileView = () => {
  const user = useAuthStore((state: AuthStore) => state.user);

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.heading}>Profile</Text>
          <Text style={styles.subheading}>Your personal information</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {(user?.fullName?.[0] || 'T').toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.badgeContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.fullName || 'Tourist User'}</Text>
            <Text style={styles.email}>{user?.email || 'tourist@example.com'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Tourist</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="person-outline" size={20} color="#6366f1" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user?.fullName || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="mail-outline" size={20} color="#6366f1" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="call-outline" size={20} color="#6366f1" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#6366f1" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Account Status</Text>
              <Text style={[styles.infoValue, { color: user?.isActive ? '#10b981' : '#ef4444' }]}>
                {user?.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable onPress={handleEditProfile} style={styles.editButton}>
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>

          <Pressable style={styles.actionItem} onPress={() => router.push('/profile/change-password')}>
            <View style={styles.actionIcon}>
              <Ionicons name="lock-closed-outline" size={20} color="#6366f1" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Change Password</Text>
              <Text style={styles.actionDesc}>Update your account password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable style={styles.actionItem}>
            <View style={styles.actionIcon}>
              <Ionicons name="notifications-outline" size={20} color="#6366f1" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Notifications</Text>
              <Text style={styles.actionDesc}>Manage your notification preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable style={styles.actionItem}>
            <View style={styles.actionIcon}>
              <Ionicons name="shield-outline" size={20} color="#6366f1" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Privacy</Text>
              <Text style={styles.actionDesc}>Control your privacy settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileView;
