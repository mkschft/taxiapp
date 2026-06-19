import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { IconChip } from '../components/ui/IconChip';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { MODULE_ICONS } from '../theme/icons';

// Where each module lives in the navigator, so cards are tappable.
type Nav = { stack?: 'Study' | 'Test'; screen: string } | { tab: 'Progress' };

type Module = {
  Icon: LucideIcon; tint: string; title: string;
  what: string; how: string; nav: Nav;
};

const MODULES: Module[] = [
  {
    Icon: MODULE_ICONS.examGuide, tint: colors.primary, title: 'Exam Guide',
    what: 'The facts of the real Traficom exam — format, the 4 official categories, and exam-day rules.',
    how: 'Read this first so you know exactly what you are training for: 50 questions, 45 minutes, 38/50 to pass (with a minimum in each category), in Finnish or Swedish.',
    nav: { stack: 'Study', screen: 'Guide' },
  },
  {
    Icon: MODULE_ICONS.vocabulary, tint: colors.success, title: 'Vocabulary',
    what: 'Core Finnish taxi words grouped into bite-size sets, each with a flashcard lesson and a quiz.',
    how: 'Learn a set, then take its quiz. Build the base words before tackling full questions.',
    nav: { stack: 'Study', screen: 'VocabSets' },
  },
  {
    Icon: MODULE_ICONS.clueWords, tint: colors.warning, title: 'Clue Words',
    what: 'The answer-logic words that quietly point to the right or wrong option.',
    how: 'Positive clues (varmistaa, huolehtia) lean correct; absolutes (aina, vain, koskaan) are usually traps. Train your eye here so you can answer even when you don’t understand every word.',
    nav: { stack: 'Study', screen: 'ClueWords' },
  },
  {
    Icon: MODULE_ICONS.topicPractice, tint: colors.error, title: 'Topic Practice',
    what: 'Real exam-style questions sorted into lessons under the 4 official categories.',
    how: 'Work through a section lesson by lesson. Every answer shows the translation and explanation, so each question teaches you something.',
    nav: { stack: 'Study', screen: 'TopicSections' },
  },
  {
    Icon: MODULE_ICONS.modelTests, tint: colors.modelTest, title: 'Model Tests',
    what: 'Full, timed mock exams that rehearse the real exam’s format and time pressure.',
    how: 'Use these near exam day to rehearse under pressure. Sit one in a quiet 45 minutes, then review every question you missed.',
    nav: { stack: 'Test', screen: 'TestHome' },
  },
  {
    Icon: MODULE_ICONS.progress, tint: colors.primary, title: 'Progress & Weak Areas',
    what: 'Tracks what you’ve practiced and surfaces the questions you keep getting wrong.',
    how: 'Check it regularly and re-drill your weak areas until they stop showing up.',
    nav: { tab: 'Progress' },
  },
];

const STEPS = [
  'Start with the Exam Guide so you know the format and the 4 categories.',
  'Build words in Vocabulary, then learn the Clue Words logic.',
  'Drill Topic Practice section by section — read every explanation.',
  'Rehearse with timed Model Tests and review every miss.',
  'Use Progress & Weak Areas to re-drill what you keep getting wrong.',
];

export function HowToScreen() {
  const navigation = useNavigation<any>();

  const go = (nav: Nav) => {
    if ('tab' in nav) navigation.navigate(nav.tab);
    else if (nav.stack) navigation.navigate(nav.stack, { screen: nav.screen, params: {} });
    else navigation.navigate(nav.screen);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="How to use the app" onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Pass the Finnish taxi exam — even with limited Finnish</Text>
          <Text style={styles.heroSub}>
            Five tools that work together: learn the words, spot the clues, practice real
            questions, and rehearse under exam conditions.
          </Text>
        </View>

        {/* Recommended study plan */}
        <View style={styles.planCard}>
          <Text style={styles.planLabel}>Recommended study plan</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Module cards */}
        <Text style={styles.sectionLabel}>What each section does</Text>
        <View style={styles.modules}>
          {MODULES.map(m => (
            <TouchableOpacity
              key={m.title}
              style={styles.modCard}
              onPress={() => go(m.nav)}
              activeOpacity={0.75}
            >
              <View style={styles.modHeader}>
                <IconChip Icon={m.Icon} tint={m.tint} size={40} iconSize={20} />
                <Text style={styles.modTitle}>{m.title}</Text>
                <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2} />
              </View>
              <Text style={styles.modWhat}>{m.what}</Text>
              <View style={[styles.modHow, { borderLeftColor: m.tint }]}>
                <Text style={styles.modHowText}>{m.how}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Tip: the exam is in Finnish (or Swedish), with no translation into other languages. The clue-word method is your edge —
            most mistakes come from misreading, not from not knowing.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  hero: {
    margin: spacing.md, padding: spacing.md,
    backgroundColor: colors.primary, borderRadius: radius.md,
    ...shadow.md,
  },
  heroTitle: { fontSize: fontSize.lg, fontFamily: font.bold, color: '#fff', lineHeight: 26 },
  heroSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: 8, lineHeight: 20 },

  planCard: {
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  planLabel: {
    fontSize: fontSize.sm, fontFamily: font.semibold, color: colors.text,
    marginBottom: spacing.sm,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  stepNumText: { fontSize: 12, fontFamily: font.bold, color: '#fff' },
  stepText: { flex: 1, fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },

  sectionLabel: {
    fontSize: fontSize.sm, fontFamily: font.semibold, color: colors.textSecondary,
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  modules: { paddingHorizontal: spacing.md, gap: 12 },
  modCard: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    ...shadow.sm,
  },
  modHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconChip: {
    width: 40, height: 40, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  modTitle: { flex: 1, fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  modWhat: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  modHow: {
    marginTop: 10, paddingLeft: 10, borderLeftWidth: 3,
  },
  modHowText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, fontStyle: 'italic' },

  footer: {
    marginHorizontal: spacing.md, marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.warningTint, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.warning + '55',
  },
  footerText: { fontSize: 13, color: colors.text, lineHeight: 19 },
});
