import { StyleSheet } from 'react-native';
import { COLORS } from '../auth.styles';

export const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  countdownText: {
    color: COLORS.textLight,
    fontSize: 13,
  },
});
