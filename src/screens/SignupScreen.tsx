import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, TextInput,
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;
type Props = {
  route: RouteProp<RootStackParamList, 'Signup'>;
};

export function SignupScreen({ route }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { setAuth, state: auth } = useAuth();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const nameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const referralRef = useRef<TextInput>(null);

  const clearFormError = () => setFormError(null);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = t('auth.emailRequired');
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = t('auth.emailInvalid');
    if (!name.trim()) next.name = t('auth.nameRequired');
    if (!password) next.password = t('auth.passwordRequired');
    else if (password.length < 6) next.password = t('auth.passwordTooShort');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    const upgradingGuest = !!(auth.user || auth.guest);
    setLoading(true);
    try {
      const code = referralCode.trim().toUpperCase();
      const { accessToken, refreshToken, user } = await post<{
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      }>('/auth/register', {
        email: email.trim(),
        name: name.trim(),
        password,
        ...(code ? { referredBy: code } : {}),
      });
      await setAuth(user, accessToken, refreshToken);

      if (!user.emailVerified) {
        navigation.replace('VerifyEmail');
        return;
      }

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
      } else if (!auth.onboardingSeen) {
        // Brand-new signup that comes back already verified: still show the
        // first-run carousel before the app, then OnboardingScreen → 'App'.
        navigation.replace('Onboarding');
      } else {
        navigation.replace('App');
      }
    } catch (err: any) {
      const status = err?.statusCode;
      if (status === 409) {
        setFormError(t('auth.emailExists'));
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
          <Text style={styles.headerTitle}>{t('auth.signupTitle')}</Text>
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
              onSubmitEditing={() => nameRef.current?.focus()}
              value={email}
              onChangeText={(text) => { setEmail(text); clearFormError(); }}
              error={errors.email}
            />

            <AppInput
              ref={nameRef}
              label={t('auth.nameLabel')}
              placeholder={t('auth.namePlaceholder')}
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              value={name}
              onChangeText={(text) => { setName(text); clearFormError(); }}
              error={errors.name}
              style={{ marginTop: spacing.md }}
            />

            <AppInput
              ref={passwordRef}
              label={t('auth.passwordLabel')}
              placeholder={t('auth.passwordMinPlaceholder')}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => referralRef.current?.focus()}
              value={password}
              onChangeText={(text) => { setPassword(text); clearFormError(); }}
              error={errors.password}
              style={{ marginTop: spacing.md }}
            />

            <AppInput
              ref={referralRef}
              label={t('auth.referralLabel')}
              placeholder={t('auth.referralPlaceholder')}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSignup}
              value={referralCode}
              onChangeText={(text) => { setReferralCode(text); clearFormError(); }}
              style={{ marginTop: spacing.md }}
            />

            {formError && (
              <View style={{ marginTop: spacing.md }}>
                <FormErrorBanner
                  message={formError}
                  actionLabel={formError === t('auth.emailExists') ? t('auth.logInInstead') : undefined}
                  onAction={formError === t('auth.emailExists') ? () => navigation.navigate('Login', { redirect: route.params?.redirect }) : undefined}
                />
              </View>
            )}

            <AppButton
              label={t('auth.signUp')}
              onPress={handleSignup}
              loading={loading}
              style={{ marginTop: spacing.lg }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.haveAccount')}</Text>
            <AppButton
              label={t('auth.logIn')}
              onPress={() => navigation.navigate('Login', { redirect: route.params?.redirect })}
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
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontFamily: font.medium,
  },
});
