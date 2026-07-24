import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { MODULE_ICONS } from '../theme/icons';
import { IconChip } from '../components/ui/IconChip';
import { ProgressRing } from '../components/ui/ProgressRing';
import { useStartQuiz } from '../hooks/useStartQuiz';
import { useProgress } from '../hooks/useProgress';
import { getSectionProgress } from '../lib/progressLookup';
import { localizedPair } from '../i18n/content';
import {
  getQuestions, getVocabSets, getVocabWordTotal, getClueGroups, getClueWordTotal,
  getTopicSections, getCategories,
} from '../data/loaders';

const TOTAL_QUESTIONS = getQuestions().length;
const VOCAB_SETS = getVocabSets().length;
const VOCAB_WORDS = getVocabWordTotal();
const CLUE_GROUPS = getClueGroups().length;
const CLUE_WORDS = getClueWordTotal();
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

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const { data: progress, loading } = useProgress(true);
  const { startQuiz } = useStartQuiz();

  const totalCompleted = progress?.reduce((sum, item) => sum + item.progress.completed, 0) ?? 0;
  const totalQuestions = progress?.reduce((sum, item) => sum + item.progress.total, 0) ?? 0;
  const completion = totalQuestions === 0 ? 0 : Math.round((totalCompleted / totalQuestions) * 100);

  const openScreen = (screen: string) => navigation.navigate(screen);

  const openModule = (sectionId: string) => navigation.navigate('TopicLessons', { sectionId });

  const startModuleQuiz = (sectionId: string, categoryId: string) =>
    startQuiz(`topic/${categoryId}/module-quiz`, 'ModuleQuiz', { sectionId });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress card */}
        {!loading && totalCompleted === 0 ? (
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
          {WORDS.map(w => (
            <TouchableOpacity
              key={w.screen}
              style={styles.card}
              onPress={() => openScreen(w.screen)}
              activeOpacity={0.78}
            >
              <View style={styles.cardBody}>
                <IconChip Icon={w.Icon} tint={w.tint} />
                <View style={styles.rowInfo}>
                  <Text style={styles.hubTitle}>{t(w.titleKey)}</Text>
                  <Text style={styles.wordsFooterMeta}>{t(w.subKey, w.subParams)}</Text>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2.2} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* MODULES — the 4 official exam categories, inline (was a separate TopicSections hop) */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t('dashboard.studyTitle')}</Text>
        </View>
        <View style={styles.rows}>
          {SECTIONS.map(section => {
            const cat = CAT[section.category_id];
            const tint = cat?.color ?? colors.primary;
            const sectionProgress = getSectionProgress(progress, cat?.name_en ?? '');
            const pctDone = sectionProgress?.percentage ?? 0;
            const { primary, secondary } = localizedPair(section.name_fi, section.name_en, i18n.language);

            return (
              <View key={section.id} style={styles.card}>
                <TouchableOpacity
                  style={styles.cardBody}
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
                    <Text style={styles.hubTitle} numberOfLines={2}>
                      {t('topic.moduleHeader', { n: section.order, name: primary })}
                    </Text>
                    <Text style={styles.moduleFi} numberOfLines={1}>{secondary}</Text>
                  </View>
                  <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2.2} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <View style={styles.cardFooter}>
                  <Text style={styles.footerMeta}>
                    {t('topic.sectionMeta', { questions: section.question_count, topics: section.lesson_count })}
                    {section.pass_correct != null && section.pass_total != null &&
                      ` · ${t('dashboard.passRequirement', {
                        correct: section.pass_correct,
                        total: section.pass_total,
                      })}`}
                  </Text>
                  <TouchableOpacity
                    style={styles.quizPill}
                    onPress={() => startModuleQuiz(section.id, section.category_id)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.quizPillText}>{t('dashboard.takeQuiz')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

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
  card: {
    backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md,
    ...shadow.sm,
  },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.md },
  wordsFooterMeta: { fontSize: 13, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: spacing.sm, padding: spacing.md,
  },
  footerMeta: { flex: 1, fontSize: 14, color: colors.textSecondary },
  quizPill: {
    alignItems: 'center', justifyContent: 'center',
    height: 36, borderRadius: radius.full, paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
  },
  quizPillText: { fontSize: fontSize.sm, fontFamily: font.semibold, color: '#fff' },
  rowInfo: { flex: 1, gap: 2 },
  hubTitle: { fontSize: 14, fontFamily: font.semibold, color: colors.text },
  moduleFi: { fontSize: 12, fontStyle: 'italic', color: colors.textTertiary },
});
