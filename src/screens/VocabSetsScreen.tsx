import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, Check } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { ProgressRing } from '../components/ui/ProgressRing';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getVocabSets, getVocabLesson, getCategories } from '../data/loaders';
import { useProgress } from '../store/progressStore';
import { usePaywall } from '../store/paywallStore';
import { Paywall } from '../components/Paywall';
import type { StudyStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<StudyStackParamList, 'VocabSets'>;
};

const CAT_COLOR: Record<string, string> = Object.fromEntries(
  getCategories().map(c => [c.id, c.color]),
);

const SETS = getVocabSets();

export function VocabSetsScreen({ navigation }: Props) {
  const { state } = useProgress();
  const { isUnlocked, unlock } = usePaywall();

  if (!isUnlocked('vocabulary')) {
    return (
      <Paywall
        title="Vocabulary"
        blurb="Learn the exact Finnish words the exam uses — with English meanings and inflected forms."
        perks={[`${SETS.length} themed sets · the words that appear on the real exam`, 'Bilingual cards (Finnish + English)', 'Built-in quiz after every set']}
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard' as never))}
        onSkip={() => unlock('vocabulary')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Vocabulary" onBack={() => navigation.goBack()} />

      <View style={styles.subHeader}>
        <Text style={styles.caption}>
          {SETS.length} practice sets · learn the words, then take the quiz
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {SETS.map(set => {
          const tint = CAT_COLOR[set.category_id ?? ''] ?? colors.primary;
          const words = getVocabLesson(set.id);
          const seenCount = words.filter(w => state.vocab[w.id]?.seen).length;
          const lessonDone = words.length > 0 && seenCount === words.length;
          const pctLearned = words.length > 0 ? Math.round((seenCount / words.length) * 100) : 0;
          const best = state.quiz_scores
            .filter(s => s.quiz_id === set.id)
            .reduce<number | null>((m, s) => Math.max(m ?? 0, s.score), null);
          const bestPct = best != null && set.question_count > 0
            ? Math.round((best / set.question_count) * 100)
            : null;

          return (
            <TouchableOpacity
              key={set.id}
              style={styles.card}
              activeOpacity={0.78}
              onPress={() => navigation.navigate('VocabSetDetail', { setId: set.id })}
            >
              <ProgressRing
                value={pctLearned}
                size={48}
                strokeWidth={5}
                color={tint}
                trackColor={colors.surfaceAlt}
                valueFontSize={12}
              >
                {lessonDone ? <Check size={20} color={tint} strokeWidth={2.8} /> : undefined}
              </ProgressRing>

              <View style={styles.info}>
                <Text style={styles.setNo}>SET {set.set_no}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>{set.name}</Text>
                <Text style={styles.cardSub}>
                  {set.word_count} words · {set.question_count} quiz Qs
                </Text>
                <View style={styles.metaRow}>
                  <View style={[styles.tag, { backgroundColor: colors.surface }]}>
                    <Text style={styles.tagText}>{seenCount}/{words.length} learned</Text>
                  </View>
                  {bestPct != null && (
                    <View style={[styles.tag, { backgroundColor: colors.successTint }]}>
                      <Text style={[styles.tagText, { color: colors.success }]}>
                        Quiz best {bestPct}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2.2} />
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  subHeader: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  caption: { fontSize: fontSize.sm, color: colors.textSecondary },
  list: { padding: spacing.md, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    backgroundColor: colors.bg,
    ...shadow.sm,
  },
  iconChip: {
    width: 44, height: 44, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  info: { flex: 1, gap: 2 },
  setNo: { fontSize: 10, fontFamily: font.bold, color: colors.textTertiary, letterSpacing: 0.8 },
  cardTitle: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text, lineHeight: 21 },
  cardSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: { borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 3 },
  tagText: { fontSize: 11, fontFamily: font.semibold, color: colors.textSecondary },
});
