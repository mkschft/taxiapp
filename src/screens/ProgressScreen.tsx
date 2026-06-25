import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CircleCheck } from 'lucide-react-native';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ProgressRing } from '../components/ui/ProgressRing';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { useAuth } from '../store/authStore';
import { GuestGate } from '../components/GuestGate';
import { getQuestions, getCategories, getVocabWordTotal } from '../data/loaders';

const TOTAL_QS = getQuestions().length;
const CATEGORIES = getCategories();
const TOTAL_VOCAB = getVocabWordTotal();

export function ProgressScreen() {
  const navigation = useNavigation<any>();
  const { state: auth } = useAuth();
  const answered = 0;
  const accuracy = 0;
  const completion = 0;
  const streak = 0;
  const testsDone = 0;
  const vocabLearned = 0;
  const catProgress = CATEGORIES.map(c => ({ catId: c.id, pct: 0 }));

  if (auth.guest && !auth.user) {
    return (
      <GuestGate
        title="Progress"
        blurb="Track your accuracy, streaks and weak areas across every section. Create a free account to start saving your progress."
        perks={['Per-category mastery and accuracy', 'Spaced-repetition review of weak items', 'Streaks and exam-readiness over time']}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Progress</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Overall card */}
        <View style={styles.overallCard}>
          <ProgressRing value={completion} size={100} />
          <View style={styles.overallRight}>
            <Text style={styles.overallLabel}>Overall completion</Text>
            <Text style={styles.overallSub}>{answered} of {TOTAL_QS} questions practiced</Text>
            <View style={styles.statRow}>
              <View style={styles.statChip}>
                <Text style={[styles.statVal, { color: colors.success }]}>{streak}</Text>
                <Text style={styles.statLbl}>Day streak</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={[styles.statVal, { color: colors.primary }]}>{accuracy}%</Text>
                <Text style={styles.statLbl}>Accuracy</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statVal}>{testsDone}</Text>
                <Text style={styles.statLbl}>Tests done</Text>
              </View>
            </View>
          </View>
        </View>

        {/* By category */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>BY OFFICIAL CATEGORY</Text>
          {catProgress.map(cp => {
            const cat = CATEGORIES.find(c => c.id === cp.catId);
            return (
              <ProgressBar
                key={cp.catId}
                label={cat?.name_en ?? cp.catId}
                value={cp.pct}
                color={colors.border}
              />
            );
          })}
        </View>

        {/* Vocabulary */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>VOCABULARY</Text>
          <ProgressBar
            label={`Words learned`}
            value={Math.round((vocabLearned / TOTAL_VOCAB) * 100)}
            showPct={false}
            color={colors.primary}
          />
          <Text style={styles.vocabCount}>{vocabLearned} / {TOTAL_VOCAB} words</Text>
        </View>

        {/* Weak areas */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>WEAK AREAS — NEEDS ATTENTION</Text>
          <View style={styles.allGood}>
            <CircleCheck size={18} color={colors.success} strokeWidth={2.2} />
            <Text style={styles.allGoodText}>No weak areas yet. Keep practising to see them here.</Text>
          </View>
        </View>

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
  overallCard: {
    flexDirection: 'row', gap: spacing.md, alignItems: 'center',
    margin: spacing.md, padding: spacing.md,
    backgroundColor: colors.bg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.sm,
  },
  overallRight: { flex: 1 },
  overallLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 2 },
  overallSub: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm },
  statRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.sm,
    padding: 8, alignItems: 'center',
  },
  statVal: { fontSize: fontSize.md, fontFamily: font.bold, color: colors.text },
  statLbl: { fontSize: 10, color: colors.textSecondary, marginTop: 1 },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  sectionHeader: {
    fontSize: fontSize.xs, fontFamily: font.bold, letterSpacing: 1,
    color: colors.textSecondary, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  vocabCount: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: -10, marginBottom: spacing.sm },
  weakRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, marginBottom: spacing.sm,
  },
  weakIconChip: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.errorTint,
    alignItems: 'center', justifyContent: 'center',
  },
  weakInfo: { flex: 1 },
  weakTitle: { fontSize: 13, fontFamily: font.semibold, color: colors.text },
  weakSub: { fontSize: 12, color: colors.textSecondary },
  retryBtn: {
    backgroundColor: colors.primaryTint, borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 5,
  },
  retryText: { fontSize: 12, fontFamily: font.semibold, color: colors.primary },
  allGood: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: spacing.md, padding: spacing.md,
    backgroundColor: colors.successTint, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.success,
  },
  allGoodText: { fontSize: fontSize.sm, color: colors.success, fontFamily: font.semibold },
});
