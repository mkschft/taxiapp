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

export function ModelTestScreen({ navigation, route }: Props) {
  const test = getModelTestById(route.params.testId);
  const { dispatch } = useProgress();

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(test ? test.time_minutes * 60 : 0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          handleSubmitTest();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleSubmitTest = useCallback(() => {
    if (!test) return;
    clearInterval(timerRef.current!);
    const total = test.question_ids.length;
    const timeTaken = test.time_minutes * 60 - secondsLeft;
    dispatch({
      type: 'SAVE_TEST_SCORE',
      score: {
        test_id: test.id,
        score: Math.round((score / total) * 100),
        time_taken_seconds: timeTaken,
        completed_at: Date.now(),
        wrong_question_ids: wrongIds,
        passed: (score / total) * 100 >= test.pass_mark,
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
  }, [test, score, wrongIds, secondsLeft, dispatch, navigation]);

  if (!test) return <SafeAreaView style={styles.safe}><Text style={{ padding: 24 }}>Test not found.</Text></SafeAreaView>;

  const question = getQuestionById(test.question_ids[qIndex]);
  if (!question) return null;

  const optionStates: Record<string, OptionState> = {};
  question.options.forEach(o => {
    if (!answered) optionStates[o.key] = selected === o.key ? 'selected' : 'idle';
    else {
      if (o.key === question.correct_option) optionStates[o.key] = 'correct';
      else if (o.key === selected) optionStates[o.key] = 'incorrect';
      else optionStates[o.key] = 'idle';
    }
  });

  const handleSelect = (key: string) => {
    if (answered) return;
    setSelected(key);
    setAnswered(true);
    const correct = key === question.correct_option;
    if (correct) setScore(s => s + 1);
    else setWrongIds(ids => [...ids, question.id]);
    dispatch({ type: 'ANSWER_QUESTION', id: question.id, correct });
  };

  const handleNext = () => {
    if (qIndex < test.question_ids.length - 1) {
      setQIndex(i => i + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      handleSubmitTest();
    }
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const progress = ((qIndex + 1) / test.question_ids.length) * 100;
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
        <Text style={styles.navTitle}>{test.title_en}</Text>
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
        <Text style={styles.qCount}>{qIndex + 1}/{test.question_ids.length}</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.qCategory}>Q{qIndex + 1} OF {test.question_ids.length}</Text>
        <View style={styles.questionCard}>
          <Text style={styles.qText}>{question.question.fi}</Text>
          <Text style={styles.qEn}>{question.question.en}</Text>
        </View>

        {question.options.map(opt => (
          <OptionRow
            key={opt.key}
            letter={opt.key}
            text={opt.fi ?? ''}
            state={optionStates[opt.key]}
            onPress={() => handleSelect(opt.key)}
            disabled={answered}
          />
        ))}

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={answered ? handleNext : handleNext}
          >
            <Text style={styles.skipText}>{answered ? '' : 'Skip'}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <AppButton
              label={qIndex < test.question_ids.length - 1 ? 'Next →' : 'Submit'}
              onPress={handleNext}
            />
          </View>
        </View>

        {/* Running score */}
        <View style={styles.scoreRow}>
          {[
            { val: score, label: 'Correct', color: colors.success },
            { val: wrongIds.length, label: 'Wrong', color: colors.error },
            { val: test.question_ids.length - score - wrongIds.length, label: 'Remaining', color: colors.textSecondary },
          ].map(s => (
            <View key={s.label} style={styles.scoreChip}>
              <Text style={[styles.scoreVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.scoreLbl}>{s.label}</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
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
  qCategory: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 8, fontFamily: font.semibold },
  questionCard: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  qText: { fontSize: 15, lineHeight: 24, color: colors.text, marginBottom: 8, fontFamily: font.medium },
  qEn: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, fontStyle: 'italic' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: spacing.sm, marginBottom: spacing.md },
  skipBtn: { justifyContent: 'center', paddingHorizontal: spacing.md },
  skipText: { fontSize: fontSize.md, color: colors.textSecondary, fontFamily: font.semibold },
  scoreRow: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.md,
    justifyContent: 'space-around',
  },
  scoreChip: { alignItems: 'center' },
  scoreVal: { fontSize: 20, fontFamily: font.bold },
  scoreLbl: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
});
