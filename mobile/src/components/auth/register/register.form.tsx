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
import { registerSchema } from '../../../libs/validation/auth/register.schema';
import { normalizePhone } from '../../../utils/phone.util';
import { useAuthStore } from '../../../stores/auth.store';
import type { AuthStore } from '../../../stores/auth.store';
import { authStyles, COLORS } from '../login/auth.styles';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const registerTourist = useAuthStore((state: AuthStore) => state.registerTourist);
  const isLoading = useAuthStore((state: AuthStore) => state.isLoading);

  const handleRegister = async () => {
    const parsed = registerSchema.safeParse({
      fullName: name,
      email,
      phone,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid form data.';
      setFieldError(firstError);
      return;
    }

    setFieldError(null);
    const success = await registerTourist({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone ? (normalizePhone(parsed.data.phone, 'VN') ?? parsed.data.phone) : undefined,
      password: parsed.data.password,
      confirmPassword: parsed.data.confirmPassword,
    });

    if (success) {
      router.replace('/(tabs)');
      return;
    }

    const latestError = useAuthStore.getState().error;
    if (latestError) {
      setFieldError(latestError);
      Alert.alert('Registration error', latestError);
    }
  };

  const navigateToLogin = () => router.push('/auth/login');

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
            <Ionicons name="person-add" size={70} color={COLORS.primary} />
            <Text style={authStyles.logoText}>Create Account</Text>
            <Text style={authStyles.subtitle}>Sign up to get started!</Text>
          </View>

          <View style={authStyles.formContainer}>
            <View style={authStyles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.textLight}
                style={authStyles.icon}
              />
              <TextInput
                style={authStyles.input}
                placeholder="Full Name"
                placeholderTextColor={COLORS.textLight}
                value={name}
                onChangeText={setName}
              />
            </View>

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
                name="call-outline"
                size={20}
                color={COLORS.textLight}
                style={authStyles.icon}
              />
              <TextInput
                style={authStyles.input}
                placeholder="Phone Number (optional)"
                placeholderTextColor={COLORS.textLight}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
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

            <View style={authStyles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.textLight}
                style={authStyles.icon}
              />
              <TextInput
                style={authStyles.input}
                placeholder="Confirm Password"
                placeholderTextColor={COLORS.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={authStyles.button} onPress={handleRegister} disabled={isLoading}>
              <Text style={authStyles.buttonText}>{isLoading ? 'LOADING...' : 'REGISTER'}</Text>
            </TouchableOpacity>

            {!!fieldError && <Text style={{ color: COLORS.error }}>{fieldError}</Text>}
          </View>

          <View style={authStyles.footerContainer}>
            <Text style={authStyles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={authStyles.footerLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
