import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authStyles, COLORS } from '../../styles/auth.styles';
import { useAuthStore } from '../../stores/auth.store';
import type { AuthStore } from '../../stores/auth.store';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const forgotPassword = useAuthStore((state: AuthStore) => state.forgotPassword);
  const isLoading = useAuthStore((state: AuthStore) => state.isLoading);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Validation', 'Email is required.');
      return;
    }

    const success = await forgotPassword({ email: email.trim() });
    if (success) {
      Alert.alert('Success', 'If an account exists, a reset link has been sent.');
      router.replace('/auth/login');
      return;
    }

    const latestError = useAuthStore.getState().error;
    if (latestError) {
      Alert.alert('Request failed', latestError);
    }
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={authStyles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={authStyles.logoContainer}>
            <Ionicons name="key-outline" size={68} color={COLORS.primary} />
            <Text style={authStyles.logoText}>Forgot Password</Text>
            <Text style={authStyles.subtitle}>We will send a reset link to your email.</Text>
          </View>

          <View style={authStyles.formContainer}>
            <View style={authStyles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.textLight}
                style={authStyles.icon}
              />
              <TextInput
                style={authStyles.input}
                placeholder="Email Address"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={authStyles.button} onPress={handleSubmit} disabled={isLoading}>
              <Text style={authStyles.buttonText}>{isLoading ? 'SENDING...' : 'SEND RESET LINK'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <Text style={{ textAlign: 'center', color: COLORS.primary, fontWeight: '700' }}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
