import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../stores/auth.store';
import type { AuthStore } from '../../../stores/auth.store';
import { uploadService } from '../../../services/upload.service';
import { isValidPhone, normalizePhone } from '../../../utils/phone.util';
import { styles } from './profile-edit.styles';

const ProfileEditForm = () => {
  const user = useAuthStore((state: AuthStore) => state.user);
  const updateProfile = useAuthStore((state: AuthStore) => state.updateProfile);
  const isLoading = useAuthStore((state: AuthStore) => state.isLoading);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; phone?: string; avatar?: string }>({});

  const validateForm = (): boolean => {
    const errors: { fullName?: string; phone?: string } = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.';
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    } else if (fullName.trim().length > 100) {
      errors.fullName = 'Full name must be less than 100 characters.';
    }

    if (phone && phone.trim() && !isValidPhone(phone.trim(), 'VN')) {
      errors.phone = 'Invalid phone number. Use local format or include the country code (e.g. +84912345678).';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const normalizedPhone = phone.trim() ? (normalizePhone(phone.trim(), 'VN') ?? null) : null;

    const success = await updateProfile({
      fullName: fullName.trim(),
      phone: normalizedPhone,
      avatarUrl: avatarUrl || null,
    });

    if (success) {
      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      const latestError = useAuthStore.getState().error;
      Alert.alert('Error', latestError || 'Failed to update profile. Please try again.');
    }
  };

  const handleChangePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Need access to your photos to upload avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
      quality: 0.5,
    });

    if (!result.canceled) {
      const formData = new FormData();
      formData.append('image', {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as unknown as Blob);

      try {
        const response = await uploadService.uploadImage(formData);
        if (response.data.success && response.data.data) {
          setAvatarUrl(response.data.data.url);
        } else {
          Alert.alert('Error', 'Failed to upload image.');
        }
      } catch {
        Alert.alert('Error', 'Something went wrong during upload.');
      }
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.heading}>Edit Profile</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {(fullName?.[0] || user?.fullName?.[0] || 'T').toUpperCase()}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.changePhotoButton} onPress={handleChangePhoto}>
              <Ionicons name="camera-outline" size={20} color="#6366f1" />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={[styles.inputContainer, fieldErrors.fullName && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9ca3af"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
              {fieldErrors.fullName && (
                <Text style={styles.errorText}>{fieldErrors.fullName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, styles.inputDisabled]}>
                <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputTextDisabled]}
                  value={user?.email || ''}
                  editable={false}
                />
              </View>
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputContainer, fieldErrors.phone && styles.inputError]}>
                <Ionicons name="call-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 0912345678 or +84912345678"
                  placeholderTextColor="#9ca3af"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
              {fieldErrors.phone && (
                <Text style={styles.errorText}>{fieldErrors.phone}</Text>
              )}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, isLoading && styles.buttonDisabled]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfileEditForm;
