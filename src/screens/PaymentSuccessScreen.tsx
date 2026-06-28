import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CheckCircle } from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { colors, spacing, fontSize, font } from '../theme/tokens';
import { verifySession } from '../lib/paymentApi';
import { getMe } from '../lib/authApi';
import { useAuth } from '../store/authStore';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PaymentSuccess'>;

export function PaymentSuccessScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'PaymentSuccess'>>();
  const { state: auth, setAuth } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { sessionId: sessionIdParam, redirectTab, redirectScreen } = route.params;
  const sessionId = sessionIdParam ?? (route.params as any).session_id;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await verifySession(sessionId);
        if (!auth.accessToken) {
          if (!cancelled) {
            setError('Session verified, but you need to log in again to refresh your subscription.');
            setVerifying(false);
          }
          return;
        }
        const user = await getMe(auth.accessToken);
        if (!cancelled) {
          await setAuth(user, auth.accessToken, auth.refreshToken!);
          setVerifying(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'Could not verify payment. Please contact support.');
          setVerifying(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, auth.accessToken, auth.refreshToken, setAuth]);

  const handleContinue = () => {
    navigation.replace('App');
  };

  if (verifying) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.status}>Verifying your payment…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.h}>Something went wrong</Text>
          <Text style={styles.sub}>{error}</Text>
          <AppButton label="Go to Dashboard" onPress={() => navigation.replace('App')} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <CheckCircle size={64} color={colors.success} strokeWidth={1.8} />
        <Text style={styles.h}>Payment successful!</Text>
        <Text style={styles.sub}>Your subscription is now active. Enjoy full access to all features.</Text>
        <AppButton label="Continue" onPress={handleContinue} style={{ marginTop: spacing.lg }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  status: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.md, fontFamily: font.medium },
  h: { fontSize: fontSize.xl, fontFamily: font.bold, color: colors.text, marginTop: spacing.lg, textAlign: 'center' },
  sub: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, maxWidth: 320 },
});
