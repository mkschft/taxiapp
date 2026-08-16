import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, TextInput, Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/ui/AppButton';
import { AppInput } from '../components/ui/AppInput';
import { FormErrorBanner } from '../components/ui/FormErrorBanner';
import { GuestShell } from '../components/web/GuestShell';
import { colors, spacing, fontSize, font } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import { createGuestCheckoutSession, type PlanType } from '../lib/paymentApi';
import * as Haptics from 'expo-haptics';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GuestCheckout'>;
type Props = {
  route: RouteProp<RootStackParamList, 'GuestCheckout'>;
};

export function GuestCheckoutScreen({ route }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const { planType, redirectTab, redirectScreen } = route.params;

  const clearFormError = () => setFormError(null);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!email.trim()) {
      next.email = t('auth.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = t('auth.invalidEmail');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoading(true);
    try {
      const { url } = await createGuestCheckoutSession(email.trim(), planType as PlanType);
      if (Platform.OS === 'web') {
        window.location.href = url;
      } else {
        await Linking.openURL(url);
      }
    } catch (err: any) {
      const status = err?.statusCode;
      if (status === 409) {
        // Email already exists
        setFormError(t('guestCheckout.emailExists'));
      } else {
        setFormError(err?.message ?? t('guestCheckout.genericError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLogin = () => {
    navigation.navigate('Login', {
      redirect: redirectTab && redirectScreen
        ? { tab: redirectTab, screen: redirectScreen }
        : undefined,
    });
  };

  return (
    <GuestShell>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        >
          <View style={styles.topBar}>
            <AppButton
              label=""
              onPress={handleBack}
              variant="secondary"
              style={styles.backBtn}
            />
            <View style={styles.backIcon}>
              <ChevronLeft size={20} color={colors.textSecondary} strokeWidth={2.2} />
            </View>
            <Text style={styles.headerTitle}>{t('guestCheckout.title')}</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.subtitle}>{t('guestCheckout.subtitle')}</Text>

            <View style={styles.form}>
              <AppInput
                ref={emailRef}
                label={t('auth.emailLabel')}
                placeholder={t('auth.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                value={email}
                onChangeText={(text) => { setEmail(text); clearFormError(); }}
                error={errors.email}
              />

              {formError && (
                <View style={{ marginTop: spacing.md }}>
                  <FormErrorBanner message={formError} />
                </View>
              )}

              <AppButton
                label={t('guestCheckout.continueToPayment')}
                onPress={handleContinue}
                loading={loading}
                style={{ marginTop: spacing.lg }}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('guestCheckout.haveAccount')}</Text>
              <AppButton
                label={t('auth.logIn')}
                onPress={handleLogin}
                variant="secondary"
                style={{ marginTop: spacing.sm }}
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
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
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
