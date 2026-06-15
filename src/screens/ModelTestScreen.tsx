import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { X, Clock } from 'lucide-react-native';
import { OptionRow, OptionState } from '../components/question/OptionRow';
import { AppButton } from '../components/ui/AppButton';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import { getModelTestById, getQuestionById } from '../data/loaders';
import { useProgress } from '../store/progressStore';
import type { TestStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<TestStackParamList, 'ModelTest'>;
  route: RouteProp<TestStackParamList, 'ModelTest'>;
};

type Choice = 'A' | 'B' | 'C';

export function ModelTestScreen({ navigation, route }: Props) {
  const test = getModelTestById(route.params.testId);
  const { dispatch } = useProgress();

  const [qIndex, setQIndex] = useState(0);
  // Exam mode: answers are collected silently and stay changeable until submit.
  // Nothing is graded or revealed while the test is in progress.
  const [answers, setAnswers] = useState<Record<string, Choice>>({});
  const [secondsLeft, setSecondsLeft] = useState(test ? test.time_minutes * 60 : 0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep the latest answers/flags reachable from the timer + submit without
  // re-creating the interval on every keystroke.
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const submit = useCallback((auto: boolean) => {
    if (!test) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const ids = test.question_ids;
    const finalAnswers = answersRef.current;
    const wrongIds = ids.filter(id => {
      const q = getQuestionById(id);
      return !q || finalAnswers[id] !== q.correct_option;
    });
    const score = ids.length - wrongIds.length;
    const total = ids.length;
    const pct = Math.round((score / total) * 100);
    const timeTaken = test.time_minutes * 60 - secondsLeft;

    // Grade once, at submit — only now do committed answers feed mastery stats.
    ids.forEach(id => {
      const q = getQuestionById(id);
      if (!q) return;
      dispatch({ type: 'ANSWER_QUESTION', id, correct: finalAnswers[id] === q.correct_option });
    });

    dispatch({
      type: 'SAVE_TEST_SCORE',
      score: {
        test_id: test.id,
        score: pct,
        time_taken_seconds: timeTaken,
        completed_at: Date.now(),
        wrong_question_ids: wrongIds,
        passed: pct >= test.pass_mark,
      },
    });
    navigation.replace('Result', {
      mode: 'test',
      label: test.title_en,
      score,
      total,
      wrongIds,
      timeTaken,
    });
  }, [test, secondsLeft, dispatch, navigation]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          submit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // submit is intentionally read via closure-stable refs; recreating the
    // interval on every answer would drift the countdown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!test) return <SafeAreaView style={styles.safe}><Text style={{ padding: 24 }}>Test not found.</Text></SafeAreaView>;

  const ids = test.question_ids;
  const question = getQuestionById(ids[qIndex]);
  if (!question) return null;

  const selected = answers[question.id];
  const isLast = qIndex === ids.length - 1;
  const answeredCount = ids.filter(id => answers[id]).length;

  // During the test an option is only ever 'selected' or 'idle' — never graded.
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
    Alert.alert('Submit test?', detail, [
      { text: 'Keep going' },
      { text: 'Submit', style: 'default', onPress: () => submit(false) },
    ]);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const progress = ((qIndex + 1) / ids.length) * 100;
  const isLowTime = secondsLeft < 300;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => Alert.alert('Quit test?', 'Your progress will be lost.', [
          { text: 'Cancel' },
          { text: 'Quit', style: 'destructive', onPress: () => navigation.goBack() },
        ])} style={styles.backBtn}>
          <X size={22} color={colors.textSecondary} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{test.title_en}</Text>
      </View>

      {/* Timer + progress */}
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
          <Text style={styles.qText}>{question.question.fi}</Text>
        </View>

        {question.options.map(opt => (
          <OptionRow
            key={opt.key}
            letter={opt.key}
            text={opt.fi ?? ''}
            state={optionStates[opt.key]}
            onPress={() => handleSelect(opt.key)}
          />
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Footer nav */}
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
  navBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.md, height: 52,
    borderBottomWidth: 1, borderColor: colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  navTitle: { flex: 1, fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  flagBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: -6 },
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
