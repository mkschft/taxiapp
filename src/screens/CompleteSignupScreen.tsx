import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { AppInput } from '../components/ui/AppInput';
import { FormErrorBanner } from '../components/ui/FormErrorBanner';
import { GuestShell } from '../components/web/GuestShell';
import { colors, spacing, fontSize, font } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import { completeGuestSignup } from '../lib/authApi';
import { useAuth } from '../store/authStore';
import * as Haptics from 'expo-haptics';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CompleteSignup'>;
type Props = {
  route: RouteProp<RootStackParamList, 'CompleteSignup'>;
};

export function CompleteSignupScreen({ route }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { setAuth, markOnboardingSeen } = useAuth();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const nameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const { email, redirectTab, redirectScreen } = route.params;

  const clearFormError = () => setFormError(null);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) {
      next.name = t('auth.nameRequired');
    }
    if (!password) {
      next.password = t('auth.passwordRequired');
    } else if (password.length < 6) {
      next.password = t('auth.passwordTooShort');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleComplete = async () => {
    if (!validate()) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoading(true);
    try {
      const { accessToken, refreshToken, user } = await completeGuestSignup(
        email,
        password,
        name.trim(),
      );

      // Guest users skip onboarding since they already made a purchase
      await setAuth(user, accessToken, refreshToken);
      await markOnboardingSeen();

      // Navigate to app
      if (redirectTab && redirectScreen) {
        navigation.replace('App', {
          screen: redirectTab,
          params: {
            screen: redirectScreen,
          },
        } as any);
      } else {
        navigation.replace('App');
      }
    } catch (err: any) {
      setFormError(err?.message ?? t('auth.completeSignup.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestShell>
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
            <View style={styles.iconContainer}>
              <CheckCircle size={64} color={colors.success} strokeWidth={1.8} />
            </View>

            <Text style={styles.title}>{t('auth.completeSignup.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.completeSignup.subtitle', { email })}</Text>

            <View style={styles.form}>
              <AppInput
                ref={nameRef}
                label={t('auth.nameLabel')}
                placeholder={t('auth.namePlaceholder')}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                value={name}
                onChangeText={(text) => { setName(text); clearFormError(); }}
                error={errors.name}
              />

              <AppInput
                ref={passwordRef}
                label={t('auth.passwordLabel')}
                placeholder={t('auth.passwordPlaceholder')}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleComplete}
                value={password}
                onChangeText={(text) => { setPassword(text); clearFormError(); }}
                error={errors.password}
                style={{ marginTop: spacing.md }}
              />

              {formError && (
                <View style={{ marginTop: spacing.md }}>
                  <FormErrorBanner message={formError} />
                </View>
              )}

              <AppButton
                label={t('auth.completeSignup.completeButton')}
                onPress={handleComplete}
                loading={loading}
                style={{ marginTop: spacing.lg }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GuestShell>
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
  iconContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: font.bold,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
});
