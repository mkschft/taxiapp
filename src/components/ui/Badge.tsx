import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, fontSize } from '../../theme/tokens';

type Props = { type: 'free' | 'paid' };

export function Badge({ type }: Props) {
  const isFree = type === 'free';
  return (
    <View style={[styles.base, isFree ? styles.free : styles.paid]}>
      <Text style={[styles.text, isFree ? styles.freeText : styles.paidText]}>
        {isFree ? 'FREE' : 'PAID'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  free: { backgroundColor: colors.successTint, borderColor: colors.success },
  paid: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  text: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.4 },
  freeText: { color: colors.success },
  paidText: { color: colors.primary },
});
