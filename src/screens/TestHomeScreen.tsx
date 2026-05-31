import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppButton } from '../components/ui/AppButton';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme/tokens';
import { getModelTests } from '../data/loaders';
import { useProgress } from '../store/progressStore';

export function TestHomeScreen() {
  const navigation = useNavigation<any>();
  const tests = getModelTests();
  const { state } = useProgress();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Model Tests</Text>
        <Text style={styles.sub}>Timed, exam-realistic. Pass mark: 75%</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tests.map(t => {
          const prevScore = state.test_scores.filter(s => s.test_id === t.id).slice(-1)[0];
          return (
            <View key={t.id} style={styles.testCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.testTitle}>{t.title_en}</Text>
                {prevScore && (
                  <View style={[styles.scoreBadge, prevScore.passed ? styles.badgePass : styles.badgeFail]}>
                    <Text style={[styles.scoreBadgeText, { color: prevScore.passed ? colors.success : colors.error }]}>
                      {prevScore.score}%
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>⏱ {t.time_minutes} min</Text>
                <Text style={styles.meta}>📝 {t.question_ids.length} questions</Text>
                <Text style={styles.meta}>✅ Pass: {t.pass_mark}%</Text>
              </View>
              {prevScore && (
                <Text style={styles.lastScore}>
                  Last attempt: {prevScore.score}% · {prevScore.passed ? '✅ Passed' : '❌ Failed'}
                </Text>
              )}
              <AppButton
                label={prevScore ? 'Retake test' : 'Start test →'}
                onPress={() => navigation.navigate('ModelTest', { testId: t.id })}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          );
        })}
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
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  scroll: { padding: spacing.md },
  testCard: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, marginBottom: 14,
    backgroundColor: colors.bg,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  testTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  scoreBadge: {
    borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  badgePass: { backgroundColor: colors.successTint, borderColor: colors.success },
  badgeFail: { backgroundColor: colors.errorTint, borderColor: colors.error },
  scoreBadgeText: { fontSize: 12, fontWeight: fontWeight.bold },
  metaRow: { flexDirection: 'row', gap: 14, marginBottom: 4 },
  meta: { fontSize: 13, color: colors.textSecondary },
  lastScore: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
