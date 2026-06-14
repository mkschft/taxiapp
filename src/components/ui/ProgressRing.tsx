import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fontSize } from '../../theme/tokens';

type Props = {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  /** Track (unfilled) ring color. */
  trackColor?: string;
  /** Override the centre %-value font size (for compact rings). */
  valueFontSize?: number;
  /** Custom centre content; replaces the default %/label (e.g. a check icon). */
  children?: React.ReactNode;
};

export function ProgressRing({
  value,
  size = 100,
  strokeWidth = 8,
  color = colors.primary,
  label,
  trackColor = colors.surface,
  valueFontSize,
  children,
}: Props) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const dash = (pct / 100) * circ;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        {dash > 0 && (
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={color} strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            rotation={-90}
            originX={size / 2}
            originY={size / 2}
          />
        )}
      </Svg>
      <View style={styles.center}>
        {children ?? (
          <>
            <Text style={[styles.pct, { color }, valueFontSize ? { fontSize: valueFontSize } : null]}>
              {pct}%
            </Text>
            {label && <Text style={styles.label}>{label}</Text>}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  pct: { fontSize: fontSize.lg, fontWeight: '700' },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
});
