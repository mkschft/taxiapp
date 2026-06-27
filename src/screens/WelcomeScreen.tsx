import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Type, Target, ClipboardList, Timer, type LucideIcon } from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../store/authStore';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'> };

const FEATURES: { Icon: LucideIcon; tint: string; title: string; body: string }[] = [
  { Icon: Type, tint: colors.primary, title: '11 vocabulary sets · 84 key words', body: 'Finnish inflections included — the exact words that appear on the exam.' },
  { Icon: Target, tint: colors.success, title: 'Trigger-word engine', body: 'Learn which Finnish words signal correct vs wrong answers, even with weak Finnish.' },
  { Icon: ClipboardList, tint: colors.warning, title: '300+ practice questions', body: 'Across all 4 official exam categories, with full clue-word explanations.' },
  { Icon: Timer, tint: colors.error, title: '5 timed model tests', body: 'Exam-realistic simulation with scoring and review.' },
];

export function WelcomeScreen({ navigation }: Props) {
  const { enterGuest } = useAuth();

  // Local-first preview. Guests can browse "How to use the app" + the Exam
  // Guide; everything else is locked until they create an account.
  const continueAsGuest = async () => {
    await enterGuest();
    navigation.replace('Onboarding');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Top: hero + features — grows to fill space */}
        <View style={styles.top}>
          <View style={styles.hero}>
            <Text style={styles.tagline}>FINNISH TAXI EXAM PREP</Text>
            <Text style={styles.headline}>
              Pass the exam by reading the{' '}
              <Text style={{ color: colors.primary }}>language</Text>
            </Text>
            <Text style={styles.subtitle}>
              Study in English. Spot the Finnish clue words. Pass.
            </Text>
          </View>

          <View style={styles.features}>
            {FEATURES.map(f => (
              <View key={f.title} style={styles.featureRow}>
                <View style={[styles.featureIconChip, { backgroundColor: f.tint + '18' }]}>
                  <f.Icon size={20} color={f.tint} strokeWidth={2.2} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureBody}>{f.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom: auth choices anchored to the bottom */}
        <View style={styles.actions}>
          <AppButton
            label="Create free account"
            onPress={() => navigation.navigate('Signup')}
          />
          <AppButton
            label="Log in"
            variant="secondary"
            onPress={() => navigation.navigate('Login')}
            style={{ marginTop: spacing.sm }}
          />
          <Text style={styles.guestLink} onPress={continueAsGuest}>
            Just looking? Browse a limited preview →
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  top: { flex: 1, justifyContent: 'center' },
  hero: { marginBottom: spacing.lg },
  tagline: {
    fontSize: fontSize.xs, fontFamily: font.bold,
    letterSpacing: 1.2, color: colors.primary,
    textTransform: 'uppercase', marginBottom: spacing.sm,
  },
  headline: { fontSize: fontSize.xl, fontFamily: font.extrabold, color: colors.text, lineHeight: 36, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 24 },
  features: { marginBottom: spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  featureIconChip: {
    width: 40, height: 40, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: fontSize.sm, fontFamily: font.semibold, color: colors.text },
  featureBody: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  actions: {},
  guestLink: {
    fontSize: fontSize.sm, color: colors.textSecondary, fontFamily: font.medium,
    textAlign: 'center', marginTop: spacing.md, paddingVertical: spacing.xs,
  },
});
