import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { GuestShell } from '../components/web/GuestShell';
import { colors, spacing, fontSize, font } from '../theme/tokens';
import { verifySession } from '../lib/paymentApi';
import { getMe } from '../lib/authApi';
import { useAuth } from '../store/authStore';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PaymentSuccess'>;

export function PaymentSuccessScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'PaymentSuccess'>>();
  const { t } = useTranslation();
  const { state: auth, updateUser } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = route.params as any;
  const sessionId = params.sessionId ?? params.session_id;
  const { redirectTab, redirectScreen } = route.params;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await verifySession(sessionId);

        // Handle guest checkout - navigate to complete signup
        if (result.isGuest && result.email) {
          if (!cancelled) {
            setVerifying(false);
            navigation.replace('CompleteSignup', {
              email: result.email,
              redirectTab,
              redirectScreen,
            });
          }
          return;
        }

        // Regular flow for authenticated users
        if (!auth.accessToken) {
          if (!cancelled) {
            setError(t('pricing.errorLoginAgain'));
            setVerifying(false);
          }
          return;
        }
        const user = await getMe();
        if (!cancelled) {
          await updateUser(user);
          setVerifying(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? t('pricing.errorVerifyFailed'));
          setVerifying(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, auth.accessToken, updateUser, navigation, redirectTab, redirectScreen]);

  const handleContinue = () => {
    navigation.replace('App');
  };

  let inner: React.ReactNode;
  if (verifying) {
    inner = (
      <>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.status}>{t('pricing.verifying')}</Text>
      </>
    );
  } else if (error) {
    inner = (
      <>
        <Text style={styles.h}>{t('pricing.errorTitle')}</Text>
        <Text style={styles.sub}>{error}</Text>
        <AppButton label={t('pricing.goToDashboard')} onPress={() => navigation.replace('App')} style={{ marginTop: spacing.lg }} />
      </>
    );
  } else {
    inner = (
      <>
        <CheckCircle size={64} color={colors.success} strokeWidth={1.8} />
        <Text style={styles.h}>{t('pricing.successTitle')}</Text>
        <Text style={styles.sub}>{t('pricing.successBody')}</Text>
        <AppButton label={t('common.continue')} onPress={handleContinue} style={{ marginTop: spacing.lg }} />
      </>
    );
  }

  return (
    <GuestShell variant="centered">
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>{inner}</View>
      </SafeAreaView>
    </GuestShell>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  status: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.md, fontFamily: font.medium },
  h: { fontSize: fontSize.xl, fontFamily: font.bold, color: colors.text, marginTop: spacing.lg, textAlign: 'center' },
  sub: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, maxWidth: 320 },
});
