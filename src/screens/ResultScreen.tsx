import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { PartyPopper, BookOpenCheck } from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import { getQuestionById } from '../data/loaders';
import type { StudyStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<StudyStackParamList, 'Result'>;
  route: RouteProp<StudyStackParamList, 'Result'>;
};

export function ResultScreen({ navigation, route }: Props) {
  const { mode, label, score, total, wrongIds, timeTaken, answers } = route.params;
  const pct = Math.round((score / total) * 100);
  const passed = pct >= 75;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={`${label} — Result`} onBack={() => navigation.popToTop()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Pass / fail banner */}
        <View style={[styles.banner, passed ? styles.bannerPass : styles.bannerFail]}>
          {passed
            ? <PartyPopper size={32} color={colors.success} strokeWidth={2} />
            : <BookOpenCheck size={32} color={colors.error} strokeWidth={2} />}
          <Text style={[styles.bannerTitle, { color: passed ? colors.success : colors.error, marginTop: 6 }]}>
            {passed ? 'You passed!' : 'Keep studying'}
          </Text>
          <Text style={styles.bannerSub}>Pass mark: 75% · Your score: {pct}%</Text>
        </View>

        {/* Score ring area */}
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreNum, { color: passed ? colors.success : colors.error }]}>
            {score}
          </Text>
          <Text style={styles.scoreOf}>out of {total}</Text>
        </View>

        {/* Stat chips */}
        <View style={styles.statRow}>
          {[
            { val: String(score), label: 'Correct', color: colors.success },
            { val: String(total - score), label: 'Wrong', color: colors.error },
            { val: timeTaken ? fmt(timeTaken) : `${pct}%`, label: timeTaken ? 'Time' : 'Score', color: colors.text },
          ].map(s => (
            <View key={s.label} style={styles.statChip}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Wrong answers */}
        {wrongIds.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Review wrong answers ({wrongIds.length})</Text>
            {wrongIds.map(id => {
              const q = getQuestionById(id);
              if (!q) return null;
              return (
                <TouchableOpacity
                  key={id}
                  style={styles.wrongItem}
                  onPress={() => navigation.push('Practice', {
                    questionId: id,
                    queue: wrongIds,
                    queueIndex: wrongIds.indexOf(id),
                    sourceLabel: 'Review',
                    review: true,
                    answers,
                  })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.wrongQ} numberOfLines={2}>{q.question.fi ?? q.question.en}</Text>
                  <Text style={styles.wrongMeta}>Tap to review →</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={styles.actions}>
          {wrongIds.length > 0 && (
            <AppButton
              label="Retry wrong answers →"
              onPress={() => navigation.replace('Practice', {
                questionId: wrongIds[0],
                queue: wrongIds,
                queueIndex: 0,
                sourceLabel: 'Retry',
              })}
            />
          )}
          <AppButton
            label="Back to dashboard"
            variant="secondary"
            onPress={() => navigation.popToTop()}
            style={{ marginTop: spacing.sm }}
          />
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md },
  banner: {
    borderWidth: 1.5, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.lg,
  },
  bannerPass: { backgroundColor: colors.successTint, borderColor: colors.success },
  bannerFail: { backgroundColor: colors.errorTint, borderColor: colors.error },
  bannerTitle: { fontSize: fontSize.lg, fontFamily: font.bold, marginBottom: 4 },
  bannerSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  scoreCircle: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 8, borderColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: spacing.lg,
  },
  scoreNum: { fontSize: 32, fontFamily: font.bold },
  scoreOf: { fontSize: fontSize.sm, color: colors.textSecondary },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  statChip: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 12, alignItems: 'center',
  },
  statVal: { fontSize: 20, fontFamily: font.bold },
  statLbl: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  sectionHeader: {
    fontSize: fontSize.xs, fontFamily: font.bold, letterSpacing: 1,
    textTransform: 'uppercase', color: colors.textSecondary,
    paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  wrongItem: {
    backgroundColor: '#FFF8F8', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: radius.md, padding: 12, marginBottom: spacing.sm,
  },
  wrongQ: { fontSize: 13, fontFamily: font.semibold, color: colors.text, marginBottom: 4 },
  wrongMeta: { fontSize: 12, color: colors.primary },
  actions: { marginTop: spacing.md },
});
