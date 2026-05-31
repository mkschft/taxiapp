import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton } from '../components/ui/AppButton';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Home'> };

const FEATURES = [
  { icon: '🔤', title: '137 key vocabulary words', body: 'Finnish inflections included — the exact words that appear on the exam.' },
  { icon: '🎯', title: 'Trigger-word engine', body: 'Learn which Finnish words signal correct vs wrong answers, even with weak Finnish.' },
  { icon: '📝', title: '300+ practice questions', body: 'Across all 4 official exam categories, with full clue-word explanations.' },
  { icon: '⏱️', title: '2 timed model tests', body: 'Exam-realistic simulation with scoring and review.' },
];

export function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Top: hero + features + trust badges — grows to fill space */}
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
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureBody}>{f.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.trust}>
            <View style={styles.trustRow}>
              <Text style={styles.trustChip}>🇫🇮 Finnish</Text>
              <Text style={styles.trustChip}>🇬🇧 English</Text>
              <Text style={styles.trustChip}>Traficom aligned</Text>
            </View>
          </View>
        </View>

        {/* Bottom: CTAs always anchored to the bottom */}
        <View style={styles.actions}>
          <AppButton
            label="Try free preview →"
            onPress={() => navigation.navigate('App')}
          />
          <AppButton
            label="Sign up / Log in"
            variant="secondary"
            onPress={() => navigation.navigate('App')}
            style={{ marginTop: spacing.sm }}
          />
          <Text style={styles.foot}>
            Free: 1 vocab page + 4 practice questions. No card needed.
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
    fontSize: fontSize.xs, fontWeight: fontWeight.bold,
    letterSpacing: 1.2, color: colors.primary,
    textTransform: 'uppercase', marginBottom: spacing.sm,
  },
  headline: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, lineHeight: 36, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 24 },
  features: { marginBottom: spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: spacing.md },
  featureIcon: { fontSize: 20, marginTop: 2 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  featureBody: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  trust: { marginBottom: spacing.lg },
  trustRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  trustChip: {
    fontSize: fontSize.xs, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4,
    color: colors.textSecondary,
  },
  actions: {},
  foot: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});
