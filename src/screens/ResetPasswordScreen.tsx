import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { AppInput } from '../components/ui/AppInput';
import { FormErrorBanner } from '../components/ui/FormErrorBanner';
import { colors, spacing, fontSize, font } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import { resetPassword } from '../lib/authApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;
type Props = {
  route: RouteProp<RootStackParamList, 'ResetPassword'>;
};

export function ResetPasswordScreen({ route }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const token = route.params?.token ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setFormError('Invalid or missing reset token. Please request a new reset link.');
    }
  }, [token]);

  const clearFormError = () => setFormError(null);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    clearFormError();
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      const status = err?.statusCode;
      if (status === 401) {
        setFormError('Invalid or expired token. Please request a new reset link.');
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
          <Text style={styles.headerTitle}>Reset password</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {success ? (
            <View style={styles.successBox}>
              <CheckCircle2 size={40} color={colors.success} strokeWidth={2} />
              <Text style={styles.successTitle}>Password reset</Text>
              <Text style={styles.successText}>
                Your password has been reset successfully. You can now log in with your new password.
              </Text>
              <AppButton
                label="Go to log in"
                onPress={() => navigation.navigate('Login')}
                variant="secondary"
                style={{ marginTop: spacing.lg }}
              />
            </View>
          ) : (
            <>
              <Text style={styles.instructions}>
                Enter your new password below.
              </Text>

              <View style={styles.form}>
                <AppInput
                  label="New password"
                  placeholder="Min 6 characters"
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                  value={password}
                  onChangeText={(text) => { setPassword(text); clearFormError(); }}
                  error={errors.password}
                />

                <AppInput
                  label="Confirm password"
                  placeholder="Repeat password"
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  value={confirmPassword}
                  onChangeText={(text) => { setConfirmPassword(text); clearFormError(); }}
                  error={errors.confirmPassword}
                  style={{ marginTop: spacing.md }}
                />

                {formError && (
                  <View style={{ marginTop: spacing.md }}>
                    <FormErrorBanner message={formError} />
                  </View>
                )}

                <AppButton
                  label="Reset password"
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
  successBox: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
  },
  successTitle: {
    fontSize: fontSize.lg,
    fontFamily: font.bold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  successText: {
    fontSize: fontSize.md,
    fontFamily: font.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});
