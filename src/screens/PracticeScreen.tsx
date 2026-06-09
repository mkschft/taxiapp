import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  Pressable,
} from 'react-native';
import { MotiView } from 'moti';
import { Languages, Lightbulb, ChevronLeft, Check, AlertTriangle } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OptionRow, OptionState } from '../components/question/OptionRow';
import { ClueHighlight } from '../components/question/ClueHighlight';
import { AppButton } from '../components/ui/AppButton';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, fontSize, fontWeight, radius, font } from '../theme/tokens';
import { getQuestionById } from '../data/loaders';
import { useProgress } from '../store/progressStore';
import type { StudyStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<StudyStackParamList, 'Practice'>;
  route: RouteProp<StudyStackParamList, 'Practice'>;
};

type Lang = 'fi' | 'en';

export function PracticeScreen({ navigation, route }: Props) {
  const { questionId, queue = [], queueIndex = 0, sourceLabel = 'Practice' } = route.params;
  const question = getQuestionById(questionId);
  const { dispatch } = useProgress();

  const [lang, setLang] = useState<Lang>('fi');
  const [selected, setSelected] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showClues, setShowClues] = useState(false);
  const [answered, setAnswered] = useState(false);

  const clueAnnotations = question?.clue_annotations ?? [];

  const cycleLang = useCallback(() => {
    setLang(l => l === 'fi' ? 'en' : 'fi');
  }, []);

  const handleSelect = useCallback((key: string) => {
    if (answered || !question) return;
    setSelected(key);
    setAnswered(true);
    setShowClues(true);
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
      });
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
  }, [question, queue, queueIndex, navigation, sourceLabel, answered, selected]);

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

  const qText = lang === 'fi' ? (question.question.fi ?? '') : (question.question.en ?? question.question.fi ?? '');
  const progress = queue.length > 0 ? ((queueIndex + 1) / queue.length) * 100 : 0;

  // Clues for the hint panel: pcw (positive) and ncw (negative) only
  const hintClues = clueAnnotations.filter(a => a.clue_type === 'pcw' || a.clue_type === 'ncw');

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
          <Text style={styles.qLabel}>{lang === 'fi' ? 'KYSYMYS' : 'QUESTION'}</Text>
          <ClueHighlight
            text={qText}
            clueAnnotations={clueAnnotations}
            showHighlights={showClues}
            style={styles.qText}
          />
        </View>

        {/* Action bar: Translate + Hint */}
        <View style={styles.actionBar}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, lang === 'en' && styles.actionBtnActive, pressed && styles.actionPressed]}
            onPress={cycleLang}
          >
            <Languages size={16} color={lang === 'en' ? colors.primary : colors.textSecondary} strokeWidth={2.2} />
            <Text style={[styles.actionLabel, lang === 'en' && styles.actionLabelActive]}>
              Translate
            </Text>
            <View style={[styles.langPill, lang === 'en' && styles.langPillActive]}>
              <Text style={styles.langPillText}>{lang.toUpperCase()}</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionBtn, showHint && styles.actionBtnHint, pressed && styles.actionPressed]}
            onPress={() => setShowHint(h => !h)}
          >
            <Lightbulb size={16} color={showHint ? colors.warning : colors.textSecondary} strokeWidth={2.2} />
            <Text style={[styles.actionLabel, showHint && styles.actionLabelHint]}>
              Hint
            </Text>
          </Pressable>
        </View>

        {/* Hint panel — shows pcw/ncw clue words */}
        {showHint && hintClues.length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 220 }}
            style={styles.hintPanel}
          >
            <View style={styles.hintHeaderRow}>
              <Lightbulb size={14} color={colors.warning} strokeWidth={2.4} />
              <Text style={styles.hintTitle}>CLUE WORD HINT</Text>
            </View>
            {hintClues.map((ann, idx) => (
              <View key={idx} style={styles.hintRow}>
                <View style={[styles.hintDot, ann.clue_type === 'pcw' ? styles.dotPos : styles.dotNeg]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.hintPhrase}>
                    <Text style={{ fontStyle: 'italic' }}>{ann.text_fi}</Text>
                    {ann.meaning_en ? ` (${ann.meaning_en})` : ''}
                  </Text>
                  <Text style={styles.hintEffect}>
                    {ann.clue_type === 'pcw' ? 'Points toward the correct answer' : 'Points away from correct answer'}
                  </Text>
                </View>
              </View>
            ))}
          </MotiView>
        )}

        {/* Options */}
        <View style={styles.options}>
          {question.options.map((opt, i) => (
            <OptionRow
              key={opt.key}
              letter={opt.key}
              text={lang === 'fi' ? (opt.fi ?? '') : (opt.en ?? opt.fi ?? '')}
              state={optionStates[opt.key]}
              onPress={() => handleSelect(opt.key)}
              disabled={answered}
              index={i}
            />
          ))}
        </View>

        {/* Explanation */}
        {answered && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.explanation}
          >
            <Text style={styles.expText}>{question.explanation_en}</Text>
            {hintClues.length > 0 && (
              <View style={styles.cluePills}>
                <Text style={styles.expSubLabel}>Clue words in this question:</Text>
                <View style={styles.pillRow}>
                  {hintClues.map((ann, idx) => {
                    const isPos = ann.clue_type === 'pcw';
                    return (
                      <View
                        key={idx}
                        style={[styles.pill, isPos ? styles.pillPos : styles.pillNeg]}
                      >
                        {isPos
                          ? <Check size={12} color={colors.success} strokeWidth={3} />
                          : <AlertTriangle size={11} color={colors.error} strokeWidth={2.6} />}
                        <Text style={[styles.pillText, isPos ? styles.pillTextPos : styles.pillTextNeg]}>
                          {ann.text_fi}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
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
  hintPanel: {
    backgroundColor: colors.warningTint, borderWidth: 1.5, borderColor: colors.warning,
    borderRadius: radius.md, padding: spacing.md, marginBottom: 12,
  },
  hintHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  hintTitle: { fontSize: fontSize.xs, fontFamily: font.bold, color: colors.warning, letterSpacing: 0.6 },
  hintRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 6 },
  hintDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  dotPos: { backgroundColor: colors.success },
  dotNeg: { backgroundColor: colors.error },
  hintPhrase: { fontSize: 13, color: colors.text, lineHeight: 18 },
  hintEffect: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  options: { marginBottom: 12 },
  explanation: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md, padding: spacing.md, marginBottom: 12,
  },
  expText: { fontSize: 13, lineHeight: 20, color: colors.text },
  cluePills: { marginTop: spacing.sm },
  expSubLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  pillPos: { backgroundColor: colors.successTint, borderWidth: 1, borderColor: colors.success },
  pillNeg: { backgroundColor: colors.errorTint, borderWidth: 1, borderColor: colors.error },
  pillText: { fontSize: 11, fontWeight: fontWeight.semibold },
  pillTextPos: { color: colors.success },
  pillTextNeg: { color: colors.error },
  nextBtn: { marginTop: 4 },
});
