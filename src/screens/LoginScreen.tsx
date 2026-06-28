import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, TextInput, Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/ui/AppButton';
import { AppInput } from '../components/ui/AppInput';
import { FormErrorBanner } from '../components/ui/FormErrorBanner';
import { colors, spacing, fontSize, font } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import { post } from '../lib/api';
import { useAuth } from '../store/authStore';
import type { AuthUser } from '../store/authStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
type Props = {
  route: RouteProp<RootStackParamList, 'Login'>;
};

export function LoginScreen({ route }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { setAuth, completeReturningUserAuth, markOnboardingSeen, state: auth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  const clearFormError = () => setFormError(null);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = t('auth.emailRequired');
    if (!password) next.password = t('auth.passwordRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const upgradingGuest = !!(auth.user || auth.guest);
    setLoading(true);
    try {
      const { accessToken, refreshToken, user } = await post<{
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      }>('/auth/login', {
        email: email.trim(),
        password,
      });

      if (!user.emailVerified) {
        // A returning user logging in is never a first-run user, so suppress the
        // onboarding carousel even though they still need to verify their email.
        // (VerifyEmail routes to 'App' when onboardingSeen, else 'Onboarding'.)
        await setAuth(user, accessToken, refreshToken);
        void markOnboardingSeen();
        navigation.replace('VerifyEmail');
        return;
      }

      // Returning users skip the first-run carousel. Batch auth + onboarding
      // into a single state update to avoid a double full-app re-render.
      await completeReturningUserAuth(user, accessToken, refreshToken);

      const redirect = route.params?.redirect;
      if (redirect) {
        navigation.replace('App' as any, {
          screen: redirect.tab,
          params: {
            screen: redirect.screen,
            params: redirect.params,
          },
        });
      } else if (upgradingGuest) {
        navigation.goBack();
      } else {
        navigation.replace('App');
      }
    } catch (err: any) {
      const status = err?.statusCode;
      if (status === 401) {
        setFormError(t('auth.incorrectCredentials'));
      } else {
        setFormError(err?.message ?? t('auth.genericError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <View style={styles.topBar}>
          <AppButton
            label=""
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.backBtn}
          />
          <View style={styles.backIcon}>
            <ChevronLeft size={20} color={colors.textSecondary} strokeWidth={2.2} />
          </View>
          <Text style={styles.headerTitle}>{t('auth.loginTitle')}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.form}>
            <AppInput
              label={t('auth.emailLabel')}
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              value={email}
              onChangeText={(text) => { setEmail(text); clearFormError(); }}
              error={errors.email}
            />

            <AppInput
              ref={passwordRef}
              label={t('auth.passwordLabel')}
              placeholder={t('auth.loginPasswordPlaceholder')}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              value={password}
              onChangeText={(text) => { setPassword(text); clearFormError(); }}
              error={errors.password}
              style={{ marginTop: spacing.md }}
            />

            <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotLink}>
              <Text style={styles.forgotText}>{t('auth.forgotPasswordLink')}</Text>
            </Pressable>

            {formError && (
              <View style={{ marginTop: spacing.md }}>
                <FormErrorBanner message={formError} />
              </View>
            )}

            <AppButton
              label={t('auth.logIn')}
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: spacing.lg }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
            <AppButton
              label={t('auth.signUp')}
              onPress={() => navigation.navigate('Signup', { redirect: route.params?.redirect })}
              variant="secondary"
              style={{ marginTop: spacing.sm }}
            />
          </View>
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
  },
  topBar: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  backBtn: {
    position: 'absolute',
    left: spacing.sm,
    top: 0,
    width: 44,
    height: 44,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  backIcon: {
    position: 'absolute',
    left: spacing.sm + 12,
    top: 12,
    pointerEvents: 'none',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontFamily: font.bold,
    color: colors.text,
  },
  form: { width: '100%' },
  footer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
  forgotText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontFamily: font.semibold,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontFamily: font.medium,
  },
});
