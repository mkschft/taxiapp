import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BookOpen, ClipboardCheck } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { ProgressRing } from '../components/ui/ProgressRing';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getVocabSets, getVocabLesson, getCategories } from '../data/loaders';
import { usePaywall } from '../store/paywallStore';
import { useAuth } from '../store/authStore';
import { useStartQuiz } from '../hooks/useStartQuiz';
import { useProblemSetProgress } from '../hooks/useProblemSetProgress';
import { formatRelativeDay } from '../lib/time';
import { BACKEND_PROBLEM_SET_IDS } from '../data/backendProblemSetIds';
import { Paywall } from '../components/Paywall';
import type { StudyStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<StudyStackParamList, 'VocabSets'>;
};

const CAT_COLOR: Record<string, string> = Object.fromEntries(
  getCategories().map(c => [c.id, c.color]),
);

const SETS = getVocabSets();

export function VocabSetsScreen({ navigation }: Props) {
  const { isUnlocked } = usePaywall();
  const { state: auth } = useAuth();
  const isAuthenticated = !!auth.user;
  const { data: setProgress } = useProblemSetProgress(isAuthenticated);
  const { startQuiz, loading } = useStartQuiz();
  const { t } = useTranslation();
  const rootNav = useNavigation<any>();

  if (!isUnlocked('vocabulary')) {
    return (
      <Paywall
        title={t('vocab.title')}
        blurb={t('vocab.paywallBlurb')}
        perks={[t('vocab.paywallPerkSets', { n: SETS.length }), t('vocab.paywallPerkBilingual'), t('vocab.paywallPerkQuiz')]}
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard' as never))}
        onSubscribe={() => rootNav.navigate('Pricing', { redirectTab: 'Study', redirectScreen: 'VocabSets' })}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={t('vocab.title')} onBack={() => navigation.goBack()} />

      <View style={styles.subHeader}>
        <Text style={styles.caption}>
          {t('vocab.setsCaption', { n: SETS.length })}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {SETS.map(set => {
          const tint = CAT_COLOR[set.category_id ?? ''] ?? colors.primary;
          const words = getVocabLesson(set.id);
          // Per-set progress is keyed by the set's backend problem set. Until BE-3
          // ships, the map is empty → neutral ring with no fake count.
          const problemSetId = BACKEND_PROBLEM_SET_IDS[`vocab/sets/set-${set.set_no}`];
          const lp = problemSetId ? setProgress[problemSetId] : undefined;
          const lastPracticed = formatRelativeDay(lp?.lastPracticedAt);
          const tagText = lastPracticed
            ? t('vocab.lastPracticed', { when: lastPracticed })
            : lp
              ? t('vocab.learnedCount', { completed: lp.completed, total: lp.total })
              : t('common.wordsCount', { n: words.length });

          return (
            <View key={set.id} style={styles.card}>
              <View style={styles.cardTop}>
                <ProgressRing
                  value={lp?.percentage ?? 0}
                  size={48}
                  strokeWidth={5}
                  color={tint}
                  trackColor={colors.surfaceAlt}
                  valueFontSize={12}
                >
                  {lp ? undefined : <Text style={styles.ringNeutral}>–</Text>}
                </ProgressRing>

                <View style={styles.info}>
                  <Text style={styles.setNo}>{t('vocab.setLabel', { n: set.set_no })}</Text>
                  <Text style={styles.cardTitle} numberOfLines={2}>{set.name}</Text>
                  <Text style={styles.cardSub}>
                    {t('vocab.setMeta', { words: set.word_count, quiz: set.question_count })}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.tag, { backgroundColor: colors.surface }]}>
                      <Text style={styles.tagText}>{tagText}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable
                  onPress={() => navigation.navigate('VocabLesson', { setId: set.id, index: 1 })}
                  style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.btnPressed]}
                >
                  <BookOpen size={17} color={colors.text} strokeWidth={2.2} />
                  <Text style={styles.btnOutlineText}>{t('vocab.lesson')}</Text>
                </Pressable>
                {isAuthenticated && (
                  <Pressable
                    disabled={loading}
                    onPress={() => startQuiz(`vocab/sets/${set.id}`, 'VocabQuiz', { setId: set.id })}
                    style={({ pressed }) => [styles.btn, { backgroundColor: tint }, pressed && styles.btnPressed]}
                  >
                    <ClipboardCheck size={17} color="#fff" strokeWidth={2.3} />
                    <Text style={styles.btnFilledText}>{t('quiz.title')}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  subHeader: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  caption: { fontSize: fontSize.sm, color: colors.textSecondary },
  list: { padding: spacing.md, gap: 12 },
  card: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    backgroundColor: colors.bg, gap: 12,
    ...shadow.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  info: { flex: 1, gap: 2 },
  setNo: { fontSize: 10, fontFamily: font.bold, color: colors.textTertiary, letterSpacing: 0.8 },
  cardTitle: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text, lineHeight: 21 },
  cardSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: { borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 3 },
  tagText: { fontSize: 11, fontFamily: font.semibold, color: colors.textSecondary },
  ringNeutral: { fontSize: 14, fontFamily: font.bold, color: colors.textTertiary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 44, borderRadius: radius.sm,
  },
  btnOutline: { borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: colors.bg },
  btnPressed: { transform: [{ scale: 0.97 }], opacity: 0.95 },
  btnOutlineText: { fontSize: fontSize.sm, fontFamily: font.semibold, color: colors.text },
  btnFilledText: { fontSize: fontSize.sm, fontFamily: font.semibold, color: '#fff' },
});
