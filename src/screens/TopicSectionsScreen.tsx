import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, Check } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { ProgressRing } from '../components/ui/ProgressRing';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getTopicSections, getTopicSectionQuestionIds, getCategories } from '../data/loaders';
import { useProgress } from '../store/progressStore';
import { usePaywall } from '../store/paywallStore';
import { Paywall } from '../components/Paywall';
import type { StudyStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<StudyStackParamList, 'TopicSections'>;
};

const CAT = Object.fromEntries(getCategories().map(c => [c.id, c]));
const SECTIONS = getTopicSections();

export function TopicSectionsScreen({ navigation }: Props) {
  const { state } = useProgress();
  const { isUnlocked, unlock } = usePaywall();

  if (!isUnlocked('topic_practice')) {
    return (
      <Paywall
        title="Topic Practice"
        blurb="Drill real exam-style questions one official section at a time, with the real pass thresholds."
        perks={[`${SECTIONS.length} official exam sections`, 'Every answer explained, with the clue lens', 'Practise at the real per-section pass mark']}
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard' as never))}
        onSkip={() => unlock('topic_practice')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Topic Practice" onBack={() => navigation.goBack()} />

      <View style={styles.subHeader}>
        <Text style={styles.caption}>
          Practise by exam section — pick a topic, then a focused set of questions.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {SECTIONS.map(section => {
          const cat = CAT[section.category_id];
          const tint = cat?.color ?? colors.primary;
          const qIds = getTopicSectionQuestionIds(section.id);
          const answered = qIds.filter(id => state.questions[id]?.answered).length;
          const correct = qIds.filter(id => state.questions[id]?.correct).length;
          const pctDone = section.question_count > 0 ? Math.round((answered / section.question_count) * 100) : 0;
          const pctCorrect = answered > 0 ? Math.round((correct / answered) * 100) : null;
          const done = section.question_count > 0 && answered >= section.question_count;

          return (
            <TouchableOpacity
              key={section.id}
              style={styles.card}
              activeOpacity={0.78}
              onPress={() => navigation.navigate('TopicLessons', { sectionId: section.id })}
            >
              <ProgressRing
                value={pctDone}
                size={48}
                strokeWidth={5}
                color={tint}
                trackColor={colors.surfaceAlt}
                valueFontSize={12}
              >
                {done ? <Check size={20} color={tint} strokeWidth={2.8} /> : undefined}
              </ProgressRing>

              <View style={styles.info}>
                <Text style={styles.cardTitle} numberOfLines={2}>{section.name_en}</Text>
                <Text style={styles.cardFi} numberOfLines={1}>{section.name_fi}</Text>
                <Text style={styles.cardSub}>
                  {section.question_count} questions · {section.lesson_count} lessons
                </Text>
                <View style={styles.metaRow}>
                  <View style={[styles.tag, { backgroundColor: colors.surface }]}>
                    <Text style={styles.tagText}>{answered}/{section.question_count} done</Text>
                  </View>
                  {pctCorrect != null && (
                    <View style={[styles.tag, { backgroundColor: colors.successTint }]}>
                      <Text style={[styles.tagText, { color: colors.success }]}>{pctCorrect}% correct</Text>
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
  emoji: { fontSize: 22 },
  info: { flex: 1, gap: 2 },
  cardTitle: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text, lineHeight: 21 },
  cardFi: { fontSize: 12, fontStyle: 'italic', color: colors.textTertiary },
  cardSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: { borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 3 },
  tagText: { fontSize: 11, fontFamily: font.semibold, color: colors.textSecondary },
});
