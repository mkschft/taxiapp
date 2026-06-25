import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Share, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { Gift } from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';

const STEPS = [
  { n: 1, text: (code: string) => `Share your code **${code}** with a friend preparing for the taxi exam.` },
  { n: 2, text: () => 'They sign up and enter your code. They get **7 days free** on their subscription.' },
  { n: 3, text: () => 'You automatically get **7 days added** to your account. No limit on referrals.' },
];

function BoldText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <Text style={styles.stepText}>
      {parts.map((p, i) =>
        i % 2 === 1 ? <Text key={i} style={{ fontFamily: font.bold }}>{p}</Text> : p
      )}
    </Text>
  );
}

export function ReferralScreen() {
  const navigation = useNavigation<any>();
  const code = 'TAXI7';
  const [copied, setCopied] = useState(false);

  // Real referral counts come from the backend (`referrals` table) once wired —
  // see BACKEND.md. Until then show honest zeros rather than mock numbers.
  const friendsJoined = 0;
  const daysEarned = friendsJoined * 7;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    await Share.share({
      message: `Use my code ${code} to get 7 days free on TaxiPilot — the Finnish taxi exam prep app! https://taxipilot.fi`,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Refer a friend" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconChip}>
            <Gift size={36} color={colors.success} strokeWidth={1.9} />
          </View>
          <Text style={styles.heroTitle}>Give 7 days free.{'\n'}Get 7 days free.</Text>
          <Text style={styles.heroSub}>
            Share your code with a friend who needs the Finnish taxi exam.
            When they sign up, you both get a free week added.
          </Text>
        </View>

        {/* Code card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
          <Text style={styles.code}>{code}</Text>
          <AppButton
            label={copied ? '✓ Copied!' : '📋 Copy code'}
            onPress={handleCopy}
            variant={copied ? 'success' : 'primary'}
            style={{ marginTop: spacing.sm }}
          />
        </View>

        {copied && (
          <View style={styles.copyConfirm}>
            <Text style={styles.copyConfirmText}>✓ Code copied to clipboard!</Text>
          </View>
        )}

        {/* Share */}
        <View style={styles.shareSection}>
          <AppButton label="Share your code" onPress={handleShare} />
        </View>

        {/* How it works */}
        <Text style={styles.sectionHeader}>HOW IT WORKS</Text>
        <View style={styles.steps}>
          {STEPS.map(s => (
            <View key={s.n} style={styles.stepRow}>
              <View style={[styles.stepNum, s.n === 3 && { backgroundColor: colors.success }]}>
                <Text style={styles.stepNumText}>{s.n}</Text>
              </View>
              <BoldText text={s.text(code)} />
            </View>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>YOUR REFERRALS</Text>
          <View style={styles.statsRow}>
            {[
              { val: friendsJoined, label: 'Friends joined', color: colors.primary },
              { val: daysEarned, label: 'Free days earned', color: colors.success },
              { val: '∞', label: 'No limit', color: colors.text },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={styles.statsDivider} />}
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                  <Text style={styles.statLbl}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md },
  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  heroIconChip: {
    width: 72, height: 72, borderRadius: radius.lg,
    backgroundColor: colors.successTint,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  heroTitle: { fontSize: fontSize.lg, fontFamily: font.bold, textAlign: 'center', marginBottom: spacing.sm, lineHeight: 30, color: colors.text },
  heroSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  codeCard: {
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    padding: spacing.lg, alignItems: 'center' as const, marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  codeLabel: { fontSize: fontSize.xs, fontFamily: font.bold, letterSpacing: 1, color: colors.textSecondary, marginBottom: 8 },
  code: { fontSize: 36, fontFamily: font.extrabold, letterSpacing: 6, color: colors.primary },
  copyConfirm: {
    backgroundColor: colors.successTint, borderWidth: 1, borderColor: colors.success,
    borderRadius: radius.md, padding: 10, marginBottom: spacing.sm, alignItems: 'center',
  },
  copyConfirmText: { fontSize: 13, fontFamily: font.semibold, color: colors.success },
  shareSection: { marginBottom: spacing.lg },
  sectionHeader: {
    fontSize: fontSize.xs, fontFamily: font.bold, letterSpacing: 1,
    color: colors.textSecondary, paddingBottom: spacing.sm,
  },
  steps: { marginBottom: spacing.lg },
  stepRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 14 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumText: { fontSize: 13, fontFamily: font.bold, color: '#fff' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 22, color: colors.text, paddingTop: 3 },
  statsCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
  },
  statsTitle: { fontSize: fontSize.xs, fontFamily: font.bold, letterSpacing: 0.6, color: colors.textSecondary, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statsDivider: { width: 1, height: 36, backgroundColor: colors.border },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 24, fontFamily: font.bold },
  statLbl: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
});
