import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { ContentContainer } from '../components/web/ContentContainer';
import { ProgressRing } from '../components/ui/ProgressRing';
import { AlertDialog } from '../components/ui/AlertDialog';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getVocabSets, getCategories } from '../data/loaders';
import { useAuth } from '../store/authStore';
import { useStartQuiz } from '../hooks/useStartQuiz';
import { useProblemSetProgress } from '../hooks/useProblemSetProgress';
import { BACKEND_PROBLEM_SET_IDS } from '../data/backendProblemSetIds';
import type { DashboardStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<DashboardStackParamList, 'VocabSets'>;
  route: RouteProp<DashboardStackParamList, 'VocabSets'>;
};

const CAT_COLOR: Record<string, string> = Object.fromEntries(
  getCategories().map(c => [c.id, c.color]),
);

const SETS = getVocabSets();

export function VocabSetsScreen({ navigation, route }: Props) {
  const [mode, setMode] = useState<'practice' | 'quiz'>(route.params?.mode === 'quiz' ? 'quiz' : 'practice');
  const isQuizMode = mode === 'quiz';
  const { state: auth } = useAuth();
  const isAuthenticated = !!auth.user;
  const { data: setProgress } = useProblemSetProgress(isAuthenticated);
  const { startQuiz, error, clearError } = useStartQuiz();
  const { t } = useTranslation();

  const headerTitle = isQuizMode ? `${t('vocab.title')} · ${t('quiz.title')}` : t('vocab.title');

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={headerTitle}
        onBack={() => navigation.goBack()}
        right={
          !isQuizMode ? (
            <Pressable onPress={() => setMode('quiz')} style={styles.modeBtn} hitSlop={4}>
              <Text style={styles.modeBtnText}>{t('dashboard.takeQuiz')}</Text>
            </Pressable>
          ) : undefined
        }
      />

      <View style={styles.subHeader}>
        <Text style={styles.caption}>
          {t('vocab.setsCaption', { n: SETS.length })}
        </Text>
      </View>

      <ContentContainer maxWidth={880}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {SETS.map((set, index) => {
            const tint = CAT_COLOR[set.category_id ?? ''] ?? colors.primary;
            // Per-set progress is keyed by the set's backend problem set. Until BE-3
            // ships, the map is empty → neutral ring with no fake count.
            const problemSetId = BACKEND_PROBLEM_SET_IDS[`vocab/sets/set-${set.set_no}`];
            const lp = problemSetId ? setProgress[problemSetId] : undefined;
            const kicker = t('vocab.groupHeader', { n: index + 1, count: set.word_count });

            return (
              <Pressable
                key={set.id}
                onPress={() =>
                  isQuizMode
                    ? startQuiz(`vocab/sets/${set.id}`, 'VocabQuiz', { setId: set.id })
                    : navigation.navigate('VocabLesson', { setId: set.id, index: 1 })
                }
                style={({ pressed }) => [styles.card, pressed && styles.btnPressed]}
              >
                <View style={styles.cardTop}>
                  <ProgressRing
                    value={lp?.percentage ?? 0}
                    size={48}
                    strokeWidth={5}
                    color={tint}
                    trackColor={colors.surfaceAlt}
                    valueFontSize={12}
                  >
                    {lp ? undefined : <Text style={styles.ringNeutral}>–</Text>}
                  </ProgressRing>

                  <View style={styles.info}>
                    <Text style={styles.kicker}>{kicker}</Text>
                    <Text style={styles.cardTitle} numberOfLines={2}>{set.name}</Text>
                  </View>

                  <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2.2} />
                </View>
              </Pressable>
            );
          })}
          <View style={{ height: 32 }} />
        </ScrollView>
      </ContentContainer>

      <AlertDialog
        visible={!!error}
        title={t('common.error')}
        message={error ?? undefined}
        buttonLabel={t('common.ok')}
        variant="danger"
        onDismiss={clearError}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  subHeader: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  caption: { fontSize: fontSize.sm, color: colors.textSecondary },
  list: { padding: spacing.md, gap: 12 },
  card: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    backgroundColor: colors.bg, gap: 12,
    ...shadow.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  info: { flex: 1, gap: 2 },
  kicker: { fontSize: 12, fontFamily: font.semibold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3 },
  cardTitle: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text, lineHeight: 21 },
  ringNeutral: { fontSize: 14, fontFamily: font.bold, color: colors.textTertiary },
  btnPressed: { transform: [{ scale: 0.97 }], opacity: 0.95 },
  modeBtn: {
    height: 32, borderRadius: radius.full, paddingHorizontal: spacing.sm + 2,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  modeBtnText: { fontSize: 13, fontFamily: font.semibold, color: '#fff' },
});
