import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Lock, Check } from 'lucide-react-native';
import { AppButton } from './ui/AppButton';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';

// Shown to guests when they open a section that requires an account. Guests can
// only browse "How to use the app" and the Exam Guide; everything else routes
// here. Distinct from Paywall (which gates paid features for signed-in users):
// there is no "skip" — the only way forward is to create a free account.
type Props = {
  /** Section name, e.g. "Model Tests". */
  title: string;
  /** One-line pitch. */
  blurb: string;
  /** A few value bullets. */
  perks: string[];
};

export function GuestGate({ title, blurb, perks }: Props) {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.lockChip}>
          <Lock size={28} color={colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.h}>Create a free account</Text>
        <Text style={styles.sub}>{blurb}</Text>

        <View style={styles.perks}>
          {perks.map((p) => (
            <View key={p} style={styles.perkRow}>
              <Check size={16} color={colors.success} strokeWidth={2.6} />
              <Text style={styles.perkText}>{p}</Text>
            </View>
          ))}
        </View>

        <AppButton
          label="Create free account"
          onPress={() => navigation.navigate('Signup')}
          style={{ marginTop: spacing.lg, alignSelf: 'stretch', maxWidth: 360 }}
        />
        <AppButton
          label="I already have an account"
          variant="secondary"
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: spacing.sm, alignSelf: 'stretch', maxWidth: 360 }}
        />
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
