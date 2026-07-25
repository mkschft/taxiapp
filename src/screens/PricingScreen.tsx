import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Platform, Linking,
} from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { AppButton } from '../components/ui/AppButton';
import { AlertDialog } from '../components/ui/AlertDialog';
import { GuestShell } from '../components/web/GuestShell';
import { useBreakpoint } from '../theme/breakpoints';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import { useAuth, hasActivePaidPlan, getRemainingDays } from '../store/authStore';
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

const PLAN_ORDER: Record<Plan['key'], number> = {
  free_preview: 0,
  '1_day': 1,
  '7_day': 2,
  '14_day': 3,
};

const PLAN_DURATION_DAYS: Record<Plan['key'], number> = {
  free_preview: 0,
  '1_day': 1,
  '7_day': 7,
  '14_day': 14,
};

function planOrderOf(planType: string | null): number {
  if (!planType) return -1;
  return PLAN_ORDER[planType as Plan['key']] ?? -1;
}

function isUpgrade(currentPlanType: string | null, targetPlanType: Plan['key']): boolean {
  if (!currentPlanType || currentPlanType === 'free_preview') return false;
  return PLAN_ORDER[targetPlanType] > planOrderOf(currentPlanType);
}

function isDowngrade(currentPlanType: string | null, targetPlanType: Plan['key']): boolean {
  if (!currentPlanType || currentPlanType === 'free_preview') return false;
  return PLAN_ORDER[targetPlanType] < planOrderOf(currentPlanType);
}

function isDayPassToFullUpgrade(currentPlanType: string | null, targetPlanType: Plan['key']): boolean {
  return currentPlanType === '1_day' && (targetPlanType === '7_day' || targetPlanType === '14_day');
}

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
    key: '1_day',
    nameKey: 'pricing.plans.day1.name',
    price: '€5',
    descriptionKey: 'pricing.plans.day1.description',
    perkKeys: ['pricing.plans.day1.perk1', 'pricing.plans.day1.perk2'],
    buttonLabelKey: 'pricing.plans.day1.button',
    buttonVariant: 'secondary',
    accent: colors.success,
  },
  {
    key: '7_day',
    nameKey: 'pricing.plans.day7.name',
    price: '€50',
    descriptionKey: 'pricing.plans.day7.description',
    perkKeys: ['pricing.plans.day7.perk1', 'pricing.plans.day7.perk2', 'pricing.plans.day7.perk3'],
    buttonLabelKey: 'pricing.plans.day7.button',
    buttonVariant: 'primary',
    badgeKey: 'pricing.mostPopular',
    accent: colors.primary,
  },
  {
    key: '14_day',
    nameKey: 'pricing.plans.day14.name',
    price: '€100',
    descriptionKey: 'pricing.plans.day14.description',
    perkKeys: ['pricing.plans.day14.perk1', 'pricing.plans.day14.perk2', 'pricing.plans.day14.perk3'],
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
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    variant?: 'default' | 'danger' | 'success';
  } | null>(null);

  const hasActive = auth.user ? hasActivePaidPlan(auth.user.subscription) : false;
  const activePlanType = auth.user?.subscription.planType ?? null;
  const remainingDays = auth.user ? getRemainingDays(auth.user.subscription) : 0;

  const { isCompact } = useBreakpoint();
  const redirectTab = route.params?.redirectTab;
  const redirectScreen = route.params?.redirectScreen;

  const handleBack = () => {
    if (redirectTab && redirectScreen) {
      navigation.replace('App' as any, {
        screen: redirectTab,
        params: { screen: redirectScreen },
      } as any);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace(auth.user ? 'App' : 'Welcome');
    }
  };

  const handleSelect = async (plan: Plan) => {
    if (plan.key === 'free_preview') {
      navigation.goBack();
      return;
    }

    if (!auth.user) {
      setDialog({
        title: t('pricing.signInRequiredTitle'),
        message: t('pricing.signInRequiredBody'),
      });
      return;
    }

    // Buying the same plan you already have active is a no-op; buying a
    // *different* plan while one is active is an upgrade and allowed.
    if (hasActive && auth.user.subscription.planType === plan.key) {
      setDialog({
        title: t('pricing.activeSubTitle'),
        message: t('pricing.activeSubBody'),
      });
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
      setDialog({
        title: t('pricing.checkoutFailedTitle'),
        message: err?.message ?? t('pricing.checkoutFailedBody'),
        variant: 'danger',
      });
    } finally {
      setLoading(null);
    }
  };

  const isUpgrading = hasActive && activePlanType !== 'free_preview';
  const headline = isUpgrading ? t('pricing.upgradeHeadline') : t('pricing.headline');
  const subtitle = isUpgrading ? t('pricing.upgradeSubtitle') : t('pricing.subtitle');

  return (
    <GuestShell variant="centered" maxWidth={1020}>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title={t('pricing.title')} onBack={handleBack} />
        <ScrollView contentContainerStyle={[styles.scroll, !isCompact && styles.scrollDesktop]} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.sub}>{subtitle}</Text>

        <View style={[styles.grid, isCompact && styles.gridCompact]}>
          {PLANS.map((plan) => {
            const isLoading = loading === plan.key;
            const isActivePlan = hasActive && activePlanType === plan.key;
            const planIsUpgrade = isUpgrade(activePlanType, plan.key);
            const planIsDowngrade = isDowngrade(activePlanType, plan.key);
            const planIsDayPassToFull = isDayPassToFullUpgrade(activePlanType, plan.key);
            const bonusDays = planIsDayPassToFull ? 1 : 0;
            const totalDays = remainingDays + PLAN_DURATION_DAYS[plan.key] + bonusDays;
            const buttonDisabled = isActivePlan || planIsDowngrade;
            const buttonLabel = isActivePlan
              ? t('pricing.active')
              : planIsDowngrade
                ? t('pricing.notAvailable')
                : planIsUpgrade
                  ? t('pricing.upgrade')
                  : t(plan.buttonLabelKey);

            return (
              <View key={plan.key} style={[styles.card, plan.badgeKey && styles.cardPopular]}>
                <View style={styles.cardBody}>
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

                  {planIsUpgrade && (
                    <View style={styles.upgradeInfo}>
                      <Text style={styles.upgradeInfoText}>
                        {t('pricing.remainingDaysAdded', { remaining: remainingDays })}
                      </Text>
                      {planIsDayPassToFull && (
                        <Text style={styles.upgradeInfoText}>{t('pricing.bonusDayAdded')}</Text>
                      )}
                      <Text style={[styles.upgradeInfoText, styles.totalDays]}>
                        {t('pricing.totalDays', { total: totalDays })}
                      </Text>
                    </View>
                  )}
                </View>

                <AppButton
                  label={buttonLabel}
                  variant={plan.buttonVariant}
                  loading={isLoading}
                  disabled={buttonDisabled}
                  onPress={() => handleSelect(plan)}
                  labelStyle={isActivePlan ? styles.activeButtonText : undefined}
                  style={[
                    { marginTop: spacing.md },
                    isActivePlan && { backgroundColor: 'transparent', borderWidth: 0, opacity: 1 }
                  ]}
                />
              </View>
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <AlertDialog
        visible={!!dialog}
        title={dialog?.title ?? ''}
        message={dialog?.message}
        buttonLabel={t('common.ok')}
        variant={dialog?.variant}
        onDismiss={() => setDialog(null)}
      />
    </SafeAreaView>
    </GuestShell>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  scrollDesktop: { padding: 0 },
  headline: { fontSize: fontSize.xl, fontFamily: font.bold, color: colors.text, textAlign: 'center' },
  sub: {
    fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center',
    marginTop: spacing.sm, marginBottom: spacing.lg, lineHeight: 20,
  },
  grid: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  gridCompact: { flexDirection: 'column' },
  card: {
    flex: 1, minWidth: 220,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg,
    padding: spacing.lg, backgroundColor: colors.bg,
  },
  cardBody: { flex: 1 },
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
  upgradeInfo: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: 2,
  },
  upgradeInfoText: { fontSize: fontSize.sm, color: colors.textSecondary, fontFamily: font.medium },
  totalDays: { color: colors.text, fontFamily: font.semibold, marginTop: 2 },
  activeButtonText: { color: colors.text },
});
