import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { UserPlus, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { MODULE_ICONS } from '../theme/icons';
import { IconChip } from '../components/ui/IconChip';
import { ProgressRing } from '../components/ui/ProgressRing';
import { Badge } from '../components/ui/Badge';
import { AppButton } from '../components/ui/AppButton';
import { useAuth, hasActivePaidPlan } from '../store/authStore';
import { isGuestLocked } from '../lib/access';
import { useProgress } from '../hooks/useProgress';
import {
  getQuestions, getVocabSets, getVocabWordTotal, getClueGroups, getClueWordTotal,
  getModelTests,
} from '../data/loaders';

const TOTAL_QUESTIONS = getQuestions().length;
const VOCAB_SETS = getVocabSets().length;
const VOCAB_WORDS = getVocabWordTotal();
const CLUE_GROUPS = getClueGroups().length;
const CLUE_WORDS = getClueWordTotal();
const MODEL_TESTS = getModelTests().length;

type CoreModule = {
  Icon: LucideIcon;
  tint: string;
  titleKey: string;
  subKey: string;
  subParams?: Record<string, number>;
  screen: string;
  stack?: string;
  paid: boolean;
};

// The dashboard surfaces only LEARNING MODES (one consistent axis). Exam
// categories live one level down, inside Topic Practice (TopicSections).
const CORE: CoreModule[] = [
  { Icon: MODULE_ICONS.topicPractice, tint: colors.error, titleKey: 'dashboard.topicPractice.title', subKey: 'dashboard.topicPractice.sub', screen: 'TopicSections', stack: 'Study', paid: true },
  { Icon: MODULE_ICONS.vocabulary, tint: colors.success, titleKey: 'dashboard.vocabulary.title', subKey: 'dashboard.vocabulary.sub', subParams: { sets: VOCAB_SETS, words: VOCAB_WORDS }, screen: 'VocabSets', stack: 'Study', paid: true },
  { Icon: MODULE_ICONS.clueWords, tint: colors.warning, titleKey: 'dashboard.clueWords.title', subKey: 'dashboard.clueWords.sub', subParams: { groups: CLUE_GROUPS, words: CLUE_WORDS }, screen: 'ClueWords', stack: 'Study', paid: true },
  { Icon: MODULE_ICONS.modelTests, tint: colors.modelTest, titleKey: 'dashboard.modelTests.title', subKey: 'dashboard.modelTests.sub', subParams: { n: MODEL_TESTS }, screen: 'TestHome', stack: 'Test', paid: true },
];

// Reference destinations — low priority, rendered as lightweight text links.
const LINKS: { titleKey: string; screen: string; stack?: string }[] = [
  { titleKey: 'dashboard.examGuide.title', screen: 'Guide', stack: 'Study' },
  { titleKey: 'dashboard.howTo', screen: 'HowTo', stack: 'Study' },
];

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { state: auth } = useAuth();
  const isGuest = auth.guest && !auth.user;
  const isPaid = auth.user ? hasActivePaidPlan(auth.user.subscription) : false;
  const { data: progress, loading } = useProgress(!isGuest);

  const totalCompleted = progress?.reduce((sum, item) => sum + item.progress.completed, 0) ?? 0;
  const totalQuestions = progress?.reduce((sum, item) => sum + item.progress.total, 0) ?? 0;
  const completion = totalQuestions === 0 ? 0 : Math.round((totalCompleted / totalQuestions) * 100);

  const openHub = (screen: string, stack?: string) => {
    if (isGuestLocked(screen, isGuest)) navigation.navigate('Signup');
    else if (stack) navigation.navigate(stack, { screen, params: {} });
    else navigation.navigate(screen);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('dashboard.greeting')}</Text>
            <Text style={styles.caption}>{t('dashboard.tagline')}</Text>
          </View>
        </View>

        {/* Progress card */}
        {isGuest ? (
          <View style={styles.guestCard}>
            <View style={styles.guestIcon}>
              <UserPlus size={20} color={colors.primary} strokeWidth={2.1} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guestTitle}>{t('dashboard.guest.title')}</Text>
              <Text style={styles.guestBody}>{t('dashboard.guest.body')}</Text>
            </View>
            <AppButton
              label={t('dashboard.guest.cta')}
              onPress={() => navigation.navigate('Signup')}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        ) : !loading && totalCompleted === 0 ? (
          // Fresh signed-in user: an encouraging start card instead of a flat 0%.
          <View style={styles.progressCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.progressLabel}>{t('dashboard.ready')}</Text>
              <Text style={styles.startTitle}>
                {t('dashboard.startTitle', { n: totalQuestions || TOTAL_QUESTIONS })}
              </Text>
              <Text style={styles.progressSub}>{t('dashboard.pickTopic')}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.progressCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.progressLabel}>{t('dashboard.overallProgress')}</Text>
              <Text style={styles.progressSub}>
                {loading ? t('common.loading') : t('dashboard.practiced', { completed: totalCompleted, total: totalQuestions })}
              </Text>
            </View>
            <ProgressRing value={completion} size={80} strokeWidth={7} color="#fff" />
          </View>
        )}

        {/* CORE — learning modes, as full-width rows (app-wide pattern) */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t('dashboard.studyTitle')}</Text>
        </View>
        <View style={styles.rows}>
          {CORE.map(m => {
            const locked = isGuestLocked(m.screen, isGuest);
            return (
              <TouchableOpacity
                key={m.screen}
                style={styles.hubRow}
                onPress={() => openHub(m.screen, m.stack)}
                activeOpacity={0.78}
              >
                <IconChip Icon={m.Icon} tint={m.tint} />
                <View style={styles.rowInfo}>
                  <Text style={styles.hubTitle}>{t(m.titleKey)}</Text>
                  <Text style={styles.hubSub}>{t(m.subKey, m.subParams)}</Text>
                </View>
                {(locked || !isPaid) && <Badge type={locked ? 'locked' : m.paid ? 'paid' : 'free'} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* LINKS — reference destinations */}
        <View style={styles.links}>
          {LINKS.map(link => (
            <TouchableOpacity
              key={link.screen}
              style={styles.linkRow}
              onPress={() => openHub(link.screen, link.stack)}
              activeOpacity={0.6}
            >
              <Text style={styles.linkText}>{t(link.titleKey)}</Text>
              <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2.2} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  greeting: { fontSize: fontSize.lg, fontFamily: font.bold, color: colors.text },
  caption: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },

  progressCard: {
    margin: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    ...shadow.md,
  },
  progressLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  startTitle: { fontSize: fontSize.md, fontFamily: font.bold, color: '#fff', marginBottom: 4, lineHeight: 22 },
  progressSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },

  sectionHead: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.md, fontFamily: font.bold, color: colors.text },

  // Core learning modes — full-width rows (matches Study tab + lesson cards)
  rows: { paddingHorizontal: spacing.md, gap: 12 },
  hubRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    ...shadow.sm,
  },
  rowInfo: { flex: 1 },
  hubTitle: { fontSize: 14, fontFamily: font.semibold, color: colors.text },
  hubSub: { fontSize: 12, color: colors.textSecondary, fontFamily: font.regular },

  links: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, gap: 2 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  linkText: { fontSize: fontSize.sm, fontFamily: font.medium, color: colors.textSecondary },

  guestCard: {
    margin: spacing.md, backgroundColor: colors.primaryTint,
    borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md, gap: 8,
  },
  guestIcon: {
    width: 34, height: 34, borderRadius: radius.sm,
    backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  guestTitle: { fontSize: fontSize.md, fontFamily: font.bold, color: colors.text },
  guestBody: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
});
