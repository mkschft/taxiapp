import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BookOpen, ClipboardCheck } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { ProgressRing } from '../components/ui/ProgressRing';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getTopicSection, getTopicLessons, getCategories } from '../data/loaders';
import { useAuth } from '../store/authStore';
import { usePaywall } from '../store/paywallStore';
import { useProblemSetProgress } from '../hooks/useProblemSetProgress';
import { useStartQuiz } from '../hooks/useStartQuiz';
import { formatRelativeDay } from '../lib/time';
import { localizedPair } from '../i18n/content';
import { BACKEND_PROBLEM_SET_IDS } from '../data/backendProblemSetIds';
import { AuthPrompt } from '../components/AuthPrompt';
import { Paywall } from '../components/Paywall';
import type { StudyStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<StudyStackParamList, 'TopicLessons'>;
  route: RouteProp<StudyStackParamList, 'TopicLessons'>;
};

const CAT = Object.fromEntries(getCategories().map(c => [c.id, c]));

export function TopicLessonsScreen({ navigation, route }: Props) {
  const { sectionId } = route.params;
  const section = getTopicSection(sectionId);
  const lessons = getTopicLessons(sectionId);
  const { state: authState } = useAuth();
  const isAuthenticated = !!authState.user;
  const { isUnlocked } = usePaywall();
  const { data: setProgress } = useProblemSetProgress(isAuthenticated);
  const { startQuiz } = useStartQuiz();
  const { t, i18n } = useTranslation();
  const rootNav = useNavigation<any>();

  // The dashboard hero tiles deep-link straight here, bypassing TopicSections,
  // so the topic_practice paywall must also hold here for signed-in users.
  if (isAuthenticated && !isUnlocked('topic_practice')) {
    return (
      <Paywall
        title={t('topic.title')}
        blurb={t('topic.paywallBlurb')}
        perks={[t('topic.paywallPerkAll'), t('topic.paywallPerkExplained'), t('topic.paywallPerkPassMark')]}
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard' as never))}
        onSubscribe={() => rootNav.navigate('Pricing', { redirectTab: 'Study', redirectScreen: 'TopicSections' })}
      />
    );
  }

  if (!section) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title={t('topic.title')} onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t('topic.sectionNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tint = CAT[section.category_id]?.color ?? colors.primary;
  const { primary, secondary } = localizedPair(section.name_fi, section.name_en, i18n.language);

  const startLesson = (qIds: string[], label: string) => {
    if (qIds.length === 0) return;
    navigation.navigate('Practice', {
      questionId: qIds[0],
      queue: qIds,
      queueIndex: 0,
      sourceLabel: label,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={primary} onBack={() => navigation.goBack()} />

      <View style={styles.subHeader}>
        <Text style={styles.fi}>{secondary}</Text>
        <Text style={styles.caption}>{section.description}</Text>
      </View>

      {!isAuthenticated ? (
        <View style={styles.authPrompt}>
          <AuthPrompt
            title={t('topic.authTitle')}
            body={t('topic.authBody')}
          />
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {lessons.map(lesson => {
          // Per-lesson progress is keyed by the lesson's backend problem set. Until
          // BE-3 ships, the map is empty → render a neutral ring with no fake count.
          const problemSetId =
            BACKEND_PROBLEM_SET_IDS[`topic/${section.category_id}/lessons/${lesson.id}`];
          const lp = problemSetId ? setProgress[problemSetId] : undefined;
          const lastPracticed = formatRelativeDay(lp?.lastPracticedAt);
          const tagText = lastPracticed
            ? t('topic.lastPracticed', { when: lastPracticed })
            : lp
              ? t('topic.doneCount', { completed: lp.completed, total: lp.total })
              : t('common.questionsCount', { n: lesson.question_count });

          return (
            <View key={lesson.id} style={styles.card}>
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
                  <Text style={styles.cardTitle} numberOfLines={2}>{lesson.name}</Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.tag, { backgroundColor: colors.surface }]}>
                      <Text style={styles.tagText}>{tagText}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable
                  onPress={() => startLesson(lesson.question_ids, lesson.name)}
                  style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.btnPressed]}
                >
                  <BookOpen size={17} color={colors.text} strokeWidth={2.2} />
                  <Text style={styles.btnOutlineText}>{t('topic.practice')}</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    startQuiz(
                      `topic/${section.category_id}/lessons/${lesson.id}`,
                      'TopicQuiz',
                      { lessonId: lesson.id, sectionId: section.id },
                    )
                  }
                  style={({ pressed }) => [styles.btn, { backgroundColor: tint }, pressed && styles.btnPressed]}
                >
                  <ClipboardCheck size={17} color="#fff" strokeWidth={2.3} />
                  <Text style={styles.btnFilledText}>{t('quiz.title')}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary },
  subHeader: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, gap: 3 },
  fi: { fontSize: 13, fontStyle: 'italic', color: colors.textSecondary },
  caption: { fontSize: fontSize.sm, color: colors.textTertiary, lineHeight: 18 },
  list: { padding: spacing.md, gap: 12 },
  card: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    backgroundColor: colors.bg, gap: 12,
    ...shadow.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  info: { flex: 1, gap: 2 },
  cardTitle: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text, lineHeight: 21 },
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
  authPrompt: { flex: 1, justifyContent: 'center', padding: spacing.md },
});
