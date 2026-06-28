import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { mode, label, score, total, wrongIds, timeTaken, answers, categories } = route.params;
  const pct = Math.round((score / total) * 100);
  // The model test grades against the real Traficom gate (overall 38/50 AND a
  // minimum in each of the 4 areas) and passes the authoritative flag through.
  // Fall back to the overall 76% threshold for non-test modes.
  const passed = route.params.passed ?? pct >= 76;
  // Overall mark reached but failed on a category minimum — the exam's hidden trap.
  const failedCats = categories?.filter(c => !c.passed) ?? [];
  const gateFail = !passed && score >= 38 && failedCats.length > 0;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={t('result.headerTitle', { label })} onBack={() => navigation.popToTop()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Pass / fail banner */}
        <View style={[styles.banner, passed ? styles.bannerPass : styles.bannerFail]}>
          {passed
            ? <PartyPopper size={32} color={colors.success} strokeWidth={2} />
            : <BookOpenCheck size={32} color={colors.error} strokeWidth={2} />}
          <Text style={[styles.bannerTitle, { color: passed ? colors.success : colors.error, marginTop: 6 }]}>
            {passed ? t('result.passed') : t('result.keepStudying')}
          </Text>
          <Text style={styles.bannerSub}>{t('result.passMark', { score, total })}</Text>
        </View>

        {/* Why-failed note: reached 38 overall but missed a category gate */}
        {gateFail && (
          <View style={styles.gateNote}>
            <Text style={styles.gateNoteText}>
              {t('result.gateNote', { score, total, cats: failedCats.map(c => c.label).join(', ') })}
            </Text>
          </View>
        )}

        {/* Per-category breakdown (model-test pass gate) */}
        {categories && categories.length > 0 && (
          <View style={styles.catCard}>
            <Text style={styles.catHeader}>{t('result.categoryBreakdown')}</Text>
            {categories.map(c => (
              <View key={c.category} style={styles.catRow}>
                <Text style={styles.catName} numberOfLines={1}>{c.label}</Text>
                <Text style={[styles.catScore, { color: c.passed ? colors.success : colors.error }]}>
                  {c.correct}/{c.total}
                </Text>
                <Text style={styles.catMin}>{t('result.categoryMin', { min: c.min })}</Text>
                <Text style={[styles.catFlag, { color: c.passed ? colors.success : colors.error }]}>
                  {c.passed ? '✓' : '✕'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Score ring area */}
        <View style={[styles.scoreCircle, { borderColor: passed ? colors.success : colors.error }]}>
          <Text style={[styles.scoreNum, { color: passed ? colors.success : colors.error }]}>
            {score}
          </Text>
          <Text style={styles.scoreOf}>{t('result.outOf', { total })}</Text>
        </View>

        {/* Stat chips */}
        <View style={styles.statRow}>
          {[
            { val: String(score), label: t('result.correct'), color: colors.success },
            { val: String(total - score), label: t('result.wrong'), color: colors.error },
            { val: timeTaken ? fmt(timeTaken) : `${pct}%`, label: timeTaken ? t('result.time') : t('result.score'), color: colors.text },
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
            <Text style={styles.sectionHeader}>{t('result.reviewWrong', { count: wrongIds.length })}</Text>
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
                  <Text style={styles.wrongMeta}>{t('result.tapToReview')}</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={styles.actions}>
          {wrongIds.length > 0 && (
            <AppButton
              label={t('result.retryWrong')}
              onPress={() => navigation.replace('Practice', {
                questionId: wrongIds[0],
                queue: wrongIds,
                queueIndex: 0,
                sourceLabel: 'Retry',
              })}
            />
          )}
          <AppButton
            label={t('result.backToDashboard')}
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
  bannerSub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  gateNote: {
    backgroundColor: colors.warningTint, borderWidth: 1, borderColor: colors.warning + '66',
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  gateNoteText: { fontSize: 13, lineHeight: 19, color: colors.text },
  catCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  catHeader: {
    fontSize: fontSize.xs, fontFamily: font.bold, letterSpacing: 1,
    textTransform: 'uppercase', color: colors.textSecondary, marginBottom: spacing.sm,
  },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  catName: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  catScore: { width: 48, textAlign: 'right', fontSize: fontSize.sm, fontFamily: font.bold },
  catMin: { width: 56, textAlign: 'right', fontSize: fontSize.xs, color: colors.textSecondary },
  catFlag: { width: 24, textAlign: 'right', fontSize: fontSize.md, fontFamily: font.bold },
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
    backgroundColor: colors.errorSurface, borderWidth: 1, borderColor: colors.errorBorder,
    borderRadius: radius.md, padding: 12, marginBottom: spacing.sm,
  },
  wrongQ: { fontSize: 13, fontFamily: font.semibold, color: colors.text, marginBottom: 4 },
  wrongMeta: { fontSize: 12, color: colors.primary },
  actions: { marginTop: spacing.md },
});
