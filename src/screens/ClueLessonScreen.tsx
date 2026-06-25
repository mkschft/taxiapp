import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  ChevronLeft, ChevronRight, ClipboardCheck, Check, AlertTriangle, Info,
} from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getClueGroup, getClueLesson } from '../data/loaders';
import type { ClueLessonWord, ClueTone } from '../data/types';
import type { StudyStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<StudyStackParamList, 'ClueLesson'>;
  route: RouteProp<StudyStackParamList, 'ClueLesson'>;
};

function effectStyle(tone: ClueTone) {
  if (tone === 'positive') return { fg: colors.success, bg: colors.successTint, Icon: Check };
  if (tone === 'negative') return { fg: colors.error, bg: colors.errorTint, Icon: AlertTriangle };
  return { fg: colors.primary, bg: colors.primaryTint, Icon: Info };
}

function ClueCard({ word, tone }: { word: ClueLessonWord; tone: ClueTone }) {
  const es = effectStyle(tone);
  return (
    <View style={styles.card}>
      <Text style={styles.phraseFi}>{word.phrase_fi}</Text>
      <Text style={styles.meaningEn}>{word.meaning_en}</Text>

      {!!word.effect_en && (
        <View style={[styles.effect, { backgroundColor: es.bg }]}>
          <es.Icon size={15} color={es.fg} strokeWidth={2.6} />
          <View style={{ flex: 1 }}>
            <Text style={styles.effectLabel}>IN A QUESTION</Text>
            <Text style={[styles.effectText, { color: es.fg }]}>{word.effect_en}</Text>
          </View>
        </View>
      )}

      {!!word.exception_en && (
        <View style={styles.note}>
          <Text style={styles.noteLabel}>NOTE / EXAMPLE</Text>
          <Text style={styles.noteText}>{word.exception_en}</Text>
        </View>
      )}
    </View>
  );
}

export function ClueLessonScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const group = getClueGroup(groupId);
  const words = getClueLesson(groupId);
  const total = words.length;

  const rawIndex = Number(route.params.index) || 1;
  const current = Math.min(Math.max(rawIndex, 1), Math.max(total, 1));
  const word = words[current - 1];

  const isFirst = current <= 1;
  const isLast = current >= total;

  const goTo = useCallback((n: number) => {
    navigation.setParams({ index: n });
  }, [navigation]);

  if (!group || !word) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Lesson" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>No clue words in this group.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={group.short}
        onBack={() => navigation.goBack()}
        right={<Text style={styles.counter}>{current} / {total}</Text>}
      />

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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ClueCard word={word} tone={group.tone} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => goTo(current - 1)}
          disabled={isFirst}
          style={({ pressed }) => [
            styles.navBtn, isFirst && styles.navBtnDisabled, pressed && !isFirst && styles.navBtnPressed,
          ]}
        >
          <ChevronLeft size={20} color={isFirst ? colors.textTertiary : colors.text} strokeWidth={2.2} />
          <Text style={[styles.navBtnText, isFirst && styles.navBtnTextDisabled]}>Previous</Text>
        </Pressable>

        {isLast ? (
          <Pressable
            onPress={() => navigation.replace('ClueQuiz', { groupId })}
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
  phraseFi: { fontSize: 26, fontFamily: font.bold, color: colors.text, lineHeight: 32 },
  meaningEn: { fontSize: fontSize.lg, color: colors.primary, fontFamily: font.semibold, marginTop: -4 },
  effect: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    borderRadius: radius.sm, padding: 12, marginTop: 4,
  },
  effectLabel: { fontSize: 10, fontFamily: font.bold, color: colors.textTertiary, letterSpacing: 0.8, marginBottom: 2 },
  effectText: { fontSize: 14, fontFamily: font.semibold, lineHeight: 19 },
  note: { gap: 3 },
  noteLabel: { fontSize: 10, fontFamily: font.bold, color: colors.textTertiary, letterSpacing: 0.8 },
  noteText: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
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
