import React, { memo, useEffect } from 'react';
import { Pressable, Text, View, StyleSheet, Platform } from 'react-native';
import { MotiView } from 'moti';
import { Check, X, ShieldAlert } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, fontSize, spacing, font } from '../../theme/tokens';
import { ClueHighlight } from './ClueHighlight';
import type { ClueAnnotation } from '../../data/types';
import type { OptionVerdict } from '../../utils/clueParser';

export type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect';

type Props = {
  letter: string;
  text: string;
  state: OptionState;
  onPress: () => void;
  disabled?: boolean;
  index?: number;
  /** Clue annotations scoped to THIS option (drives highlight + chips). */
  optionClues?: ClueAnnotation[];
  /** Verdict badge — only shown after the answer is revealed. */
  verdict?: OptionVerdict;
  /** When true, render clue highlights, gloss chips and the verdict badge. */
  reveal?: boolean;
};

export const OptionRow = memo(({
  letter, text, state, onPress, disabled, index = 0,
  optionClues, verdict, reveal = false,
}: Props) => {
  const s = styles;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (state === 'correct') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (state === 'incorrect') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [state]);

  const borderColor =
    state === 'correct' ? colors.success :
    state === 'incorrect' ? colors.error :
    state === 'selected' ? colors.primary : colors.border;

  const bg =
    state === 'correct' ? colors.successTint :
    state === 'incorrect' ? colors.errorTint :
    state === 'selected' ? colors.primaryTint : colors.bg;

  const showClues = reveal && !!optionClues?.length;

  return (
    <MotiView
      // Only the slide is animated — opacity stays 1 so options are never
      // invisible if the entry animation doesn't run (e.g. cold mount on web).
      from={{ translateY: 8 }}
      animate={{ translateY: 0 }}
      transition={{ type: 'timing', duration: 260, delay: index * 60 }}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          s.container,
          { borderColor, backgroundColor: bg },
          pressed && !disabled && s.pressed,
        ]}
      >
        <View style={s.headRow}>
          <View style={[
            s.letter,
            state === 'correct' && s.letterCorrect,
            state === 'incorrect' && s.letterIncorrect,
            state === 'selected' && s.letterSelected,
          ]}>
            {state === 'correct' ? (
              <Check size={16} color="#fff" strokeWidth={3} />
            ) : state === 'incorrect' ? (
              <X size={16} color="#fff" strokeWidth={3} />
            ) : (
              <Text style={[s.letterText, state === 'selected' && { color: colors.primary }]}>{letter}</Text>
            )}
          </View>

          {showClues ? (
            <ClueHighlight
              text={text}
              clueAnnotations={optionClues!}
              showHighlights
              style={s.text}
            />
          ) : (
            <Text style={s.text}>{text}</Text>
          )}

          {reveal && verdict && (
            <View style={[s.badge, verdict === 'good' ? s.badgeGood : s.badgeTrap]}>
              {verdict === 'good'
                ? <Check size={11} color={colors.success} strokeWidth={3} />
                : <ShieldAlert size={11} color={colors.error} strokeWidth={2.6} />}
              <Text style={[s.badgeText, verdict === 'good' ? s.badgeTextGood : s.badgeTextTrap]}>
                {verdict === 'good' ? 'GOOD CLUE' : 'TRAP CLUE'}
              </Text>
            </View>
          )}
        </View>

        {/* Gloss chips — clue phrase = English meaning, colour-coded */}
        {showClues && (
          <View style={s.chipRow}>
            {optionClues!.map((c, i) => {
              const pos = c.clue_type === 'pcw';
              const neg = c.clue_type === 'ncw';
              return (
                <View
                  key={i}
                  style={[
                    s.chip,
                    pos && s.chipPos,
                    neg && s.chipNeg,
                    !pos && !neg && s.chipNeutral,
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      pos && s.chipTextPos,
                      neg && s.chipTextNeg,
                    ]}
                    numberOfLines={2}
                  >
                    <Text style={s.chipFi}>{c.text_fi}</Text>
                    {c.meaning_en ? ` = ${c.meaning_en}` : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Pressable>
    </MotiView>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  letter: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  letterSelected: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  letterCorrect: { backgroundColor: colors.success, borderColor: colors.success },
  letterIncorrect: { backgroundColor: colors.error, borderColor: colors.error },
  letterText: { fontSize: fontSize.sm, fontFamily: font.bold, color: colors.text },
  text: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.text, paddingTop: 3, fontFamily: font.regular },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full,
    flexShrink: 0, marginTop: 2,
  },
  badgeGood: { backgroundColor: colors.successTint, borderWidth: 1, borderColor: colors.success },
  badgeTrap: { backgroundColor: colors.errorTint, borderWidth: 1, borderColor: colors.error },
  badgeText: { fontSize: 9.5, fontFamily: font.bold, letterSpacing: 0.3 },
  badgeTextGood: { color: colors.success },
  badgeTextTrap: { color: colors.error },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, marginLeft: 40 },
  chip: {
    borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4,
    maxWidth: '100%',
  },
  chipPos: { backgroundColor: colors.successTint },
  chipNeg: { backgroundColor: colors.errorTint },
  chipNeutral: { backgroundColor: colors.surfaceAlt },
  chipText: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary },
  chipTextPos: { color: colors.success },
  chipTextNeg: { color: colors.error },
  chipFi: { fontFamily: font.semibold, fontStyle: 'italic' },
});
