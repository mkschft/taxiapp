import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Send } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/ui/AppButton';
import { AppInput } from '../components/ui/AppInput';
import { FormErrorBanner } from '../components/ui/FormErrorBanner';
import { colors, spacing, fontSize, font } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import { forgotPassword } from '../lib/authApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const clearFormError = () => setFormError(null);

  const validate = () => {
    if (!email.trim()) return t('auth.emailRequired');
    if (!/^\S+@\S+\.\S+$/.test(email)) return t('auth.emailInvalid');
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setLoading(true);
    clearFormError();
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setFormError(err?.message ?? t('auth.genericError'));
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
          <Text style={styles.headerTitle}>{t('auth.forgotTitle')}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {sent ? (
            <View style={styles.sentBox}>
              <Send size={32} color={colors.primary} strokeWidth={2} />
              <Text style={styles.sentTitle}>{t('auth.checkEmailTitle')}</Text>
              <Text style={styles.sentText}>
                {t('auth.resetLinkSent', { email })}
              </Text>
              <AppButton
                label={t('auth.backToLogIn')}
                onPress={() => navigation.navigate('Login')}
                variant="secondary"
                style={{ marginTop: spacing.lg }}
              />
            </View>
          ) : (
            <>
              <Text style={styles.instructions}>
                {t('auth.forgotInstructions')}
              </Text>

              <View style={styles.form}>
                <AppInput
                  label={t('auth.emailLabel')}
                  placeholder={t('auth.emailPlaceholder')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  value={email}
                  onChangeText={(text) => { setEmail(text); clearFormError(); }}
                />

                {formError && (
                  <View style={{ marginTop: spacing.md }}>
                    <FormErrorBanner message={formError} />
                  </View>
                )}

                <AppButton
                  label={t('auth.sendResetLink')}
                  onPress={handleSubmit}
                  loading={loading}
                  style={{ marginTop: spacing.lg }}
                />
              </View>
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
  instructions: {
    fontSize: fontSize.md,
    fontFamily: font.regular,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  form: {
    width: '100%',
    marginTop: spacing.xl,
  },
  sentBox: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
  },
  sentTitle: {
    fontSize: fontSize.lg,
    fontFamily: font.bold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  sentText: {
    fontSize: fontSize.md,
    fontFamily: font.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});
