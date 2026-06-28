import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Check } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { ProgressRing } from '../components/ui/ProgressRing';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getTopicSection, getTopicLessons, getCategories } from '../data/loaders';
import { useAuth } from '../store/authStore';
import { usePaywall } from '../store/paywallStore';
import { useProblemSetProgress } from '../hooks/useProblemSetProgress';
import { useStartQuiz } from '../hooks/useStartQuiz';
import { formatRelativeDay } from '../lib/time';
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
  const { t } = useTranslation();
  const rootNav = useNavigation<any>();

  // The dashboard hero tiles deep-link straight here, bypassing TopicSections,
  // so the topic_practice paywall must also hold here for signed-in users.
  if (isAuthenticated && !isUnlocked('topic_practice')) {
    return (
      <Paywall
        title="Topic Practice"
        blurb="Drill real exam-style questions one official section at a time, with the real pass thresholds."
        perks={['All 4 official exam sections', 'Every answer explained, with the clue lens', 'Practise at the real per-section pass mark']}
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard' as never))}
        onSubscribe={() => rootNav.navigate('Pricing', { redirectTab: 'Study', redirectScreen: 'TopicSections' })}
      />
    );
  }

  if (!section) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Topic Practice" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>Section not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tint = CAT[section.category_id]?.color ?? colors.primary;

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
      <ScreenHeader title={section.name_en} onBack={() => navigation.goBack()} />

      <View style={styles.subHeader}>
        <Text style={styles.fi}>{section.name_fi}</Text>
        <Text style={styles.caption}>{section.description}</Text>
      </View>

      {!isAuthenticated ? (
        <View style={styles.authPrompt}>
          <AuthPrompt
            title="Sign in to practise this section"
            body="Create a free account to drill real exam-style questions one lesson at a time."
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

          return (
            <TouchableOpacity
              key={lesson.id}
              style={styles.card}
              activeOpacity={0.78}
              onPress={() => startLesson(lesson.question_ids, lesson.name)}
            >
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
                    <Text style={styles.tagText}>
                      {lastPracticed
                        ? `Last practiced ${lastPracticed}`
                        : lp
                          ? `${lp.completed}/${lp.total} done`
                          : `${lesson.question_count} questions`}
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.quizBtn, pressed && { opacity: 0.8 }]}
                hitSlop={6}
                onPress={() =>
                  startQuiz(
                    `topic/${section.category_id}/lessons/${lesson.id}`,
                    'TopicQuiz',
                    { lessonId: lesson.id, sectionId: section.id },
                  )
                }
              >
                <Text style={styles.quizBtnText}>{t('quiz.title')}</Text>
              </Pressable>

              <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2.2} />
            </TouchableOpacity>
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
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    backgroundColor: colors.bg,
    ...shadow.sm,
  },
  iconChip: {
    width: 44, height: 44, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  count: { fontSize: 18, fontFamily: font.bold },
  info: { flex: 1, gap: 2 },
  cardTitle: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text, lineHeight: 21 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: { borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 3 },
  tagText: { fontSize: 11, fontFamily: font.semibold, color: colors.textSecondary },
  ringNeutral: { fontSize: 14, fontFamily: font.bold, color: colors.textTertiary },
  quizBtn: {
    backgroundColor: colors.primaryTint, borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6,
  },
  quizBtnText: { fontSize: 12, fontFamily: font.semibold, color: colors.primary },
  authPrompt: { flex: 1, justifyContent: 'center', padding: spacing.md },
});
