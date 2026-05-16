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
import { authOtpService } from '../../../services/auth-otp.service';
import { authStyles, COLORS } from '../auth.styles';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email.');
      return;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      Alert.alert('Lỗi', 'Địa chỉ email không hợp lệ.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authOtpService.sendOtp(email.trim());
      if (response.success) {
        router.push({
          pathname: '/auth/verify-otp',
          params: {
            email: email.trim(),
            expiresIn: (response.expiresIn ?? 60).toString(),
          },
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message || 'Không thể gửi OTP';
      Alert.alert('Lỗi', msg);
    } finally {
      setIsLoading(false);
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
            <Text style={authStyles.subtitle}>We will send a 6-digit code to your email.</Text>
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
              <Text style={authStyles.buttonText}>{isLoading ? 'SENDING...' : 'SEND OTP'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
              <Text style={{ textAlign: 'center', color: COLORS.primary, fontWeight: '700' }}>
                Back to app
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordForm;
