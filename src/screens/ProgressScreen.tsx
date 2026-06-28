import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { CircleCheck, ChevronRight } from 'lucide-react-native';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ProgressRing } from '../components/ui/ProgressRing';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { useProgress } from '../hooks/useProgress';
import { GuestOverlay } from '../components/GuestOverlay';
import { useAuth } from '../store/authStore';
import { localizedPair } from '../i18n/content';
import { getQuestions, getCategories, getVocabWordTotal } from '../data/loaders';

const TOTAL_QS = getQuestions().length;
const CATEGORIES = getCategories();
const TOTAL_VOCAB = getVocabWordTotal();

export function ProgressScreen() {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const { state: auth } = useAuth();
  const isGuest = auth.guest && !auth.user;
  const { data: progress, loading } = useProgress(!isGuest);

  const totalCompleted = progress?.reduce((sum, item) => sum + item.progress.completed, 0) ?? 0;
  const totalQuestions = progress?.reduce((sum, item) => sum + item.progress.total, 0) ?? 0;
  const completion = totalQuestions === 0 ? 0 : Math.round((totalCompleted / totalQuestions) * 100);

  const vocabCategory = progress?.find(item => item.mainCategory.name === 'Vocabulary');
  const vocabLearned = vocabCategory?.progress.completed ?? 0;
  const vocabTotal = vocabCategory?.progress.total ?? TOTAL_VOCAB;

  const officialCategory = progress?.find(item => item.mainCategory.name === 'Official');
  const catProgress = CATEGORIES.map(cat => {
    const sub = officialCategory?.subcategories.find(s => s.category.name === cat.name_en);
    return {
      catId: cat.id,
      pct: sub?.percentage ?? 0,
      completed: sub?.completed ?? 0,
      total: sub?.total ?? 0,
    };
  });

  // Weak areas = subcategories with questions attempted but not yet correct
  // (BE-2). Until the backend supplies wrongCount, this is empty → the "all
  // good" state shows. wrongQuestionIds feed a focused "Practice these" run.
  const weakAreas = (officialCategory?.subcategories ?? [])
    .filter(s => (s.wrongCount ?? 0) > 0)
    .sort((a, b) => (b.wrongCount ?? 0) - (a.wrongCount ?? 0))
    .slice(0, 3)
    .map(s => {
      const cat = CATEGORIES.find(c => c.name_en === s.category.name);
      return {
        catId: cat?.id ?? s.category.name,
        nameFi: cat?.name_fi ?? s.category.name,
        nameEn: cat?.name_en ?? s.category.name,
        wrongCount: s.wrongCount ?? 0,
        wrongQuestionIds: s.wrongQuestionIds ?? [],
      };
    });

  const practiceWeak = (ids: string[]) => {
    if (ids.length === 0) return;
    navigation.navigate('Study', {
      screen: 'Practice',
      params: { questionId: ids[0], queue: ids, queueIndex: 0, sourceLabel: t('progress.weakAreasSource') },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('progress.title')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Overall card */}
        <View style={styles.overallCard}>
          <ProgressRing value={completion} size={100} />
          <View style={styles.overallRight}>
            <Text style={styles.overallLabel}>{t('progress.overallCompletion')}</Text>
            <Text style={styles.overallSub}>
              {loading ? t('common.loading') : t('progress.overallSub', { c: totalCompleted, t: totalQuestions })}
            </Text>
          </View>
        </View>

        {/* By category */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('progress.byOfficialCategory')}</Text>
          {catProgress.map(cp => {
            const cat = CATEGORIES.find(c => c.id === cp.catId);
            const { primary } = cat
              ? localizedPair(cat.name_fi, cat.name_en, i18n.language)
              : { primary: cp.catId };
            return (
              <ProgressBar
                key={cp.catId}
                label={primary}
                value={cp.pct}
                rightLabel={t('progress.mastered', { c: cp.completed, t: cp.total })}
                color={colors.primary}
              />
            );
          })}
        </View>

        {/* Vocabulary */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('progress.vocabulary')}</Text>
          <ProgressBar
            label={t('progress.wordsLearned')}
            value={vocabTotal === 0 ? 0 : Math.round((vocabLearned / vocabTotal) * 100)}
            showPct={false}
            color={colors.primary}
          />
          <Text style={styles.vocabCount}>{t('progress.vocabCount', { c: vocabLearned, t: vocabTotal })}</Text>
        </View>

        {/* Weak areas */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('progress.weakAreasHeader')}</Text>
          {weakAreas.length === 0 ? (
            <View style={styles.allGood}>
              <CircleCheck size={18} color={colors.success} strokeWidth={2.2} />
              <Text style={styles.allGoodText}>{t('progress.noWeakAreas')}</Text>
            </View>
          ) : (
            weakAreas.map(w => (
              <TouchableOpacity
                key={w.catId}
                style={styles.weakRow}
                activeOpacity={0.78}
                disabled={w.wrongQuestionIds.length === 0}
                onPress={() => practiceWeak(w.wrongQuestionIds)}
              >
                <View style={styles.weakInfo}>
                  <Text style={styles.weakTitle}>{localizedPair(w.nameFi, w.nameEn, i18n.language).primary}</Text>
                  <Text style={styles.weakSub}>{t('progress.toRevisit', { n: w.wrongCount })}</Text>
                </View>
                {w.wrongQuestionIds.length > 0 && (
                  <View style={styles.retryBtn}>
                    <Text style={styles.retryText}>{t('progress.practise')}</Text>
                  </View>
                )}
                <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2.2} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
      <GuestOverlay blurb={t('progress.guestBlurb')} />
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
