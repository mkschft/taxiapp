import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { IconChip } from '../components/ui/IconChip';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { MODULE_ICONS } from '../theme/icons';

// Where each module lives in the navigator, so cards are tappable.
type Nav = { stack?: 'Study' | 'Test'; screen: string } | { tab: 'Progress' };

type Module = {
  id: string; Icon: LucideIcon; tint: string; nav: Nav;
};

const MODULES: Module[] = [
  { id: 'examGuide', Icon: MODULE_ICONS.examGuide, tint: colors.primary, nav: { stack: 'Study', screen: 'Guide' } },
  { id: 'vocabulary', Icon: MODULE_ICONS.vocabulary, tint: colors.success, nav: { stack: 'Study', screen: 'VocabSets' } },
  { id: 'clueWords', Icon: MODULE_ICONS.clueWords, tint: colors.warning, nav: { stack: 'Study', screen: 'ClueWords' } },
  { id: 'topicPractice', Icon: MODULE_ICONS.topicPractice, tint: colors.error, nav: { stack: 'Study', screen: 'TopicSections' } },
  { id: 'modelTests', Icon: MODULE_ICONS.modelTests, tint: colors.modelTest, nav: { stack: 'Test', screen: 'TestHome' } },
  { id: 'progress', Icon: MODULE_ICONS.progress, tint: colors.primary, nav: { tab: 'Progress' } },
];

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4', 'step5'] as const;

export function HowToScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const go = (nav: Nav) => {
    if ('tab' in nav) navigation.navigate(nav.tab);
    else if (nav.stack) navigation.navigate(nav.stack, { screen: nav.screen, params: {} });
    else navigation.navigate(nav.screen);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={t('howto.title')} onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{t('howto.heroTitle')}</Text>
          <Text style={styles.heroSub}>{t('howto.heroSub')}</Text>
        </View>

        {/* Recommended study plan */}
        <View style={styles.planCard}>
          <Text style={styles.planLabel}>{t('howto.planLabel')}</Text>
          {STEP_KEYS.map((key, i) => (
            <View key={key} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
              <Text style={styles.stepText}>{t(`howto.${key}`)}</Text>
            </View>
          ))}
        </View>

        {/* Module cards */}
        <Text style={styles.sectionLabel}>{t('howto.sectionLabel')}</Text>
        <View style={styles.modules}>
          {MODULES.map(m => (
            <TouchableOpacity
              key={m.id}
              style={styles.modCard}
              onPress={() => go(m.nav)}
              activeOpacity={0.75}
            >
              <View style={styles.modHeader}>
                <IconChip Icon={m.Icon} tint={m.tint} size={40} iconSize={20} />
                <Text style={styles.modTitle}>{t(`howto.modules.${m.id}.title`)}</Text>
                <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2} />
              </View>
              <Text style={styles.modWhat}>{t(`howto.modules.${m.id}.what`)}</Text>
              <View style={styles.modHow}>
                <Text style={styles.modHowText}>{t(`howto.modules.${m.id}.how`)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('howto.footer')}</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  hero: {
    margin: spacing.md, padding: spacing.md,
    backgroundColor: colors.primary, borderRadius: radius.md,
    ...shadow.md,
  },
  heroTitle: { fontSize: fontSize.lg, fontFamily: font.bold, color: '#fff', lineHeight: 26 },
  heroSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: 8, lineHeight: 20 },

  planCard: {
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  planLabel: {
    fontSize: fontSize.sm, fontFamily: font.semibold, color: colors.text,
    marginBottom: spacing.sm,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  stepNumText: { fontSize: 12, fontFamily: font.bold, color: '#fff' },
  stepText: { flex: 1, fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },

  sectionLabel: {
    fontSize: fontSize.sm, fontFamily: font.semibold, color: colors.textSecondary,
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  modules: { paddingHorizontal: spacing.md, gap: 12 },
  modCard: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    ...shadow.sm,
  },
  modHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconChip: {
    width: 40, height: 40, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  modTitle: { flex: 1, fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  modWhat: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  modHow: {
    marginTop: 10, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: colors.border,
  },
  modHowText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, fontStyle: 'italic' },

  footer: {
    marginHorizontal: spacing.md, marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.warningTint, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.warning + '55',
  },
  footerText: { fontSize: 13, color: colors.text, lineHeight: 19 },
});
