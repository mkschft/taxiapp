import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, TextInput, Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { AppInput } from '../components/ui/AppInput';
import { FormErrorBanner } from '../components/ui/FormErrorBanner';
import { colors, spacing, fontSize, font } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import { post } from '../lib/api';
import { getMe, resendVerification } from '../lib/authApi';
import { useAuth } from '../store/authStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
type Props = {
  route: RouteProp<RootStackParamList, 'Login'>;
};

export function LoginScreen({ route }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const { setAuth, markOnboardingSeen, state: auth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    if (auth.hydrated && auth.user?.emailVerified) {
      navigation.replace('App');
    }
  }, [auth.hydrated, auth.user, navigation]);

  const clearFormError = () => setFormError(null);

  const handleResendFromError = async () => {
    if (!email.trim()) {
      setFormError('Please enter your email first.');
      return;
    }
    try {
      await resendVerification(email.trim());
      setFormError('Verification email resent. Please check your inbox.');
    } catch (err: any) {
      setFormError(err?.message ?? 'Failed to resend verification email.');
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = 'Email is required';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const upgradingGuest = !!(auth.user || auth.guest);
    setLoading(true);
    try {
      const { accessToken, refreshToken } = await post<{ accessToken: string; refreshToken: string }>('/auth/login', {
        email: email.trim(),
        password,
      });

      const user = await getMe(accessToken);
      await setAuth(user, accessToken, refreshToken);

      // Returning users skip the first-run carousel. Marking onboarding seen
      // flips entry state and the root navigator swaps in the App tabs; a guest
      // upgrading is already inside the app, so just pop this screen.
      await markOnboardingSeen();

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
        setFormError('Incorrect email or password. Please try again.');
      } else if (status === 403) {
        setFormError('Please verify your email before logging in.');
      } else {
        setFormError(err?.message ?? 'Something went wrong. Please try again.');
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
          <Text style={styles.headerTitle}>Welcome back</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.form}>
            <AppInput
              label="Email"
              placeholder="you@example.com"
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
              label="Password"
              placeholder="Your password"
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
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            {formError && (
              <View style={{ marginTop: spacing.md }}>
                <FormErrorBanner
                  message={formError}
                  actionLabel={formError.includes('verify') ? 'Resend email' : undefined}
                  onAction={formError.includes('verify') ? handleResendFromError : undefined}
                />
              </View>
            )}

            <AppButton
              label="Log in"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: spacing.lg }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <AppButton
              label="Sign up"
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
