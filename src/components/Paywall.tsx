import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { Lock, Check } from 'lucide-react-native';
import { AppButton } from './ui/AppButton';
import { ScreenHeader } from './ui/ScreenHeader';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';

type Props = {
  /** Short feature name, e.g. "Vocabulary". */
  title: string;
  /** One-line pitch shown under the headline. */
  blurb: string;
  /** A few value bullets. */
  perks: string[];
  /** Navigate back out of the locked section. */
  onBack: () => void;
  /** Navigate to the pricing screen to purchase access. */
  onSubscribe: () => void;
};

export function Paywall({ title, blurb, perks, onBack, onSubscribe }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={title} onBack={onBack} />
      <View style={styles.body}>
        <View style={styles.lockChip}>
          <Lock size={28} color={colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.h}>Unlock {title}</Text>
        <Text style={styles.sub}>{blurb}</Text>

        <View style={styles.perks}>
          {perks.map((p) => (
            <View key={p} style={styles.perkRow}>
              <Check size={16} color={colors.success} strokeWidth={2.6} />
              <Text style={styles.perkText}>{p}</Text>
            </View>
          ))}
        </View>

        <AppButton label="Unlock full access" onPress={onSubscribe} style={{ marginTop: spacing.lg }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  lockChip: {
    width: 64, height: 64, borderRadius: radius.lg,
    backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  h: { fontSize: fontSize.xl, fontFamily: font.bold, color: colors.text, textAlign: 'center' },
  sub: {
    fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center',
    marginTop: spacing.sm, lineHeight: 22, maxWidth: 320,
  },
  perks: { marginTop: spacing.lg, gap: 10, alignSelf: 'stretch', maxWidth: 360, width: '100%' },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontFamily: font.medium },
});
