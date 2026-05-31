import React, { memo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, radius, fontSize, spacing } from '../../theme/tokens';

export type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect';

type Props = {
  letter: string;
  text: string;
  state: OptionState;
  onPress: () => void;
  disabled?: boolean;
};

export const OptionRow = memo(({ letter, text, state, onPress, disabled }: Props) => {
  const s = styles;
  const containerStyle = [
    s.container,
    state === 'selected' && s.selected,
    state === 'correct' && s.correct,
    state === 'incorrect' && s.incorrect,
  ];
  const letterStyle = [
    s.letter,
    state === 'correct' && s.letterCorrect,
    state === 'incorrect' && s.letterIncorrect,
    state === 'selected' && s.letterSelected,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={containerStyle}
      activeOpacity={0.7}
    >
      <View style={letterStyle}>
        <Text style={s.letterText}>
          {state === 'correct' ? '✓' : state === 'incorrect' ? '✗' : letter}
        </Text>
      </View>
      <Text style={s.text}>{text}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  selected: { borderColor: colors.primary, backgroundColor: '#F0F5FF' },
  correct: { borderColor: colors.success, backgroundColor: colors.successTint },
  incorrect: { borderColor: colors.error, backgroundColor: colors.errorTint },
  letter: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  letterSelected: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  letterCorrect: { backgroundColor: colors.success, borderColor: colors.success },
  letterIncorrect: { backgroundColor: colors.error, borderColor: colors.error },
  letterText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  text: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.text, paddingTop: 2 },
});
