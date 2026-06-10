import React, { useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Lightbulb, ChevronLeft, ChevronRight, ClipboardCheck } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getVocabSet, getVocabLesson } from '../data/loaders';
import { useProgress } from '../store/progressStore';
import type { VocabLessonWord } from '../data/types';
import type { StudyStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<StudyStackParamList, 'VocabLesson'>;
  route: RouteProp<StudyStackParamList, 'VocabLesson'>;
};

function WordCard({ word }: { word: VocabLessonWord }) {
  return (
    <View style={styles.card}>
      <Text style={styles.wordFi}>{word.word_fi}</Text>
      <Text style={styles.meaningEn}>{word.meaning_en}</Text>

      {word.forms_fi.length > 0 && (
        <View style={styles.formsWrap}>
          <Text style={styles.sectionLabel}>FORMS & RELATED</Text>
          <View style={styles.formsList}>
            {word.forms_fi.map((f, i) => (
              <View key={i} style={styles.formRow}>
                <Text style={styles.formFi}>{f.fi}</Text>
                {!!f.en && <Text style={styles.formEn}>{f.en}</Text>}
              </View>
            ))}
          </View>
        </View>
      )}

      {!!word.exam_use_en && (
        <View style={styles.examNote}>
          <Lightbulb size={14} color={colors.warning} strokeWidth={2.4} />
          <Text style={styles.examText}>{word.exam_use_en}</Text>
        </View>
      )}
    </View>
  );
}

export function VocabLessonScreen({ navigation, route }: Props) {
  const { setId } = route.params;
  const set = getVocabSet(setId);
  const words = getVocabLesson(setId);
  const total = words.length;

  // Clamp the URL-driven index to a valid 1-based position.
  const rawIndex = Number(route.params.index) || 1;
  const current = Math.min(Math.max(rawIndex, 1), Math.max(total, 1));
  const word = words[current - 1];
  const { dispatch } = useProgress();

  const isFirst = current <= 1;
  const isLast = current >= total;

  // Mark the word seen as it comes into view; this also drives "N/N learned".
  useEffect(() => {
    if (word) dispatch({ type: 'MARK_VOCAB_SEEN', id: word.id });
  }, [word?.id]);

  // setParams updates the URL (…/lesson/:index) in place — no stack growth,
  // only the single visible card re-renders.
  const goTo = useCallback((n: number) => {
    navigation.setParams({ index: n });
  }, [navigation]);

  if (!set || !word) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Lesson" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>No lesson words for this set.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={`Lesson · Set ${set.set_no}`}
        onBack={() => navigation.goBack()}
        right={<Text style={styles.counter}>{current} / {total}</Text>}
      />

      {/* progress dots */}
      <View style={styles.dotsRow}>
        {words.map((w, i) => (
          <View
            key={w.id}
            style={[
              styles.dot,
              i + 1 === current && styles.dotActive,
              i + 1 < current && styles.dotDone,
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <WordCard word={word} />
      </ScrollView>

      {/* Prev / Next footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => goTo(current - 1)}
          disabled={isFirst}
          style={({ pressed }) => [
            styles.navBtn,
            isFirst && styles.navBtnDisabled,
            pressed && !isFirst && styles.navBtnPressed,
          ]}
        >
          <ChevronLeft size={20} color={isFirst ? colors.textTertiary : colors.text} strokeWidth={2.2} />
          <Text style={[styles.navBtnText, isFirst && styles.navBtnTextDisabled]}>Previous</Text>
        </Pressable>

        {isLast ? (
          <Pressable
            onPress={() => navigation.replace('VocabQuiz', { setId })}
            style={({ pressed }) => [styles.navBtn, styles.navBtnPrimary, pressed && styles.navBtnPressed]}
          >
            <ClipboardCheck size={18} color="#fff" strokeWidth={2.4} />
            <Text style={[styles.navBtnText, styles.navBtnTextPrimary]}>Take quiz</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => goTo(current + 1)}
            style={({ pressed }) => [styles.navBtn, styles.navBtnPrimary, pressed && styles.navBtnPressed]}
          >
            <Text style={[styles.navBtnText, styles.navBtnTextPrimary]}>Next</Text>
            <ChevronRight size={20} color="#fff" strokeWidth={2.4} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary },
  counter: { fontSize: fontSize.sm, fontFamily: font.semibold, color: colors.textSecondary },
  dotsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  dot: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 18 },
  dotDone: { backgroundColor: colors.primaryDark },
  scroll: { padding: spacing.md, flexGrow: 1 },
  card: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    backgroundColor: colors.bg, padding: spacing.lg, gap: 12,
    ...shadow.sm,
  },
  wordFi: { fontSize: 30, fontFamily: font.bold, color: colors.text, lineHeight: 36 },
  meaningEn: { fontSize: fontSize.lg, color: colors.primary, fontFamily: font.semibold, marginTop: -4 },
  formsWrap: { gap: 8, marginTop: 4 },
  sectionLabel: { fontSize: 10, fontFamily: font.bold, color: colors.textTertiary, letterSpacing: 0.8 },
  formsList: { gap: 7 },
  formRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  formFi: { fontSize: 15, fontFamily: font.semibold, color: colors.text, flexShrink: 0 },
  formEn: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  examNote: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: colors.warningTint, borderRadius: radius.sm, padding: 12, marginTop: 4,
  },
  examText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.text },
  footer: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md,
    borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.bg,
  },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, height: 50, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: colors.bg,
  },
  navBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  navBtnDisabled: { opacity: 0.45 },
  navBtnPressed: { transform: [{ scale: 0.97 }], opacity: 0.95 },
  navBtnText: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  navBtnTextPrimary: { color: '#fff' },
  navBtnTextDisabled: { color: colors.textTertiary },
});
