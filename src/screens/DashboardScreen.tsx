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
import { getSectionProgress } from '../lib/progressLookup';
import { localizedPair } from '../i18n/content';
import {
  getQuestions, getVocabSets, getVocabWordTotal, getClueGroups, getClueWordTotal,
  getModelTests, getTopicSections, getCategories,
} from '../data/loaders';

const TOTAL_QUESTIONS = getQuestions().length;
const VOCAB_SETS = getVocabSets().length;
const VOCAB_WORDS = getVocabWordTotal();
const CLUE_GROUPS = getClueGroups().length;
const CLUE_WORDS = getClueWordTotal();
const MODEL_TESTS = getModelTests().length;
const SECTIONS = getTopicSections();
const CAT = Object.fromEntries(getCategories().map(c => [c.id, c]));

type WordsCard = {
  Icon: LucideIcon;
  tint: string;
  titleKey: string;
  subKey: string;
  subParams?: Record<string, number>;
  screen: string;
};

// "Learn Important Words" — vocabulary + clue words, one tap from Home.
const WORDS: WordsCard[] = [
  { Icon: MODULE_ICONS.vocabulary, tint: colors.success, titleKey: 'dashboard.vocabulary.title', subKey: 'dashboard.vocabulary.sub', subParams: { groups: VOCAB_SETS, words: VOCAB_WORDS }, screen: 'VocabSets' },
  { Icon: MODULE_ICONS.clueWords, tint: colors.warning, titleKey: 'dashboard.clueWords.title', subKey: 'dashboard.clueWords.sub', subParams: { groups: CLUE_GROUPS, words: CLUE_WORDS }, screen: 'ClueWords' },
];

// Reference destinations — low priority, rendered as lightweight text links.
const LINKS: { titleKey: string; screen: string }[] = [
  { titleKey: 'dashboard.examGuide.title', screen: 'Guide' },
  { titleKey: 'dashboard.howTo', screen: 'HowTo' },
];

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const { state: auth } = useAuth();
  const isGuest = auth.guest && !auth.user;
  const isPaid = auth.user ? hasActivePaidPlan(auth.user.subscription) : false;
  const { data: progress, loading } = useProgress(!isGuest);

  const totalCompleted = progress?.reduce((sum, item) => sum + item.progress.completed, 0) ?? 0;
  const totalQuestions = progress?.reduce((sum, item) => sum + item.progress.total, 0) ?? 0;
  const completion = totalQuestions === 0 ? 0 : Math.round((totalCompleted / totalQuestions) * 100);

  const openScreen = (screen: string, mode?: 'practice' | 'quiz') => {
    if (isGuestLocked(screen, isGuest)) navigation.navigate('Signup');
    else navigation.navigate(screen, mode ? { mode } : undefined);
  };

  const openModule = (sectionId: string, mode?: 'practice' | 'quiz') => {
    if (isGuestLocked('TopicLessons', isGuest)) navigation.navigate('Signup');
    else navigation.navigate('TopicLessons', { sectionId, mode });
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

        {/* WORDS — vocabulary + clue words */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t('dashboard.wordsTitle')}</Text>
        </View>
        <View style={styles.rows}>
          {WORDS.map(w => {
            const locked = isGuestLocked(w.screen, isGuest);
            return (
              <View key={w.screen} style={styles.moduleCard}>
                <TouchableOpacity
                  style={styles.moduleInfo}
                  onPress={() => openScreen(w.screen, 'practice')}
                  activeOpacity={0.78}
                >
                  <IconChip Icon={w.Icon} tint={w.tint} />
                  <View style={styles.rowInfo}>
                    <Text style={styles.hubTitle}>{t(w.titleKey)}</Text>
                    <Text style={styles.hubSub}>{t(w.subKey, w.subParams)}</Text>
                  </View>
                  {(locked || !isPaid) ? (
                    <Badge type={locked ? 'locked' : 'paid'} />
                  ) : (
                    <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2.2} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quizButton}
                  onPress={() => openScreen(w.screen, 'quiz')}
                  activeOpacity={0.78}
                >
                  <Text style={[styles.quizButtonText, { color: w.tint }]}>
                    {t('dashboard.takeQuiz')}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* MODULES — the 4 official exam categories, inline (was a separate TopicSections hop) */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t('dashboard.studyTitle')}</Text>
        </View>
        <View style={styles.rows}>
          {SECTIONS.map(section => {
            const locked = isGuestLocked('TopicLessons', isGuest);
            const cat = CAT[section.category_id];
            const tint = cat?.color ?? colors.primary;
            const sectionProgress = getSectionProgress(progress, cat?.name_en ?? '');
            const pctDone = sectionProgress?.percentage ?? 0;
            const { primary, secondary } = localizedPair(section.name_fi, section.name_en, i18n.language);

            return (
              <View key={section.id} style={styles.moduleCard}>
                <TouchableOpacity
                  style={styles.moduleInfo}
                  onPress={() => openModule(section.id)}
                  activeOpacity={0.78}
                >
                  <ProgressRing
                    value={pctDone}
                    size={48}
                    strokeWidth={5}
                    color={tint}
                    trackColor={colors.surfaceAlt}
                    valueFontSize={12}
                  />
                  <View style={styles.rowInfo}>
                    {section.pass_correct != null && section.pass_total != null && (
                      <Text style={styles.moduleKicker}>
                        {t('dashboard.moduleKicker', {
                          n: section.order,
                          correct: section.pass_correct,
                          total: section.pass_total,
                        })}
                      </Text>
                    )}
                    <Text style={styles.hubTitle} numberOfLines={2}>{primary}</Text>
                    <Text style={styles.moduleFi} numberOfLines={1}>{secondary}</Text>
                    <Text style={styles.hubSub}>
                      {t('topic.sectionMeta', { questions: section.question_count, topics: section.lesson_count })}
                    </Text>
                  </View>
                  {(locked || !isPaid) ? (
                    <Badge type={locked ? 'locked' : 'paid'} />
                  ) : (
                    <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2.2} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quizButton}
                  onPress={() => openModule(section.id, 'quiz')}
                  activeOpacity={0.78}
                >
                  <Text style={[styles.quizButtonText, { color: tint }]}>
                    {t('dashboard.quizOnModule', { n: section.order })}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Mock Exams — quick link into the Test tab */}
        <View style={styles.links}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Test', { screen: 'TestHome' })}
            activeOpacity={0.6}
          >
            <Text style={styles.linkText}>{t('dashboard.modelTests.title')} ({MODEL_TESTS})</Text>
            <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2.2} />
          </TouchableOpacity>
          {LINKS.map(link => (
            <TouchableOpacity
              key={link.screen}
              style={styles.linkRow}
              onPress={() => openScreen(link.screen)}
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

  rows: { paddingHorizontal: spacing.md, gap: 12, marginBottom: spacing.sm },
  moduleCard: {
    backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    gap: spacing.sm,
    ...shadow.sm,
  },
  moduleInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  quizButton: {
    alignItems: 'center', justifyContent: 'center',
    height: 40, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.borderStrong,
  },
  quizButtonText: { fontSize: fontSize.sm, fontFamily: font.semibold },
  rowInfo: { flex: 1, gap: 2 },
  moduleKicker: { fontSize: 11, fontFamily: font.semibold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3 },
  hubTitle: { fontSize: 14, fontFamily: font.semibold, color: colors.text },
  hubSub: { fontSize: 12, color: colors.textSecondary, fontFamily: font.regular },
  moduleFi: { fontSize: 12, fontStyle: 'italic', color: colors.textTertiary },

  links: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: 2 },
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
