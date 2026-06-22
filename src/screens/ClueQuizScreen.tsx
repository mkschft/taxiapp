import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable, ActivityIndicator,
} from 'react-native';
import { MotiView } from 'moti';
import { ChevronLeft, PartyPopper, BookOpenCheck, Check, X } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OptionRow, OptionState } from '../components/question/OptionRow';
import { AppButton } from '../components/ui/AppButton';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import { getClueGroup, getClueQuiz } from '../data/loaders';
import { useProgress } from '../store/progressStore';
import type { ClueQuizQuestion } from '../data/types';
import type { StudyStackParamList } from '../navigation/types';
import { getProblemSet, submitAnswer, completeSession } from '../lib/quizApi';
import type { BackendProblem } from '../lib/quizApi';

type Props = {
  navigation: NativeStackNavigationProp<StudyStackParamList, 'ClueQuiz'>;
  route: RouteProp<StudyStackParamList, 'ClueQuiz'>;
};

const PASS_PCT = 75;

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
  label: string;
};

function fromLocal(q: ClueQuizQuestion): Question {
  return {
    id: q.id,
    prompt: q.prompt,
    options: q.options.map(o => ({ key: o.key, text: o.text })),
    correctKey: q.correct_option,
    correctText: q.correct_answer,
    label: q.direction === 'en_to_fi'
      ? 'WHICH FINNISH CLUE WORD MEANS THIS?'
      : 'WHAT DOES THIS CLUE WORD MEAN?',
  };
}

function fromBackend(p: BackendProblem): Question {
  const options = p.options.map((text, i) => ({
    key: String.fromCharCode(65 + i),
    text,
  }));
  return {
    id: p._id,
    prompt: p.text,
    options,
    correctKey: String.fromCharCode(65 + p.correctAnswer),
    correctText: p.options[p.correctAnswer] ?? '',
    label: 'WHAT DOES THIS CLUE WORD MEAN?',
  };
}

export function ClueQuizScreen({ navigation, route }: Props) {
  const { groupId, sessionId, problemSetId } = route.params;
  const group = getClueGroup(groupId);
  const { dispatch } = useProgress();

  const [loading, setLoading] = useState(!!problemSetId);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState(0);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<Question[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (problemSetId) {
      setLoading(true);
      getProblemSet(problemSetId)
        .then(ps => setQuestions(shuffle(ps.problems.map(fromBackend))))
        .catch(e => setError(e instanceof Error ? e.message : 'Failed to load quiz'))
        .finally(() => setLoading(false));
    } else {
      setQuestions(shuffle(getClueQuiz(groupId).map(fromLocal)));
    }
  }, [problemSetId, groupId, attempt]);

  const q = questions[index];

  const handleSelect = useCallback(async (key: string) => {
    if (answered || !q) return;
    setSelected(key);
    setAnswered(true);
    if (key === q.correctKey) setScore(s => s + 1);
    else setWrong(w => [...w, q]);

    if (sessionId) {
      const optionIndex = q.options.findIndex(o => o.key === key);
      try {
        await submitAnswer(sessionId, q.id, optionIndex);
      } catch (e) {
        console.warn('Failed to submit answer', e);
      }
    }
  }, [answered, q, sessionId]);

  const handleNext = useCallback(async () => {
    if (index < questions.length - 1) {
      setIndex(i => i + 1);
      setSelected(null);
      setAnswered(false);
      return;
    }

    if (!sessionId) {
      dispatch({
        type: 'SAVE_QUIZ_SCORE',
        score: {
          quiz_id: groupId,
          score,
          completed_at: Date.now(),
          wrong_question_ids: wrong.map(w => w.id),
        },
      });
    } else {
      try {
        await completeSession(sessionId);
      } catch (e) {
        console.warn('Failed to complete session', e);
      }
    }

    setDone(true);
  }, [index, questions.length, dispatch, groupId, score, wrong, sessionId]);

  const restart = useCallback(() => {
    setIndex(0); setSelected(null); setAnswered(false);
    setScore(0); setWrong([]); setDone(false);
    setAttempt(a => a + 1);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Quiz" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !group || questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Quiz" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>{error || 'No quiz questions for this group.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= PASS_PCT;
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title={`${group.short} · Result`} onBack={() => navigation.popToTop()} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.banner, passed ? styles.bannerPass : styles.bannerFail]}>
            {passed
              ? <PartyPopper size={32} color={colors.success} strokeWidth={2} />
              : <BookOpenCheck size={32} color={colors.error} strokeWidth={2} />}
            <Text style={[styles.bannerTitle, { color: passed ? colors.success : colors.error }]}>
              {passed ? 'Nice work!' : 'Keep practising'}
            </Text>
            <Text style={styles.bannerSub}>Pass mark {PASS_PCT}% · You scored {pct}%</Text>
          </View>

          <View style={[styles.scoreCircle, { borderColor: passed ? colors.success : colors.error }]}>
            <Text style={[styles.scoreNum, { color: passed ? colors.success : colors.error }]}>{score}</Text>
            <Text style={styles.scoreOf}>out of {questions.length}</Text>
          </View>

          {wrong.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Review ({wrong.length})</Text>
              {wrong.map(w => (
                <View key={w.id} style={styles.wrongItem}>
                  <Text style={styles.wrongWord}>{w.prompt}</Text>
                  <Text style={styles.wrongMeaning}>{w.correctText}</Text>
                </View>
              ))}
            </>
          )}

          <View style={styles.actions}>
            <AppButton label="Try again" onPress={restart} />
            <AppButton
              label="Back to clue words"
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

  const optionStates: Record<string, OptionState> = {};
  q.options.forEach(o => {
    if (!answered) optionStates[o.key] = selected === o.key ? 'selected' : 'idle';
    else if (o.key === q.correctKey) optionStates[o.key] = 'correct';
    else if (o.key === selected) optionStates[o.key] = 'incorrect';
    else optionStates[o.key] = 'idle';
  });
  const progress = ((index + 1) / questions.length) * 100;
  const gotItRight = answered && selected === q.correctKey;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={colors.primary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>Quiz · {group.short}</Text>
        <Text style={styles.qCount}>{index + 1}/{questions.length}</Text>
      </View>

      <ScrollView style={styles.scrollQ} showsVerticalScrollIndicator={false}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.promptCard}>
          <Text style={styles.promptLabel}>{q.label}</Text>
          <Text style={styles.promptWord}>{q.prompt}</Text>
        </View>

        <View style={styles.options}>
          {q.options.map((opt, i) => (
            <OptionRow
              key={opt.key}
              letter={opt.key}
              text={opt.text}
              state={optionStates[opt.key]}
              onPress={() => handleSelect(opt.key)}
              disabled={answered}
              index={i}
            />
          ))}
        </View>

        {answered && (
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 240 }}
            style={[styles.feedback, gotItRight ? styles.feedbackOk : styles.feedbackBad]}
          >
            {gotItRight
              ? <Check size={16} color={colors.success} strokeWidth={3} />
              : <X size={16} color={colors.error} strokeWidth={3} />}
            <Text style={styles.feedbackText}>
              {gotItRight
                ? 'Correct!'
                : <>Correct answer: <Text style={{ fontFamily: font.semibold }}>{q.correctText}</Text></>}
            </Text>
          </MotiView>
        )}

        {answered && (
          <View style={styles.nextBtn}>
            <AppButton
              label={index < questions.length - 1 ? 'Next →' : 'See result'}
              onPress={handleNext}
            />
          </View>
        )}
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
    paddingVertical: spacing.lg, paddingHorizontal: spacing.md, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  promptLabel: { fontSize: fontSize.xs, fontFamily: font.bold, color: colors.textTertiary, letterSpacing: 0.8, marginBottom: 8 },
  promptWord: { fontSize: 24, fontFamily: font.bold, color: colors.text, textAlign: 'center' },
  options: { marginBottom: 12 },
  feedback: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: radius.md, padding: spacing.md, marginBottom: 12, borderWidth: 1.5,
  },
  feedbackOk: { backgroundColor: colors.successTint, borderColor: colors.success },
  feedbackBad: { backgroundColor: colors.errorTint, borderColor: colors.error },
  feedbackText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
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
