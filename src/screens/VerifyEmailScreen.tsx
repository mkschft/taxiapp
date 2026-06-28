import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Mail } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/ui/AppButton';
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
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { state: auth, setAuth, clearAuth } = useAuth();
  const isLoggedIn = !!auth.user;

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasAutoVerified = useRef(false);

  useEffect(() => {
    const token = route.params?.token;
    if (!token) {
      // No token in URL — user arrived from login/signup.
      // Show the info state and wait for them to click the email link.
      return;
    }

    if (hasAutoVerified.current) return;
    hasAutoVerified.current = true;
    setLoading(true);

    verifyEmail(token)
      .then(() => {
        setSuccessMessage(t('auth.emailVerifiedSuccess'));
        if (isLoggedIn && auth.refreshToken) {
          return refreshTokens(auth.refreshToken).then(({ accessToken, refreshToken }) =>
            getMe(accessToken).then((user) => setAuth(user, accessToken, refreshToken))
          );
        }
      })
      .catch((err: any) => {
        const status = err?.statusCode;
        if (status === 401) {
          setFormError(t('auth.invalidVerificationToken'));
        } else {
          setFormError(err?.message ?? t('auth.genericError'));
        }
      })
      .finally(() => setLoading(false));
  }, [route.params?.token, isLoggedIn, auth.refreshToken, setAuth, t]);

  const handleResend = async () => {
    const email = auth.user?.email;
    if (!email) {
      setFormError(t('auth.resendNeedsLogin'));
      return;
    }
    setResendLoading(true);
    setFormError(null);
    try {
      const res = await resendVerification(email);
      Alert.alert(t('auth.resendAlertTitle'), res.message);
    } catch (err: any) {
      setFormError(err?.message ?? t('auth.resendFailed'));
    } finally {
      setResendLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearAuth();
  };

  const token = route.params?.token;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Mail size={40} color={colors.primary} strokeWidth={2} />
        </View>

        <Text style={styles.title}>{t('auth.verifyTitle')}</Text>
        <Text style={styles.subtitle}>
          {isLoggedIn
            ? t('auth.verifySubtitleLoggedIn', { email: auth.user!.email })
            : t('auth.verifySubtitleGuest')}
        </Text>

        {loading && (
          <View style={styles.statusBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.statusText}>{t('auth.verifying')}</Text>
          </View>
        )}

        {!loading && successMessage && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{successMessage}</Text>
            {isLoggedIn && (
              <AppButton
                label={t('common.continue')}
                onPress={() => navigation.replace(auth.onboardingSeen ? 'App' : 'Onboarding')}
                variant="secondary"
                style={{ marginTop: spacing.md }}
              />
            )}
            {!isLoggedIn && (
              <AppButton
                label={t('auth.goToLogIn')}
                onPress={() => navigation.navigate('Login')}
                variant="secondary"
                style={{ marginTop: spacing.md }}
              />
            )}
          </View>
        )}

        {!loading && formError && (
          <View style={styles.statusBox}>
            <FormErrorBanner message={formError} />
            {isLoggedIn && (
              <View style={styles.actions}>
                <AppButton
                  label={t('auth.resendVerification')}
                  onPress={handleResend}
                  loading={resendLoading}
                  variant="secondary"
                />
                <AppButton
                  label={t('auth.logOut')}
                  onPress={handleLogout}
                  variant="danger"
                  style={{ marginTop: spacing.md }}
                />
              </View>
            )}
            {!isLoggedIn && (
              <AppButton
                label={t('auth.goToLogIn')}
                onPress={() => navigation.navigate('Login')}
                variant="secondary"
                style={{ marginTop: spacing.md }}
              />
            )}
          </View>
        )}

        {!loading && !successMessage && !formError && !token && (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              {t('auth.checkInbox')}
            </Text>
            {isLoggedIn && (
              <View style={styles.actions}>
                <AppButton
                  label={t('auth.resendVerification')}
                  onPress={handleResend}
                  loading={resendLoading}
                  variant="secondary"
                />
                <AppButton
                  label={t('auth.logOut')}
                  onPress={handleLogout}
                  variant="danger"
                  style={{ marginTop: spacing.md }}
                />
              </View>
            )}
            {!isLoggedIn && (
              <AppButton
                label={t('auth.goToLogIn')}
                onPress={() => navigation.navigate('Login')}
                variant="secondary"
                style={{ marginTop: spacing.md }}
              />
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
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
  statusBox: {
    width: '100%',
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  statusText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    fontFamily: font.regular,
    color: colors.textSecondary,
    textAlign: 'center',
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
