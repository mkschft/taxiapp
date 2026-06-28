import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, fontSize } from '../../theme/tokens';

type Props = {
  label?: string;
  value: number; // 0–100
  color?: string;
  showPct?: boolean;
  /** Custom right-aligned label (e.g. "32/44 mastered"); replaces the %. */
  rightLabel?: string;
};

export function ProgressBar({ label, value, color = colors.primary, showPct = true, rightLabel }: Props) {
  const clamped = Math.min(100, Math.max(0, value));
  const right = rightLabel ?? (showPct ? `${clamped}%` : null);
  return (
    <View style={styles.wrap}>
      {(label || right) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {right && <Text style={styles.pct}>{right}</Text>}
        </View>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: fontSize.sm, color: colors.text },
  pct: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  track: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fill: { height: '100%', borderRadius: radius.full },
});
