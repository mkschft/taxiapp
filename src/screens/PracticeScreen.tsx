import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  Pressable,
} from 'react-native';
import { MotiView } from 'moti';
import { BookOpen, Search, ChevronLeft } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OptionRow, OptionState } from '../components/question/OptionRow';
import { ClueHighlight } from '../components/question/ClueHighlight';
import { QuestionImage } from '../components/question/QuestionImage';
import { AppButton } from '../components/ui/AppButton';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, fontSize, radius, font } from '../theme/tokens';
import { cluesForScope, focusWords, optionVerdict } from '../utils/clueParser';
import { getQuestionById } from '../data/loaders';
import { useProgress } from '../store/progressStore';
import type { StudyStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<StudyStackParamList, 'Practice'>;
  route: RouteProp<StudyStackParamList, 'Practice'>;
};

export function PracticeScreen({ navigation, route }: Props) {
  const { questionId, queue = [], queueIndex = 0, sourceLabel = 'Practice', review = false, answers } = route.params;
  const question = getQuestionById(questionId);
  const { dispatch } = useProgress();

  // Finnish is always shown (it's the exam language); Simple Meaning toggles
  // the English translation in/out as a secondary line beneath it.
  const [showMeaning, setShowMeaning] = useState(false);
  // In review mode the answer is already committed: pre-seed the user's original
  // pick and treat it as answered so the correct answer is revealed immediately.
  const [selected, setSelected] = useState<string | null>(review ? (answers?.[questionId] ?? null) : null);
  const [showLens, setShowLens] = useState(false);
  const [answered, setAnswered] = useState(review);

  const clueAnnotations = question?.clue_annotations ?? [];
  // Focus words = neutral comprehension aid, safe to show before answering.
  const focus = focusWords(clueAnnotations);

  const toggleMeaning = useCallback(() => {
    setShowMeaning(m => !m);
  }, []);

  const handleSelect = useCallback((key: string) => {
    if (answered || !question) return;
    setSelected(key);
    setAnswered(true);
    const correct = key === question.correct_option;
    dispatch({ type: 'ANSWER_QUESTION', id: question.id, correct });
  }, [answered, question, dispatch]);

  const handleNext = useCallback(() => {
    if (!question) return;
    const nextIdx = queueIndex + 1;
    if (queue.length > 0 && nextIdx < queue.length) {
      navigation.replace('Practice', {
        questionId: queue[nextIdx],
        queue,
        queueIndex: nextIdx,
        sourceLabel,
        review,
        answers,
      });
    } else if (review) {
      // Reviewing wrong answers — return to the result page when done.
      navigation.goBack();
    } else if (queue.length > 0) {
      const correct = answered && selected === question.correct_option ? 1 : 0;
      navigation.replace('Result', {
        mode: 'quiz',
        label: sourceLabel,
        score: correct,
        total: queue.length,
        wrongIds: selected !== question.correct_option ? [question.id] : [],
      });
    } else {
      navigation.goBack();
    }
  }, [question, queue, queueIndex, navigation, sourceLabel, answered, selected, review, answers]);

  if (!question) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Practice" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center' }}>
            No question found. Please go back and try again.
          </Text>
          <AppButton label="Go back" onPress={() => navigation.goBack()} style={{ marginTop: 16, width: 160 }} />
        </View>
      </SafeAreaView>
    );
  }

  const optionStates: Record<string, OptionState> = {};
  question.options.forEach(o => {
    if (!answered) {
      optionStates[o.key] = selected === o.key ? 'selected' : 'idle';
    } else {
      if (o.key === question.correct_option) optionStates[o.key] = 'correct';
      else if (o.key === selected) optionStates[o.key] = 'incorrect';
      else optionStates[o.key] = 'idle';
    }
  });

  const qText = question.question.fi ?? '';
  const qTextEn = question.question.en ?? '';
  const progress = queue.length > 0 ? ((queueIndex + 1) / queue.length) * 100 : 0;

  // The Clue Lens is the single control for the clue layer. Answering gives the
  // result + explanation; the word-level clue detail (highlights, chips, GOOD/
  // TRAP badges) stays opt-in via the lens so it's progressive, not a dump.
  const highlightQuestion = showLens;
  const revealClues = answered && showLens;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={colors.primary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.navTitle}>{sourceLabel}</Text>
        {queue.length > 0 && (
          <Text style={styles.qCount}>{queueIndex + 1}/{queue.length}</Text>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {queue.length > 0 && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        {/* Question card */}
        <View style={styles.questionCard}>
          <Text style={styles.qLabel}>KYSYMYS</Text>
          <ClueHighlight
            text={qText}
            clueAnnotations={focus}
            showHighlights={highlightQuestion}
            style={styles.qText}
          />
          {showMeaning && !!qTextEn && (
            <Text style={styles.qTextEn}>{qTextEn}</Text>
          )}
          <QuestionImage id={question.id} />
        </View>

        {/* Action bar: Simple Meaning + Clue Lens */}
        <View style={styles.actionBar}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, showMeaning && styles.actionBtnActive, pressed && styles.actionPressed]}
            onPress={toggleMeaning}
          >
            <BookOpen size={16} color={showMeaning ? colors.primary : colors.textSecondary} strokeWidth={2.2} />
            <Text style={[styles.actionLabel, showMeaning && styles.actionLabelActive]} numberOfLines={1}>
              Simple Meaning
            </Text>
            <View style={[styles.langPill, showMeaning && styles.langPillActive]}>
              <Text style={styles.langPillText}>EN</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionBtn, showLens && styles.actionBtnHint, pressed && styles.actionPressed]}
            onPress={() => setShowLens(h => !h)}
          >
            <Search size={16} color={showLens ? colors.warning : colors.textSecondary} strokeWidth={2.2} />
            <Text style={[styles.actionLabel, showLens && styles.actionLabelHint]} numberOfLines={1}>
              Clue Lens
            </Text>
          </Pressable>
        </View>

        {/* Focus words box — neutral comprehension aid (no answer leak) */}
        {showLens && focus.length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 220 }}
            style={styles.focusPanel}
          >
            <Text style={styles.focusTitle}>FOCUS WORDS IN THIS QUESTION</Text>
            <View style={styles.focusGrid}>
              {focus.map((ann, idx) => (
                <View key={idx} style={styles.focusChip}>
                  <Text style={styles.focusFi}>{ann.text_fi}</Text>
                  {ann.meaning_en ? <Text style={styles.focusEn}>{ann.meaning_en}</Text> : null}
                </View>
              ))}
            </View>
          </MotiView>
        )}

        {/* Options */}
        <View style={styles.options}>
          {question.options.map((opt, i) => {
            const optionClues = cluesForScope(clueAnnotations, opt.key);
            const verdict = optionVerdict(optionClues, opt.key === question.correct_option);
            return (
              <OptionRow
                key={opt.key}
                letter={opt.key}
                text={opt.fi ?? ''}
                translation={showMeaning ? (opt.en ?? '') : undefined}
                state={optionStates[opt.key]}
                onPress={() => handleSelect(opt.key)}
                disabled={answered}
                index={i}
                optionClues={optionClues}
                verdict={verdict}
                reveal={revealClues}
              />
            );
          })}
        </View>

        {/* Explanation */}
        {answered && !!question.explanation_en && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.explanation}
          >
            <Text style={styles.expText}>{question.explanation_en}</Text>
          </MotiView>
        )}

        <View style={styles.nextBtn}>
          {answered && (
            <AppButton
              label={queue.length > 0 && queueIndex < queue.length - 1 ? 'Next question →' : 'Finish'}
              onPress={handleNext}
            />
          )}
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
  qCount: { fontSize: fontSize.sm, color: colors.textSecondary, fontFamily: font.medium },
  scroll: { flex: 1, padding: spacing.md },
  progressWrap: { marginBottom: 12 },
  progressTrack: { height: 6, backgroundColor: colors.surface, borderRadius: radius.full, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
  questionCard: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  qLabel: { fontSize: fontSize.xs, fontFamily: font.bold, color: colors.textTertiary, marginBottom: 6, letterSpacing: 0.8 },
  qText: { fontSize: 15, lineHeight: 24, color: colors.text, fontFamily: font.medium },
  qTextEn: {
    fontSize: 13, lineHeight: 20, color: colors.textSecondary, marginTop: 8,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border,
  },
  actionBar: { flexDirection: 'row', gap: spacing.sm, marginBottom: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 42, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  actionPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  actionBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  actionBtnHint: { borderColor: colors.warning, backgroundColor: colors.warningTint },
  actionLabel: { fontSize: 13, fontFamily: font.semibold, color: colors.textSecondary },
  actionLabelActive: { color: colors.primary },
  actionLabelHint: { color: colors.warning },
  langPill: {
    backgroundColor: colors.textTertiary, borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  langPillActive: { backgroundColor: colors.primary },
  langPillText: { fontSize: 10, fontFamily: font.bold, color: '#fff', letterSpacing: 0.4 },
  focusPanel: {
    backgroundColor: colors.warningTint, borderWidth: 1.5, borderColor: colors.warning,
    borderRadius: radius.md, padding: spacing.md, marginBottom: 12,
  },
  focusTitle: { fontSize: fontSize.xs, fontFamily: font.bold, color: colors.warning, letterSpacing: 0.6, marginBottom: 10 },
  focusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  focusChip: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.warning + '55',
    borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 7,
  },
  focusFi: { fontSize: 13, fontFamily: font.semibold, color: colors.text },
  focusEn: { fontSize: 11.5, color: colors.textSecondary, marginTop: 1 },
  options: { marginBottom: 12 },
  explanation: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md, padding: spacing.md, marginBottom: 12,
  },
  expText: { fontSize: 13, lineHeight: 20, color: colors.text },
  nextBtn: { marginTop: 4 },
});
