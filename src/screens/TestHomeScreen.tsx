import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Clock, ClipboardList, CircleCheck } from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getModelTests } from '../data/loaders';
import { useStartQuiz } from '../hooks/useStartQuiz';
import { usePaywall } from '../store/paywallStore';
import { Paywall } from '../components/Paywall';

export function TestHomeScreen() {
  const navigation = useNavigation<any>();
  const tests = getModelTests();
  const { startQuiz, loading } = useStartQuiz();
  const { isUnlocked } = usePaywall();

  if (!isUnlocked('model_tests')) {
    return (
      <Paywall
        title="Model Tests"
        blurb="Full, timed mock exams that mirror the real thing — 50 questions, 45 minutes, the real pass gate."
        perks={[`${tests.length} full timed mock exams`, 'Scored like the real exam (38/50 + per-section gate)', 'Review every question you missed afterwards']}
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
        onSubscribe={() => navigation.navigate('Pricing', { redirectTab: 'Test', redirectScreen: 'TestHome' })}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Model Tests</Text>
        <Text style={styles.sub}>Timed, exam-realistic. Pass mark: 76% (38 of 50)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tests.map(t => (
          <View key={t.id} style={styles.testCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.testTitle}>{t.title_en}</Text>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}><Clock size={13} color={colors.textSecondary} strokeWidth={2.2} /><Text style={styles.meta}>{t.time_minutes} min</Text></View>
              <View style={styles.metaItem}><ClipboardList size={13} color={colors.textSecondary} strokeWidth={2.2} /><Text style={styles.meta}>{t.question_ids.length} questions</Text></View>
              <View style={styles.metaItem}><CircleCheck size={13} color={colors.textSecondary} strokeWidth={2.2} /><Text style={styles.meta}>Pass {t.pass_mark}%</Text></View>
            </View>
            <AppButton
              label="Start test →"
              disabled={loading}
              onPress={() => startQuiz(`model-test/${t.id}`, 'ModelTest', { testId: t.id })}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderColor: colors.border,
  },
  title: { fontSize: fontSize.lg, fontFamily: font.bold, color: colors.text },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  scroll: { padding: spacing.md },
  testCard: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, marginBottom: 14,
    backgroundColor: colors.bg,
    ...shadow.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  testTitle: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  scoreBadge: {
    borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  badgePass: { backgroundColor: colors.successTint, borderColor: colors.success },
  badgeFail: { backgroundColor: colors.errorTint, borderColor: colors.error },
  scoreBadgeText: { fontSize: 12, fontFamily: font.bold },
  metaRow: { flexDirection: 'row', gap: 14, marginBottom: 4, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 13, color: colors.textSecondary },
  lastScore: { fontSize: 12, fontFamily: font.medium, marginTop: 2 },
  authPrompt: { flex: 1, justifyContent: 'center', padding: spacing.md },
});
