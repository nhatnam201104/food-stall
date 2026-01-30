import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authStyles, COLORS } from '../../../styles/auth.styles';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = () => {
    // Just a design demo
    console.log('Register pressed');
  };

  const navigateToLogin = () => {
    router.push('/auth/login');
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

            <TouchableOpacity style={authStyles.button} onPress={handleRegister}>
              <Text style={authStyles.buttonText}>REGISTER</Text>
            </TouchableOpacity>
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
