import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Type, Target, ClipboardList, Timer, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/ui/AppButton';
import { GuestShell } from '../components/web/GuestShell';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
  route: RouteProp<RootStackParamList, 'Welcome'>;
};

const FEATURES: { Icon: LucideIcon; tint: string; titleKey: string; bodyKey: string }[] = [
  { Icon: Type, tint: colors.primary, titleKey: 'auth.feature1Title', bodyKey: 'auth.feature1Body' },
  { Icon: Target, tint: colors.success, titleKey: 'auth.feature2Title', bodyKey: 'auth.feature2Body' },
  { Icon: ClipboardList, tint: colors.warning, titleKey: 'auth.feature3Title', bodyKey: 'auth.feature3Body' },
  { Icon: Timer, tint: colors.error, titleKey: 'auth.feature4Title', bodyKey: 'auth.feature4Body' },
];

export function WelcomeScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const deepLinkPlan = route.params?.deepLinkPlan;

  // Handle deep link: if plan param present, navigate to GuestCheckout
  useEffect(() => {
    if (deepLinkPlan) {
      navigation.replace('GuestCheckout', { planType: deepLinkPlan });
    }
  }, [deepLinkPlan, navigation]);

  return (
    <GuestShell>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>

        {/* Top: hero + features — grows to fill space */}
        <View style={styles.top}>
          <View style={styles.hero}>
            <Text style={styles.tagline}>{t('auth.welcomeTagline')}</Text>
            <Text style={styles.headline}>
              {t('auth.welcomeHeadlinePrefix')}
              <Text style={{ color: colors.primary }}>{t('auth.welcomeHeadlineHighlight')}</Text>
            </Text>
            <Text style={styles.subtitle}>
              {t('auth.welcomeSubtitle')}
            </Text>
          </View>

          <View style={styles.features}>
            {FEATURES.map(f => (
              <View key={f.titleKey} style={styles.featureRow}>
                <View style={[styles.featureIconChip, { backgroundColor: f.tint + '18' }]}>
                  <f.Icon size={20} color={f.tint} strokeWidth={2.2} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{t(f.titleKey)}</Text>
                  <Text style={styles.featureBody}>{t(f.bodyKey)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom: auth choices anchored to the bottom */}
        <View style={styles.actions}>
          <AppButton
            label={t('auth.createFreeAccount')}
            onPress={() => navigation.navigate('Signup')}
          />
          <AppButton
            label={t('auth.logIn')}
            variant="secondary"
            onPress={() => navigation.navigate('Login')}
            style={{ marginTop: spacing.sm }}
          />
        </View>

      </View>
    </SafeAreaView>
    </GuestShell>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  top: { flex: 1, justifyContent: 'center' },
  hero: { marginBottom: spacing.lg },
  tagline: {
    fontSize: fontSize.xs, fontFamily: font.bold,
    letterSpacing: 1.2, color: colors.primary,
    textTransform: 'uppercase', marginBottom: spacing.sm,
  },
  headline: { fontSize: fontSize.xl, fontFamily: font.extrabold, color: colors.text, lineHeight: 36, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 24 },
  features: { marginBottom: spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  featureIconChip: {
    width: 40, height: 40, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: fontSize.sm, fontFamily: font.semibold, color: colors.text },
  featureBody: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  actions: {},
});
