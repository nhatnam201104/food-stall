import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { changePasswordSchema } from '../../../libs/validation/auth/change-password.schema';
import { useAuthStore } from '../../../stores/auth.store';
import type { AuthStore } from '../../../stores/auth.store';
import { styles } from './change-password.styles';

const ChangePasswordForm = () => {
  const changePassword = useAuthStore((state: AuthStore) => state.changePassword);
  const isLoading = useAuthStore((state: AuthStore) => state.isLoading);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmNewPassword });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    const success = await changePassword(parsed.data);

    if (success) {
      Alert.alert('Success', 'Your password has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      const latestError = useAuthStore.getState().error;
      Alert.alert('Error', latestError || 'Failed to change password. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </Pressable>
            <Text style={styles.heading}>Change Password</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <View style={[styles.inputRow, fieldErrors.currentPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor="#9ca3af"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrent}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowCurrent((v) => !v)}>
                  <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
                </Pressable>
              </View>
              {fieldErrors.currentPassword && <Text style={styles.errorText}>{fieldErrors.currentPassword}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={[styles.inputRow, fieldErrors.newPassword && styles.inputError]}>
                <Ionicons name="key-outline" size={20} color="#6b7280" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password (min 8 chars)"
                  placeholderTextColor="#9ca3af"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowNew((v) => !v)}>
                  <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
                </Pressable>
              </View>
              {fieldErrors.newPassword && <Text style={styles.errorText}>{fieldErrors.newPassword}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={[styles.inputRow, fieldErrors.confirmNewPassword && styles.inputError]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#6b7280" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#9ca3af"
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowConfirm((v) => !v)}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
                </Pressable>
              </View>
              {fieldErrors.confirmNewPassword && <Text style={styles.errorText}>{fieldErrors.confirmNewPassword}</Text>}
            </View>
          </View>

          <Pressable
            style={[styles.submitButton, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitText}>{isLoading ? 'Saving...' : 'Update Password'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChangePasswordForm;
