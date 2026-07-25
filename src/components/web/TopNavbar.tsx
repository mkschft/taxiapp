import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react-native';
import { LanguageToggle } from './LanguageToggle';
import { useBreakpoint } from '../../theme/breakpoints';
import { colors, spacing, fontSize, font, radius } from '../../theme/tokens';

type Props = {
  activeRoute: string;
  onUpgrade: () => void;
  showUpgrade: boolean;
};

const ROUTE_TITLE_KEYS: Record<string, string> = {
  Dashboard: 'nav.dashboard',
  DashboardHome: 'nav.dashboard',
  Test: 'nav.tests',
  TestHome: 'nav.tests',
  Progress: 'nav.progress',
  ProgressHome: 'nav.progress',
  Profile: 'nav.profile',
  ProfileHome: 'nav.profile',
  Guide: 'guide.title',
  HowTo: 'howto.title',
  SavedQuestions: 'saved.title',
  VocabSets: 'nav.dashboard',
  VocabLesson: 'nav.dashboard',
  VocabQuiz: 'nav.dashboard',
  ClueWords: 'nav.dashboard',
  ClueLesson: 'nav.dashboard',
  ClueQuiz: 'nav.dashboard',
  TopicLessons: 'nav.dashboard',
  ModuleQuiz: 'nav.dashboard',
  Practice: 'nav.dashboard',
  ModelTest: 'nav.tests',
  Result: 'nav.tests',
  Referral: 'nav.profile',
};

export function TopNavbar({ activeRoute, onUpgrade, showUpgrade }: Props) {
  const { t } = useTranslation();
  const { isCompact } = useBreakpoint();
  const titleKey = ROUTE_TITLE_KEYS[activeRoute] ?? 'nav.dashboard';

  return (
    <View style={styles.bar}>
      <Text style={styles.title} numberOfLines={1}>
        {t(titleKey)}
      </Text>
      <View style={styles.actions}>
        {showUpgrade && (
          <Pressable onPress={onUpgrade} style={({ pressed }) => [styles.upgrade, pressed && styles.pressed]}>
            <Crown size={14} color="#fff" strokeWidth={2.4} />
            <Text style={styles.upgradeText}>{t('common.upgrade')}</Text>
          </Pressable>
        )}
        {!isCompact && <LanguageToggle compact />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: fontSize.lg,
    fontFamily: font.bold,
    color: colors.text,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  upgrade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: colors.modelTest,
  },
  upgradeText: {
    fontSize: 12,
    fontFamily: font.semibold,
    color: '#fff',
  },
  pressed: { opacity: 0.85 },
});
