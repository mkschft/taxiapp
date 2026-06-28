import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable, ActivityIndicator,
} from 'react-native';
import { ChevronLeft, PartyPopper, BookOpenCheck } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { OptionRow, OptionState } from '../components/question/OptionRow';
import { AppButton } from '../components/ui/AppButton';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import { getTopicLesson, getTopicSection, getQuestionById } from '../data/loaders';
import type { Question as BankQuestion } from '../data/types';
import type { StudyStackParamList } from '../navigation/types';
import { getProblemSet, submitAnswer, completeSession } from '../lib/quizApi';
import type { BackendProblem } from '../lib/quizApi';

type Props = {
  navigation: NativeStackNavigationProp<StudyStackParamList, 'TopicQuiz'>;
  route: RouteProp<StudyStackParamList, 'TopicQuiz'>;
};

const DEFAULT_PASS_PCT = 70;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Question = {
  id: string;
  prompt: string;
  options: { key: string; text: string }[];
  correctKey: string;
  correctText: string;
};

function fromLocal(q: BankQuestion): Question {
  return {
    id: q.id,
    prompt: q.question.fi ?? '',
    options: q.options.map(o => ({ key: o.key, text: o.fi ?? '' })),
    correctKey: q.correct_option ?? 'A',
    correctText: q.options.find(o => o.key === q.correct_option)?.fi ?? '',
  };
}

function fromBackend(p: BackendProblem): Question {
  const options = p.options.map((text, i) => ({ key: String.fromCharCode(65 + i), text }));
  return {
    id: p._id,
    prompt: p.text,
    options,
    correctKey: String.fromCharCode(65 + p.correctAnswer),
    correctText: p.options[p.correctAnswer] ?? '',
  };
}

export function TopicQuizScreen({ navigation, route }: Props) {
  const { lessonId, sectionId, sessionId, problemSetId } = route.params;
  const { t } = useTranslation();
  const lesson = getTopicLesson(lessonId);
  const section = getTopicSection(sectionId);

  const passPct =
    section?.pass_correct && section?.pass_total
      ? Math.round((section.pass_correct / section.pass_total) * 100)
      : DEFAULT_PASS_PCT;

  const [loading, setLoading] = useState(!!problemSetId);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState(0);

  const [index, setIndex] = useState(0);
  // Deferred feedback: we record the chosen key per question but never reveal
  // correctness until the end (exam-like).
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    if (problemSetId) {
      setLoading(true);
      getProblemSet(problemSetId)
        .then(ps => { if (active) setQuestions(shuffle(ps.problems.map(fromBackend))); })
        .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Failed to load quiz'); })
        .finally(() => { if (active) setLoading(false); });
    } else {
      const local = (lesson?.question_ids ?? [])
        .map(getQuestionById)
        .filter((q): q is BankQuestion => !!q)
        .map(fromLocal);
      setQuestions(shuffle(local));
    }
    return () => { active = false; };
  }, [problemSetId, lessonId, lesson, attempt]);

  const q = questions[index];

  const handleSelect = useCallback(
    async (key: string) => {
      if (!q) return;
      setAnswers(prev => ({ ...prev, [q.id]: key }));
      if (sessionId) {
        const optionIndex = q.options.findIndex(o => o.key === key);
        try {
          await submitAnswer(sessionId, q.id, optionIndex);
        } catch (e) {
          console.warn('Failed to submit answer', e);
        }
      }
    },
    [q, sessionId],
  );

  const handleNext = useCallback(async () => {
    if (index < questions.length - 1) {
      setIndex(i => i + 1);
      return;
    }
    if (sessionId) {
      try {
        await completeSession(sessionId);
      } catch (e) {
        console.warn('Failed to complete session', e);
      }
    }
    setDone(true);
  }, [index, questions.length, sessionId]);

  const restart = useCallback(() => {
    setIndex(0);
    setAnswers({});
    setDone(false);
    setAttempt(a => a + 1);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title={t('quiz.title')} onBack={() => navigation.goBack()} />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (error || !lesson || questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title={t('quiz.title')} onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>{error || t('quiz.empty')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    const score = questions.reduce((s, qq) => s + (answers[qq.id] === qq.correctKey ? 1 : 0), 0);
    const wrong = questions.filter(qq => answers[qq.id] !== qq.correctKey);
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= passPct;
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title={`${lesson.name} · ${t('quiz.title')}`} onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.banner, passed ? styles.bannerPass : styles.bannerFail]}>
            {passed
              ? <PartyPopper size={32} color={colors.success} strokeWidth={2} />
              : <BookOpenCheck size={32} color={colors.error} strokeWidth={2} />}
            <Text style={[styles.bannerTitle, { color: passed ? colors.success : colors.error }]}>
              {passed ? t('quiz.passTitle') : t('quiz.failTitle')}
            </Text>
            <Text style={styles.bannerSub}>{t('quiz.passMark', { pct: passPct, score: pct })}</Text>
          </View>

          <View style={[styles.scoreCircle, { borderColor: passed ? colors.success : colors.error }]}>
            <Text style={[styles.scoreNum, { color: passed ? colors.success : colors.error }]}>{score}</Text>
            <Text style={styles.scoreOf}>{t('quiz.scoreOf', { total: questions.length })}</Text>
          </View>

          {wrong.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>{t('quiz.review', { count: wrong.length })}</Text>
              {wrong.map(w => (
                <View key={w.id} style={styles.wrongItem}>
                  <Text style={styles.wrongWord}>{w.prompt}</Text>
                  <Text style={styles.wrongMeaning}>{t('quiz.correctAnswer')}: {w.correctText}</Text>
                </View>
              ))}
            </>
          )}

          <View style={styles.actions}>
            <AppButton label={t('quiz.tryAgain')} onPress={restart} />
            <AppButton
              label={t('quiz.back')}
              variant="secondary"
              onPress={() => navigation.goBack()}
              style={{ marginTop: spacing.sm }}
            />
          </View>
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const selected = answers[q.id] ?? null;
  const optionStates: Record<string, OptionState> = {};
  q.options.forEach(o => {
    optionStates[o.key] = selected === o.key ? 'selected' : 'idle';
  });
  const progress = ((index + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={colors.primary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>{lesson.name}</Text>
        <Text style={styles.qCount}>{index + 1}/{questions.length}</Text>
      </View>

      <ScrollView style={styles.scrollQ} showsVerticalScrollIndicator={false}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.promptCard}>
          <Text style={styles.promptLabel}>KYSYMYS</Text>
          <Text style={styles.promptText}>{q.prompt}</Text>
        </View>

        <View style={styles.options}>
          {q.options.map((opt, i) => (
            <OptionRow
              key={opt.key}
              letter={opt.key}
              text={opt.text}
              state={optionStates[opt.key]}
              onPress={() => handleSelect(opt.key)}
              index={i}
            />
          ))}
        </View>

        <View style={styles.nextBtn}>
          <AppButton
            label={index < questions.length - 1 ? t('quiz.next') : t('quiz.seeResult')}
            onPress={handleNext}
            disabled={!selected}
          />
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
  navBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.md, height: 52,
    borderBottomWidth: 1, borderColor: colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  navTitle: { flex: 1, fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  qCount: { fontSize: fontSize.sm, color: colors.textSecondary, fontFamily: font.medium },
  scrollQ: { flex: 1, padding: spacing.md },
  progressTrack: {
    height: 6, backgroundColor: colors.surface, borderRadius: radius.full,
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
  promptCard: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  promptLabel: { fontSize: fontSize.xs, fontFamily: font.bold, color: colors.textTertiary, letterSpacing: 0.8, marginBottom: 6 },
  promptText: { fontSize: 15, lineHeight: 24, color: colors.text, fontFamily: font.medium },
  options: { marginBottom: 12 },
  nextBtn: { marginTop: 4 },
  scroll: { padding: spacing.md },
  banner: {
    borderWidth: 1.5, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.lg, gap: 6,
  },
  bannerPass: { backgroundColor: colors.successTint, borderColor: colors.success },
  bannerFail: { backgroundColor: colors.errorTint, borderColor: colors.error },
  bannerTitle: { fontSize: fontSize.lg, fontFamily: font.bold },
  bannerSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  scoreCircle: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 8,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: spacing.lg,
  },
  scoreNum: { fontSize: 32, fontFamily: font.bold },
  scoreOf: { fontSize: fontSize.sm, color: colors.textSecondary },
  sectionHeader: { fontSize: fontSize.sm, fontFamily: font.bold, color: colors.text, marginBottom: spacing.sm },
  wrongItem: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  wrongWord: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  wrongMeaning: { fontSize: fontSize.sm, color: colors.success, marginTop: 2 },
  actions: { marginTop: spacing.md },
});
