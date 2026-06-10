import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { BookOpen, ClipboardCheck, ChevronRight, Check } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getVocabSet, getVocabLesson, getVocabQuiz, getCategories } from '../data/loaders';
import { useProgress } from '../store/progressStore';
import type { StudyStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<StudyStackParamList, 'VocabSetDetail'>;
  route: RouteProp<StudyStackParamList, 'VocabSetDetail'>;
};

const CAT = Object.fromEntries(getCategories().map(c => [c.id, c]));

export function VocabSetDetailScreen({ navigation, route }: Props) {
  const { setId } = route.params;
  const set = getVocabSet(setId);
  const { state } = useProgress();

  if (!set) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Vocabulary" onBack={() => navigation.goBack()} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Set not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const words = getVocabLesson(set.id);
  const quiz = getVocabQuiz(set.id);
  const seenCount = words.filter(w => state.vocab[w.id]?.seen).length;
  const lessonDone = words.length > 0 && seenCount === words.length;
  const best = state.quiz_scores
    .filter(s => s.quiz_id === set.id)
    .reduce<number | null>((m, s) => Math.max(m ?? 0, s.score), null);
  const cat = set.category_id ? CAT[set.category_id] : null;
  const tint = cat?.color ?? colors.primary;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={`Set ${set.set_no}`} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Set heading */}
        <View style={styles.heading}>
          {cat && (
            <View style={[styles.catPill, { backgroundColor: tint + '18' }]}>
              <Text style={[styles.catPillText, { color: tint }]}>{cat.icon}  {cat.name_en}</Text>
            </View>
          )}
          <Text style={styles.setName}>{set.name}</Text>
          <Text style={styles.setMeta}>{set.word_count} words · {set.question_count} quiz questions</Text>
        </View>

        {/* Lesson card */}
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.82}
          onPress={() => navigation.navigate('VocabLesson', { setId: set.id, index: 1 })}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.primaryTint }]}>
            <BookOpen size={24} color={colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.actionInfo}>
            <View style={styles.actionTitleRow}>
              <Text style={styles.actionTitle}>Lesson</Text>
              {lessonDone && (
                <View style={styles.doneChip}>
                  <Check size={11} color={colors.success} strokeWidth={3} />
                  <Text style={styles.doneChipText}>Done</Text>
                </View>
              )}
            </View>
            <Text style={styles.actionSub}>Study {words.length} word cards · meanings, forms & exam use</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, {
                width: `${words.length ? (seenCount / words.length) * 100 : 0}%`,
                backgroundColor: colors.primary,
              }]} />
            </View>
            <Text style={styles.progressText}>{seenCount}/{words.length} learned</Text>
          </View>
          <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2.2} />
        </TouchableOpacity>

        {/* Quiz card */}
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.82}
          onPress={() => navigation.navigate('VocabQuiz', { setId: set.id })}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.successTint }]}>
            <ClipboardCheck size={24} color={colors.success} strokeWidth={2.2} />
          </View>
          <View style={styles.actionInfo}>
            <View style={styles.actionTitleRow}>
              <Text style={styles.actionTitle}>Quiz</Text>
              {best != null && (
                <View style={styles.doneChip}>
                  <Text style={styles.doneChipText}>
                    Best {Math.round((best / set.question_count) * 100)}%
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.actionSub}>
              {quiz.length} questions · match the Finnish word to its meaning
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2.2} />
        </TouchableOpacity>

        <Text style={styles.tip}>
          Tip: work through the Lesson first, then test yourself with the Quiz.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary },
  heading: { marginBottom: spacing.xs, gap: 8 },
  catPill: { alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  catPillText: { fontSize: 12, fontFamily: font.semibold },
  setName: { fontSize: fontSize.lg, fontFamily: font.bold, color: colors.text, lineHeight: 26 },
  setMeta: { fontSize: fontSize.sm, color: colors.textSecondary },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    backgroundColor: colors.bg,
    ...shadow.sm,
  },
  actionIcon: {
    width: 48, height: 48, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  actionInfo: { flex: 1, gap: 4 },
  actionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionTitle: { fontSize: fontSize.md, fontFamily: font.bold, color: colors.text },
  actionSub: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18 },
  doneChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.successTint, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  doneChipText: { fontSize: 11, fontFamily: font.semibold, color: colors.success },
  barTrack: {
    height: 6, backgroundColor: colors.surface, borderRadius: radius.full,
    overflow: 'hidden', marginTop: 4,
  },
  barFill: { height: '100%', borderRadius: radius.full },
  progressText: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
  tip: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: spacing.xs, lineHeight: 18 },
});
