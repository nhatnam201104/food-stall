import React, { useEffect, useRef, useState } from 'react';
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
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authOtpService } from '../../../services/auth-otp.service';
import { styles } from './verify-otp.styles';
import { authStyles, COLORS } from '../login/auth.styles';

const VerifyOtpForm = () => {
  const params = useLocalSearchParams<{ email: string; expiresIn?: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(Number(params.expiresIn) || 60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Validation', 'Please enter all 6 digits.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authOtpService.verifyOtp(params.email!, otpCode);
      if (response.success) {
        router.push({
          pathname: '/auth/reset-password',
          params: { email: params.email!, otp: otpCode },
        });
      } else {
        Alert.alert('Error', response.message || 'Invalid OTP');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message || 'Invalid OTP';
      Alert.alert('Error', msg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setIsLoading(true);
    try {
      const response = await authOtpService.sendOtp(params.email!);
      if (response.success) {
        setTimeLeft(response.expiresIn ?? 60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        Alert.alert('Success', 'A new OTP has been sent to your email.');
      } else {
        Alert.alert('Error', response.message || 'Failed to resend OTP');
      }
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message || 'Failed to resend OTP';
      Alert.alert('Error', msg);
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
            <Ionicons name="shield-checkmark-outline" size={68} color={COLORS.primary} />
            <Text style={authStyles.logoText}>Verify OTP</Text>
            <Text style={authStyles.subtitle}>
              Enter the 6-digit code sent to {params.email}. Valid for 5 minutes.
            </Text>
          </View>

          <View style={authStyles.formContainer}>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text.slice(-1), index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              style={[authStyles.button, isLoading && { opacity: 0.6 }]}
              onPress={handleVerify}
              disabled={isLoading}
            >
              <Text style={authStyles.buttonText}>
                {isLoading ? 'VERIFYING...' : 'VERIFY OTP'}
              </Text>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              {canResend ? (
                <TouchableOpacity onPress={handleResend} disabled={isLoading}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.countdownText}>
                  Resend OTP in {timeLeft}s
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyOtpForm;
