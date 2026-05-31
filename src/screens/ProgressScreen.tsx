import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppButton } from '../components/ui/AppButton';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ProgressRing } from '../components/ui/ProgressRing';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme/tokens';
import { useProgress, useQuestionStats, useWeakQuestionIds, useCategoryProgress } from '../store/progressStore';
import { getQuestions, getCategories, getVocabWords } from '../data/loaders';

const TOTAL_QS = getQuestions().length;
const CAT_Q_MAP: Record<string, string[]> = {};
getQuestions().forEach(q => {
  if (!CAT_Q_MAP[q.category_id]) CAT_Q_MAP[q.category_id] = [];
  CAT_Q_MAP[q.category_id].push(q.id);
});
const CATEGORIES = getCategories();
const TOTAL_VOCAB = getVocabWords().length;

export function ProgressScreen() {
  const navigation = useNavigation<any>();
  const { state } = useProgress();
  const { answered, correct, accuracy, completion } = useQuestionStats(TOTAL_QS);
  const weakIds = useWeakQuestionIds();
  const catProgress = useCategoryProgress(CAT_Q_MAP);
  const vocabLearned = Object.values(state.vocab).filter(v => v.learned).length;

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
                <Text style={[styles.statVal, { color: colors.success }]}>{state.streak}🔥</Text>
                <Text style={styles.statLbl}>Streak</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={[styles.statVal, { color: colors.primary }]}>{accuracy}%</Text>
                <Text style={styles.statLbl}>Accuracy</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statVal}>{state.test_scores.length}</Text>
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
            const barColor = cp.pct >= 75 ? colors.success : cp.pct >= 50 ? colors.warning : cp.pct > 0 ? colors.primary : colors.border;
            return (
              <ProgressBar
                key={cp.catId}
                label={cat?.name_en ?? cp.catId}
                value={cp.pct}
                color={barColor}
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
        {weakIds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>⚠️ WEAK AREAS — NEEDS ATTENTION</Text>
            {weakIds.slice(0, 5).map(id => {
              const q = getQuestions().find(q => q.id === id);
              const cat = CATEGORIES.find(c => c.id === q?.category_id);
              return (
                <View key={id} style={styles.weakRow}>
                  <Text style={styles.weakIcon}>{cat?.icon ?? '📌'}</Text>
                  <View style={styles.weakInfo}>
                    <Text style={styles.weakTitle} numberOfLines={2}>{q?.q_en ?? id}</Text>
                    <Text style={styles.weakSub}>{cat?.name_en}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => navigation.navigate('Study', {
                      screen: 'Practice',
                      params: { questionId: id, sourceLabel: 'Retry' },
                    })}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            <AppButton
              label="🔁 Retry all weak items"
              variant="success"
              onPress={() => {
                if (weakIds.length > 0) {
                  navigation.navigate('Study', {
                    screen: 'Practice',
                    params: {
                      questionId: weakIds[0],
                      queue: weakIds,
                      queueIndex: 0,
                      sourceLabel: 'Weak Items',
                    },
                  });
                }
              }}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}

        {weakIds.length === 0 && answered > 0 && (
          <View style={styles.allGood}>
            <Text style={styles.allGoodText}>✅ No weak areas! Keep it up.</Text>
          </View>
        )}

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
  overallCard: {
    flexDirection: 'row', gap: spacing.md, alignItems: 'center',
    margin: spacing.md, padding: spacing.md,
    backgroundColor: colors.bg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  overallRight: { flex: 1 },
  overallLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 2 },
  overallSub: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm },
  statRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.sm,
    padding: 8, alignItems: 'center',
  },
  statVal: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  statLbl: { fontSize: 10, color: colors.textSecondary, marginTop: 1 },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  sectionHeader: {
    fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 1,
    color: colors.textSecondary, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  vocabCount: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: -10, marginBottom: spacing.sm },
  weakRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, marginBottom: spacing.sm,
  },
  weakIcon: { fontSize: 20 },
  weakInfo: { flex: 1 },
  weakTitle: { fontSize: 13, fontWeight: fontWeight.semibold },
  weakSub: { fontSize: 12, color: colors.textSecondary },
  retryBtn: {
    backgroundColor: colors.primaryTint, borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 5,
  },
  retryText: { fontSize: 12, fontWeight: fontWeight.semibold, color: colors.primary },
  allGood: {
    margin: spacing.md, padding: spacing.md,
    backgroundColor: colors.successTint, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.success,
  },
  allGoodText: { fontSize: fontSize.sm, color: colors.success, fontWeight: fontWeight.semibold, textAlign: 'center' },
});
