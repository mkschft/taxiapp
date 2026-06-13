import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getTopicSections, getTopicSectionQuestionIds, getCategories } from '../data/loaders';
import { useProgress } from '../store/progressStore';
import type { StudyStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<StudyStackParamList, 'TopicSections'>;
};

const CAT = Object.fromEntries(getCategories().map(c => [c.id, c]));
const SECTIONS = getTopicSections();

export function TopicSectionsScreen({ navigation }: Props) {
  const { state } = useProgress();

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
          const pct = answered > 0 ? Math.round((correct / answered) * 100) : null;

          return (
            <TouchableOpacity
              key={section.id}
              style={styles.card}
              activeOpacity={0.78}
              onPress={() => navigation.navigate('TopicLessons', { sectionId: section.id })}
            >
              <View style={[styles.iconChip, { backgroundColor: tint + '18' }]}>
                <Text style={styles.emoji}>{cat?.icon ?? '📚'}</Text>
              </View>

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
                  {pct != null && (
                    <View style={[styles.tag, { backgroundColor: colors.successTint }]}>
                      <Text style={[styles.tagText, { color: colors.success }]}>{pct}% correct</Text>
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
