import React, { memo, useEffect } from 'react';
import { Pressable, Text, View, StyleSheet, Platform } from 'react-native';
import { MotiView } from 'moti';
import { Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, fontSize, spacing, font } from '../../theme/tokens';

export type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect';

type Props = {
  letter: string;
  text: string;
  state: OptionState;
  onPress: () => void;
  disabled?: boolean;
  index?: number;
};

export const OptionRow = memo(({ letter, text, state, onPress, disabled, index = 0 }: Props) => {
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
        <Text style={s.text}>{text}</Text>
      </Pressable>
    </MotiView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
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
});
