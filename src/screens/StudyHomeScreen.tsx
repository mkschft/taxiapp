import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { type LucideIcon } from 'lucide-react-native';
import { Badge } from '../components/ui/Badge';
import { IconChip } from '../components/ui/IconChip';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { MODULE_ICONS } from '../theme/icons';
import { getVocabSets, getVocabWordTotal, getQuestions, getTopicSections } from '../data/loaders';

const MENU: { Icon: LucideIcon; tint: string; title: string; sub: string; screen: string; paid: boolean; params: any }[] = [
  { Icon: MODULE_ICONS.howTo, tint: colors.textSecondary, title: 'How to use the app', sub: 'Start here — what each section is for', screen: 'HowTo', paid: false, params: {} },
  { Icon: MODULE_ICONS.examGuide, tint: colors.primary, title: 'Exam Guide', sub: 'Rules, categories, exam day tips', screen: 'Guide', paid: false, params: {} },
  { Icon: MODULE_ICONS.vocabulary, tint: colors.success, title: 'Vocabulary', sub: `${getVocabSets().length} sets · ${getVocabWordTotal()} words`, screen: 'VocabSets', paid: true, params: {} },
  { Icon: MODULE_ICONS.clueWords, tint: colors.warning, title: 'Clue Words', sub: 'Positive & negative answer-logic words', screen: 'ClueWords', paid: true, params: {} },
  { Icon: MODULE_ICONS.topicPractice, tint: colors.error, title: 'Topic Practice', sub: `${getQuestions().length} questions · ${getTopicSections().length} sections`, screen: 'TopicSections', paid: true, params: {} },
];

export function StudyHomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Learn</Text>
        <Text style={styles.sub}>Build your Finnish foundation</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {MENU.map(item => (
          <TouchableOpacity
            key={item.title}
            style={styles.card}
            onPress={() => navigation.navigate(item.screen, item.params)}
            activeOpacity={0.75}
          >
            <IconChip Icon={item.Icon} tint={item.tint} />
            <View style={styles.info}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>{item.sub}</Text>
            </View>
            <Badge type={item.paid ? 'paid' : 'free'} />
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  scroll: { padding: spacing.md, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    backgroundColor: colors.bg,
    ...shadow.sm,
  },
  iconChip: {
    width: 44, height: 44, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  cardTitle: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  cardSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
});
