import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Badge } from '../components/ui/Badge';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme/tokens';
import { getVocabPageCount, getQuestions } from '../data/loaders';

const MENU = [
  { icon: '📚', title: 'Vocabulary', sub: `${getVocabPageCount() * 10} words across ${getVocabPageCount()} pages`, screen: 'Vocabulary', paid: false, params: { page: 1 } },
  { icon: '🎯', title: 'Clue Words', sub: 'Positive · Negative · WH-words · Conjunctions', screen: 'ClueWords', paid: true, params: {} },
  { icon: '💬', title: 'Practice All Questions', sub: `${getQuestions().length} questions · by category`, screen: 'Practice', paid: true, params: { questionId: getQuestions()[0]?.id, queue: getQuestions().map(q => q.id), queueIndex: 0, sourceLabel: 'All Questions' } },
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
            <Text style={styles.icon}>{item.icon}</Text>
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
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  scroll: { padding: spacing.md, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    backgroundColor: colors.bg,
  },
  icon: { fontSize: 28 },
  info: { flex: 1 },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  cardSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
});
