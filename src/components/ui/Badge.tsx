import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, fontSize } from '../../theme/tokens';

type Props = { type: 'free' | 'paid' | 'locked' };

const VARIANTS = {
  free: { box: 'free', text: 'freeText', label: 'components.badgeFree' },
  paid: { box: 'paid', text: 'paidText', label: 'components.badgePaid' },
  locked: { box: 'locked', text: 'lockedText', label: 'components.badgeLocked' },
} as const;

export function Badge({ type }: Props) {
  const { t } = useTranslation();
  const v = VARIANTS[type];
  return (
    <View style={[styles.base, styles[v.box]]}>
      <Text style={[styles.text, styles[v.text]]}>{t(v.label)}</Text>
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
  locked: { backgroundColor: colors.surfaceAlt, borderColor: colors.borderStrong },
  text: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.4 },
  freeText: { color: colors.success },
  paidText: { color: colors.primary },
  lockedText: { color: colors.textSecondary },
});
