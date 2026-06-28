import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Platform, Alert, Linking,
} from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { AppButton } from '../components/ui/AppButton';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import { useAuth, hasActivePaidPlan } from '../store/authStore';
import { createCheckoutSession, type PlanType } from '../lib/paymentApi';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Pricing'>;

type Plan = {
  key: PlanType | 'free_preview';
  nameKey: string;
  price: string;
  descriptionKey: string;
  perkKeys: string[];
  buttonLabelKey: string;
  buttonVariant: 'primary' | 'secondary';
  badgeKey?: string;
  accent: string;
};

const PLANS: Plan[] = [
  {
    key: 'free_preview',
    nameKey: 'pricing.plans.free.name',
    price: '€0',
    descriptionKey: 'pricing.plans.free.description',
    perkKeys: ['pricing.plans.free.perk1', 'pricing.plans.free.perk2'],
    buttonLabelKey: 'pricing.plans.free.button',
    buttonVariant: 'secondary',
    accent: colors.primary,
  },
  {
    key: '3_day',
    nameKey: 'pricing.plans.day3.name',
    price: '€40',
    descriptionKey: 'pricing.plans.day3.description',
    perkKeys: ['pricing.plans.day3.perk1'],
    buttonLabelKey: 'pricing.plans.day3.button',
    buttonVariant: 'secondary',
    accent: colors.success,
  },
  {
    key: '7_day',
    nameKey: 'pricing.plans.day7.name',
    price: '€70',
    descriptionKey: 'pricing.plans.day7.description',
    perkKeys: ['pricing.plans.day7.perk1'],
    buttonLabelKey: 'pricing.plans.day7.button',
    buttonVariant: 'primary',
    badgeKey: 'pricing.mostPopular',
    accent: colors.primary,
  },
  {
    key: '14_day',
    nameKey: 'pricing.plans.day14.name',
    price: '€120',
    descriptionKey: 'pricing.plans.day14.description',
    perkKeys: ['pricing.plans.day14.perk1'],
    buttonLabelKey: 'pricing.plans.day14.button',
    buttonVariant: 'secondary',
    accent: colors.warning,
  },
];

export function PricingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Pricing'>>();
  const { t } = useTranslation();
  const { state: auth } = useAuth();
  const [loading, setLoading] = useState<PlanType | null>(null);

  const hasActive = auth.user ? hasActivePaidPlan(auth.user.subscription) : false;
  const activePlanType = auth.user?.subscription.planType ?? null;

  const redirectTab = route.params?.redirectTab;
  const redirectScreen = route.params?.redirectScreen;

  const handleSelect = async (plan: Plan) => {
    if (plan.key === 'free_preview') {
      navigation.goBack();
      return;
    }

    if (!auth.user) {
      Alert.alert(t('pricing.signInRequiredTitle'), t('pricing.signInRequiredBody'));
      return;
    }

    if (hasActive && auth.user.subscription.planType !== plan.key) {
      Alert.alert(t('pricing.activeSubTitle'), t('pricing.activeSubBody'));
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
      Alert.alert(t('pricing.checkoutFailedTitle'), err?.message ?? t('pricing.checkoutFailedBody'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={t('pricing.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>{t('pricing.headline')}</Text>
        <Text style={styles.sub}>{t('pricing.subtitle')}</Text>

        <View style={styles.grid}>
          {PLANS.map((plan) => {
            const isLoading = loading === plan.key;
            const isActivePlan = activePlanType === plan.key;
            const buttonDisabled = isActivePlan || (hasActive && !isActivePlan);
            return (
              <View key={plan.key} style={[styles.card, plan.badgeKey && styles.cardPopular]}>
                {plan.badgeKey && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t(plan.badgeKey)}</Text>
                  </View>
                )}
                <Text style={[styles.planName, { color: plan.accent }]}>{t(plan.nameKey)}</Text>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.description}>{t(plan.descriptionKey)}</Text>

                <View style={styles.perks}>
                  {plan.perkKeys.map((perkKey) => (
                    <View key={perkKey} style={styles.perkRow}>
                      <Check size={14} color={plan.accent} strokeWidth={2.4} />
                      <Text style={styles.perkText}>{t(perkKey)}</Text>
                    </View>
                  ))}
                </View>

                <AppButton
                  label={isActivePlan ? t('pricing.active') : t(plan.buttonLabelKey)}
                  variant={plan.buttonVariant}
                  loading={isLoading}
                  disabled={buttonDisabled}
                  onPress={() => handleSelect(plan)}
                  style={[
                    { marginTop: spacing.md },
                    isActivePlan && { backgroundColor: 'transparent', borderWidth: 0 }
                  ]}
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
