import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Check, AlertTriangle, HelpCircle, Link2, BookOpen, ClipboardCheck,
  type LucideIcon,
} from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getClueGroups, getClueLesson } from '../data/loaders';
import { useProgress } from '../store/progressStore';
import { useAuth } from '../store/authStore';
import { useStartQuiz } from '../hooks/useStartQuiz';
import { AuthPrompt } from '../components/AuthPrompt';
import { usePaywall } from '../store/paywallStore';
import { Paywall } from '../components/Paywall';
import type { ClueTone } from '../data/types';

const GROUP_ICON: Record<string, LucideIcon> = {
  positive: Check,
  negative: AlertTriangle,
  wh: HelpCircle,
  conjunction: Link2,
};

function toneColors(tone: ClueTone) {
  if (tone === 'positive') return { fg: colors.success, bg: colors.successTint };
  if (tone === 'negative') return { fg: colors.error, bg: colors.errorTint };
  return { fg: colors.primary, bg: colors.primaryTint };
}

const GROUPS = getClueGroups();

export function ClueWordsScreen() {
  const navigation = useNavigation<any>();
  const { state } = useProgress();
  const { state: authState } = useAuth();
  const { startQuiz, loading } = useStartQuiz();
  const { isUnlocked, unlock } = usePaywall();
  const isAuthenticated = !!authState.user;

  if (!isUnlocked('clue_words')) {
    return (
      <Paywall
        title="Clue Words"
        blurb="The method that lets you answer questions even with weak Finnish — spot the words that signal right vs wrong."
        perks={['Positive & negative clue words, with their exceptions', 'Read a question strategically, not word-by-word', 'Practice quiz for each clue group']}
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
        onSkip={() => unlock('clue_words')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Clue Words" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Clue words are the answer-logic engine. Learn to spot them and you can
          often pick the right option even with limited Finnish. Pick a group to
          study, then test yourself.
        </Text>

        {!isAuthenticated && (
          <AuthPrompt
            title="Sign in to take quizzes"
            body="Create a free account to test yourself on each clue-word group."
          />
        )}

        {GROUPS.map(group => {
          const Icon = GROUP_ICON[group.id] ?? HelpCircle;
          const tc = toneColors(group.tone);
          const words = getClueLesson(group.id);
          const seen = words.filter(w => state.vocab[w.id]?.seen).length;
          const lessonDone = words.length > 0 && seen === words.length;
          const best = state.quiz_scores
            .filter(s => s.quiz_id === group.id)
            .reduce<number | null>((m, s) => Math.max(m ?? 0, s.score), null);
          const bestPct = best != null && group.question_count > 0
            ? Math.round((best / group.question_count) * 100) : null;

          return (
            <View key={group.id} style={styles.card}>
              <View style={styles.cardHead}>
                <View style={[styles.iconChip, { backgroundColor: tc.bg }]}>
                  <Icon size={22} color={tc.fg} strokeWidth={2.3} />
                </View>
                <View style={styles.headInfo}>
                  <Text style={styles.cardTitle}>{group.label}</Text>
                  <Text style={styles.cardBlurb}>{group.blurb}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.meta}>{group.word_count} words · {group.question_count} quiz Qs</Text>
                <View style={styles.tags}>
                  <Text style={[styles.tag, lessonDone && { color: colors.success }]}>
                    {seen}/{words.length} learned
                  </Text>
                  {bestPct != null && (
                    <Text style={[styles.tag, { color: colors.success }]}>· best {bestPct}%</Text>
                  )}
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable
                  onPress={() => navigation.navigate('ClueLesson', { groupId: group.id, index: 1 })}
                  style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.btnPressed]}
                >
                  <BookOpen size={17} color={colors.text} strokeWidth={2.2} />
                  <Text style={styles.btnOutlineText}>Lesson</Text>
                </Pressable>
                {isAuthenticated && (
                  <Pressable
                    disabled={loading}
                    onPress={() => startQuiz(`clue/${group.id}`, 'ClueQuiz', { groupId: group.id })}
                    style={({ pressed }) => [styles.btn, { backgroundColor: tc.fg }, pressed && styles.btnPressed]}
                  >
                    <ClipboardCheck size={17} color="#fff" strokeWidth={2.3} />
                    <Text style={styles.btnFilledText}>Quiz</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, gap: 12 },
  intro: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: 2 },
  card: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    backgroundColor: colors.bg, padding: spacing.md, gap: 12,
    ...shadow.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconChip: {
    width: 44, height: 44, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  cardBlurb: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  meta: { fontSize: fontSize.sm, color: colors.textSecondary },
  tags: { flexDirection: 'row', gap: 4 },
  tag: { fontSize: 12, fontFamily: font.semibold, color: colors.textTertiary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 44, borderRadius: radius.sm,
  },
  btnOutline: { borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: colors.bg },
  btnPressed: { transform: [{ scale: 0.97 }], opacity: 0.95 },
  btnOutlineText: { fontSize: fontSize.sm, fontFamily: font.semibold, color: colors.text },
  btnFilledText: { fontSize: fontSize.sm, fontFamily: font.semibold, color: '#fff' },
});
