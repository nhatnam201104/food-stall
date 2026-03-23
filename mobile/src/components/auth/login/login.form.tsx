import React, { useState } from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authStyles, COLORS } from '../../../styles/auth.styles';
import { loginSchema } from '../../../libs/validation/auth/login.schema';
import { useAuthStore } from '../../../stores/auth.store';
import type { AuthStore } from '../../../stores/auth.store';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const loginTourist = useAuthStore((state: AuthStore) => state.loginTourist);
  const isLoading = useAuthStore((state: AuthStore) => state.isLoading);
  const clearError = useAuthStore((state: AuthStore) => state.clearError);

  const handleLogin = async () => {
    clearError();

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      return;
    }

    setFieldErrors({});
    const success = await loginTourist(parsed.data);
    if (success) {
      router.replace('/(tabs)');
      return;
    }

    const latestError = useAuthStore.getState().error;
    if (latestError) {
      Alert.alert('Login error', latestError);
    }
  };

  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  const navigateToForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <SafeAreaView style={authStyles.container}>
      {/* Hide the default header */}
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={authStyles.logoContainer}>
            <Ionicons name="fast-food" size={80} color={COLORS.primary} />
            <Text style={authStyles.logoText}>Welcome Back</Text>
            <Text style={authStyles.subtitle}>Sign in to continue to Food Stall</Text>
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

            <View style={authStyles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.textLight}
                style={authStyles.icon}
              />
              <TextInput
                style={authStyles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={authStyles.forgotPasswordContainer} onPress={navigateToForgotPassword}>
              <Text style={authStyles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={authStyles.button} onPress={handleLogin} disabled={isLoading}>
              <Text style={authStyles.buttonText}>{isLoading ? 'LOADING...' : 'LOGIN'}</Text>
            </TouchableOpacity>

            {(fieldErrors.email || fieldErrors.password) && (
              <Text style={{ color: COLORS.error, marginBottom: 10 }}>
                {fieldErrors.email || fieldErrors.password}
              </Text>
            )}

            <View style={authStyles.dividerContainer}>
              <View style={authStyles.divider} />
              <Text style={authStyles.dividerText}>OR LOGIN WITH</Text>
              <View style={authStyles.divider} />
            </View>

            <View style={authStyles.socialContainer}>
              <TouchableOpacity style={authStyles.socialButton}>
                <Ionicons name="logo-google" size={20} color={COLORS.google} />
                <Text style={authStyles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={authStyles.socialButton}>
                <Ionicons name="logo-facebook" size={20} color={COLORS.facebook} />
                <Text style={authStyles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={authStyles.footerContainer}>
            <Text style={authStyles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={authStyles.footerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
