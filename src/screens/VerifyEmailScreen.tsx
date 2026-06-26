import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Mail } from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { AppInput } from '../components/ui/AppInput';
import { FormErrorBanner } from '../components/ui/FormErrorBanner';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import { verifyEmail, resendVerification, refreshTokens, getMe } from '../lib/authApi';
import { useAuth } from '../store/authStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'VerifyEmail'>;
type Props = {
  route: RouteProp<RootStackParamList, 'VerifyEmail'>;
};

export function VerifyEmailScreen({ route }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const { state: auth, setAuth, clearAuth } = useAuth();
  const isLoggedIn = !!auth.user;

  const [token, setToken] = useState(route.params?.token ?? '');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.token) {
      setToken(route.params.token);
    }
  }, [route.params?.token]);

  const clearFormError = () => setFormError(null);

  const handleVerify = async () => {
    if (!token.trim()) {
      setFormError('Please enter the verification token');
      return;
    }
    setLoading(true);
    clearFormError();
    try {
      await verifyEmail(token.trim());
      setSuccessMessage('Email verified successfully');

      if (isLoggedIn && auth.refreshToken) {
        // Refresh tokens so the new access token has emailVerified=true.
        const { accessToken, refreshToken } = await refreshTokens(auth.refreshToken);
        const user = await getMe(accessToken);
        await setAuth(user, accessToken, refreshToken);
      }
    } catch (err: any) {
      const status = err?.statusCode;
      if (status === 401) {
        setFormError('Invalid or expired token. Please request a new verification email.');
      } else {
        setFormError(err?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const email = auth.user?.email;
    if (!email) {
      setFormError('Unable to resend. Please log in first.');
      return;
    }
    setResendLoading(true);
    clearFormError();
    try {
      const res = await resendVerification(email);
      Alert.alert('Verification email sent', res.message);
    } catch (err: any) {
      setFormError(err?.message ?? 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearAuth();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrap}>
            <Mail size={40} color={colors.primary} strokeWidth={2} />
          </View>

          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            {isLoggedIn
              ? `We sent a verification link to ${auth.user!.email}. Enter the token below or tap the link in the email.`
              : 'Enter the verification token from your email to activate your account.'}
          </Text>

          {successMessage ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMessage}</Text>
              {!isLoggedIn && (
                <AppButton
                  label="Go to log in"
                  onPress={() => navigation.navigate('Login')}
                  variant="secondary"
                  style={{ marginTop: spacing.md }}
                />
              )}
            </View>
          ) : (
            <>
              <View style={styles.form}>
                <AppInput
                  label="Verification token"
                  placeholder="Paste token here"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={token}
                  onChangeText={(text) => { setToken(text); clearFormError(); }}
                />

                {formError && (
                  <View style={{ marginTop: spacing.md }}>
                    <FormErrorBanner message={formError} />
                  </View>
                )}

                <AppButton
                  label="Verify email"
                  onPress={handleVerify}
                  loading={loading}
                  style={{ marginTop: spacing.lg }}
                />
              </View>

              {isLoggedIn && (
                <View style={styles.actions}>
                  <AppButton
                    label="Resend verification email"
                    onPress={handleResend}
                    loading={resendLoading}
                    variant="secondary"
                  />
                  <AppButton
                    label="Log out"
                    onPress={handleLogout}
                    variant="danger"
                    style={{ marginTop: spacing.md }}
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: font.bold,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    fontFamily: font.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  form: {
    width: '100%',
    marginTop: spacing.xl,
  },
  actions: {
    width: '100%',
    marginTop: spacing.lg,
  },
  successBox: {
    width: '100%',
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.success + '15',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.success + '30',
    alignItems: 'center',
  },
  successText: {
    fontSize: fontSize.md,
    fontFamily: font.semibold,
    color: colors.success,
    textAlign: 'center',
  },
});
