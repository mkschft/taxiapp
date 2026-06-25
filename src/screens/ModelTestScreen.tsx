import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { X, Clock } from 'lucide-react-native';
import { OptionRow, OptionState } from '../components/question/OptionRow';
import { QuestionImage } from '../components/question/QuestionImage';
import { QuestionTariff } from '../components/question/QuestionTariff';
import { AppButton } from '../components/ui/AppButton';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import { getModelTestById, getQuestionById } from '../data/loaders';
import type { Question } from '../data/types';
import type { TestStackParamList } from '../navigation/types';
import { getProblemSet, submitAnswer, completeSession } from '../lib/quizApi';
import type { BackendProblem } from '../lib/quizApi';

type Props = {
  navigation: NativeStackNavigationProp<TestStackParamList, 'ModelTest'>;
  route: RouteProp<TestStackParamList, 'ModelTest'>;
};

type Choice = 'A' | 'B' | 'C';

type TestQuestion = {
  id: string;
  text: string;
  options: { key: Choice; fi: string }[];
  correctKey: Choice;
  imageKey?: string;
  category_id?: string;
};

function fromLocal(q: Question): TestQuestion {
  return {
    id: q.id,
    text: q.question.fi ?? '',
    options: q.options
      .filter(o => o.fi)
      .map(o => ({ key: o.key as Choice, fi: o.fi! })),
    correctKey: q.correct_option as Choice,
    imageKey: q.id,
    category_id: q.category_id,
  };
}

function fromBackend(p: BackendProblem): TestQuestion {
  const options = p.options
    .map((text, i) => ({ key: String.fromCharCode(65 + i) as Choice, fi: text }));
  return {
    id: p._id,
    text: p.text,
    options,
    correctKey: String.fromCharCode(65 + p.correctAnswer) as Choice,
    imageKey: p.imageKey,
  };
}

function confirm(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'default', onPress: onConfirm },
  ]);
}

export function ModelTestScreen({ navigation, route }: Props) {
  const { testId, sessionId, problemSetId } = route.params;
  const test = getModelTestById(testId);

  const [loading, setLoading] = useState(!!problemSetId);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);

  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Choice>>({});
  const [secondsLeft, setSecondsLeft] = useState(test ? test.time_minutes * 60 : 0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    if (problemSetId) {
      setLoading(true);
      getProblemSet(problemSetId)
        .then(ps => setQuestions(ps.problems.map(fromBackend)))
        .catch(e => setError(e instanceof Error ? e.message : 'Failed to load test'))
        .finally(() => setLoading(false));
    } else if (test) {
      setQuestions(test.question_ids.map(id => {
        const q = getQuestionById(id);
        return q ? fromLocal(q) : null;
      }).filter(Boolean) as TestQuestion[]);
    }
  }, [problemSetId, testId, test]);

  const submit = useCallback(async (auto: boolean) => {
    if (questions.length === 0) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const ids = questions.map(q => q.id);
    const finalAnswers = answersRef.current;
    const wrongIds = ids.filter(id => {
      const q = questions.find(x => x.id === id);
      return !q || finalAnswers[id] !== q.correctKey;
    });
    const score = ids.length - wrongIds.length;
    const total = ids.length;
    const pct = Math.round((score / total) * 100);
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

    if (sessionId) {
      for (const id of ids) {
        const q = questions.find(x => x.id === id);
        if (!q) continue;
        const optionIndex = q.options.findIndex(o => o.key === finalAnswers[id]);
        if (optionIndex >= 0) {
          try {
            await submitAnswer(sessionId, id, optionIndex);
          } catch (e) {
            console.warn('Failed to submit answer', e);
          }
        }
      }
      try {
        await completeSession(sessionId);
      } catch (e) {
        console.warn('Failed to complete session', e);
      }

      navigation.replace('Result', {
        mode: 'test',
        label: test?.title_en ?? 'Model Test',
        score,
        total,
        wrongIds,
        timeTaken,
        answers: finalAnswers,
        passed: pct >= (test?.pass_mark ?? 76),
      });
      return;
    }

    if (!test) return;

    const passed = pct >= test.pass_mark;

    navigation.replace('Result', {
      mode: 'test',
      label: test.title_en,
      score,
      total,
      wrongIds,
      timeTaken,
      answers: finalAnswers,
      passed,
    });
  }, [questions, navigation, test, sessionId]);

  const submitRef = useRef(submit);
  submitRef.current = submit;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          submitRef.current(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !test || questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Test not found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ids = questions.map(q => q.id);
  const question = questions[qIndex];
  const selected = answers[question.id];
  const isLast = qIndex === ids.length - 1;
  const answeredCount = ids.filter(id => answers[id]).length;

  const optionStates: Record<string, OptionState> = {};
  question.options.forEach(o => {
    optionStates[o.key] = selected === o.key ? 'selected' : 'idle';
  });

  const handleSelect = (key: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: key as Choice }));
  };

  const goNext = () => setQIndex(i => Math.min(ids.length - 1, i + 1));

  const confirmSubmit = () => {
    const unanswered = ids.length - answeredCount;
    const detail = unanswered > 0
      ? `You have ${unanswered} unanswered. Submit anyway?`
      : 'Submit your test for grading?';
    confirm('Submit test?', detail, 'Submit', () => submit(false));
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const progress = ((qIndex + 1) / ids.length) * 100;
  const isLowTime = secondsLeft < 300;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => confirm(
          'Quit test?', 'Your progress will be lost.', 'Quit', () => navigation.goBack(),
        )} style={styles.backBtn}>
          <X size={22} color={colors.textSecondary} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{test.title_en}</Text>
      </View>

      <View style={styles.timerRow}>
        <View style={[styles.timerChip, isLowTime && styles.timerChipLow]}>
          <Clock size={13} color={isLowTime ? colors.error : colors.warning} strokeWidth={2.4} />
          <Text style={[styles.timerText, isLowTime && styles.timerTextLow]}>{mm}:{ss}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.qCount}>{qIndex + 1}/{ids.length}</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.qCategory}>Q{qIndex + 1} OF {ids.length}</Text>
        <View style={styles.questionCard}>
          <Text style={styles.qText}>{question.text}</Text>
          <QuestionImage imageKey={question.imageKey ?? question.id} />
          <QuestionTariff id={question.id} />
        </View>

        {question.options.map(opt => (
          <OptionRow
            key={opt.key}
            letter={opt.key}
            text={opt.fi}
            state={optionStates[opt.key]}
            onPress={() => handleSelect(opt.key)}
          />
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.answeredHint}>{answeredCount}/{ids.length} answered</Text>
        {isLast ? (
          <View style={{ flex: 1 }}>
            <AppButton label="Submit" onPress={confirmSubmit} />
          </View>
        ) : (
          <TouchableOpacity style={[styles.navBtn, styles.navBtnPrimary]} onPress={goNext}>
            <Text style={[styles.navBtnText, styles.navBtnTextPrimary]}>Next →</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
  navBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.md, height: 52,
    borderBottomWidth: 1, borderColor: colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  navTitle: { flex: 1, fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  timerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  timerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.warningTint, borderWidth: 1, borderColor: colors.warning,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  timerChipLow: { backgroundColor: colors.errorTint, borderColor: colors.error },
  timerText: { fontSize: 14, fontFamily: font.bold, color: colors.warning },
  timerTextLow: { color: colors.error },
  progressTrack: {
    flex: 1, height: 6, backgroundColor: colors.surface,
    borderRadius: radius.full, overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
  qCount: { fontSize: fontSize.sm, color: colors.textSecondary, minWidth: 36, textAlign: 'right' },
  scroll: { flex: 1, padding: spacing.md },
  qCategory: { fontSize: fontSize.sm, color: colors.textSecondary, fontFamily: font.semibold, marginBottom: 8 },
  questionCard: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  qText: { fontSize: 15, lineHeight: 24, color: colors.text, fontFamily: font.medium },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderColor: colors.border,
  },
  navBtn: {
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
  },
  navBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  navBtnText: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  navBtnTextPrimary: { color: '#fff' },
  answeredHint: { flex: 1, textAlign: 'left', fontSize: fontSize.xs, color: colors.textSecondary },
});
