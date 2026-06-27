import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Platform, Alert, Linking,
} from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { AppButton } from '../components/ui/AppButton';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import { useAuth } from '../store/authStore';
import { createCheckoutSession, type PlanType } from '../lib/paymentApi';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Pricing'>;

type Plan = {
  key: PlanType | 'free_preview';
  name: string;
  price: string;
  description: string;
  perks: string[];
  buttonLabel: string;
  buttonVariant: 'primary' | 'secondary';
  badge?: string;
  accent: string;
};

const PLANS: Plan[] = [
  {
    key: 'free_preview',
    name: 'Free Preview',
    price: '€0',
    description: 'Try the app without any commitment.',
    perks: ['1 vocabulary page', '4 practice questions'],
    buttonLabel: 'Start free preview',
    buttonVariant: 'secondary',
    accent: colors.primary,
  },
  {
    key: '3_day',
    name: '3-Day Pass',
    price: '€40',
    description: 'Quick revision before the exam.',
    perks: ['Full access for 3 days'],
    buttonLabel: 'Get 3-day access',
    buttonVariant: 'secondary',
    accent: colors.success,
  },
  {
    key: '7_day',
    name: '7-Day Pass',
    price: '€70',
    description: 'Balanced and focused preparation.',
    perks: ['Full access for 7 days'],
    buttonLabel: 'Get 7-day access',
    buttonVariant: 'primary',
    badge: 'Most Popular',
    accent: colors.primary,
  },
  {
    key: '14_day',
    name: '14-Day Pass',
    price: '€120',
    description: 'Complete preparation with more practice.',
    perks: ['Full access for 14 days'],
    buttonLabel: 'Get 14-day access',
    buttonVariant: 'secondary',
    accent: colors.warning,
  },
];

export function PricingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Pricing'>>();
  const { state: auth } = useAuth();
  const [loading, setLoading] = useState<PlanType | null>(null);

  const redirectTab = route.params?.redirectTab;
  const redirectScreen = route.params?.redirectScreen;

  const handleSelect = async (plan: Plan) => {
    if (plan.key === 'free_preview') {
      navigation.goBack();
      return;
    }

    if (!auth.user) {
      Alert.alert('Sign in required', 'Please log in or create an account to purchase access.');
      return;
    }

    setLoading(plan.key);
    try {
      const { url } = await createCheckoutSession(plan.key);
      if (Platform.OS === 'web') {
        window.location.href = url;
      } else {
        await Linking.openURL(url);
      }
    } catch (err: any) {
      Alert.alert('Checkout failed', err?.message ?? 'Could not start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Choose a plan" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>Full access to all features</Text>
        <Text style={styles.sub}>
          Vocabulary, clue words, topic practice, explanations, and model tests. Only the access duration changes.
        </Text>

        <View style={styles.grid}>
          {PLANS.map((plan) => {
            const isLoading = loading === plan.key;
            return (
              <View key={plan.key} style={[styles.card, plan.badge && styles.cardPopular]}>
                {plan.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{plan.badge}</Text>
                  </View>
                )}
                <Text style={[styles.planName, { color: plan.accent }]}>{plan.name}</Text>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.description}>{plan.description}</Text>

                <View style={styles.perks}>
                  {plan.perks.map((perk) => (
                    <View key={perk} style={styles.perkRow}>
                      <Check size={14} color={plan.accent} strokeWidth={2.4} />
                      <Text style={styles.perkText}>{perk}</Text>
                    </View>
                  ))}
                </View>

                <AppButton
                  label={plan.buttonLabel}
                  variant={plan.buttonVariant}
                  loading={isLoading}
                  onPress={() => handleSelect(plan)}
                  style={{ marginTop: spacing.md }}
                />
              </View>
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  headline: { fontSize: fontSize.xl, fontFamily: font.bold, color: colors.text, textAlign: 'center' },
  sub: {
    fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center',
    marginTop: spacing.sm, marginBottom: spacing.lg, lineHeight: 20,
  },
  grid: { flexDirection: Platform.OS === 'web' ? 'row' : 'column', gap: spacing.md, flexWrap: 'wrap' },
  card: {
    flex: 1, minWidth: 220,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg,
    padding: spacing.lg, backgroundColor: colors.bg,
  },
  cardPopular: { borderColor: colors.primary },
  badge: {
    alignSelf: 'center', backgroundColor: colors.primary,
    borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  badgeText: { fontSize: fontSize.xs, fontFamily: font.bold, color: '#fff' },
  planName: { fontSize: fontSize.md, fontFamily: font.bold, textAlign: 'center' },
  price: { fontSize: fontSize.xl, fontFamily: font.extrabold, color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  description: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  perks: { marginTop: spacing.md, gap: 8 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkText: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontFamily: font.medium },
});
