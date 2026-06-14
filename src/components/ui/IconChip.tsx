import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { radius } from '../../theme/tokens';
import { iconStroke } from '../../theme/icons';

/**
 * Duotone-style icon chip — a tinted rounded tile with a slightly stronger
 * tinted disc behind the glyph. The two concentric tints give depth (a
 * "duotone" feel) using only the icon's own colour, with no extra dependency.
 */
type Props = {
  Icon: LucideIcon;
  tint: string;
  size?: number;
  iconSize?: number;
  style?: ViewStyle;
};

export function IconChip({ Icon, tint, size = 44, iconSize = 22, style }: Props) {
  return (
    <View
      style={[
        styles.chip,
        { width: size, height: size, backgroundColor: tint + '14' },
        style,
      ]}
    >
      <View style={[styles.disc, { backgroundColor: tint + '24' }]} />
      <Icon size={iconSize} color={tint} strokeWidth={iconStroke} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  disc: {
    position: 'absolute',
    width: '64%',
    height: '64%',
    borderRadius: radius.full,
  },
});
