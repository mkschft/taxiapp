import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CheckCircle2, AlertTriangle, HelpCircle, Link2, type LucideIcon } from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getClueWords, getQuestions } from '../data/loaders';
import type { ClueGroup, ClueWord } from '../data/types';

const TABS: { key: ClueGroup; label: string; Icon: LucideIcon }[] = [
  { key: 'positive', label: 'Positive', Icon: CheckCircle2 },
  { key: 'negative', label: 'Negative', Icon: AlertTriangle },
  { key: 'wh', label: 'WH-words', Icon: HelpCircle },
  { key: 'conjunction', label: 'Conjunctions', Icon: Link2 },
];

function ClueCard({ cw }: { cw: ClueWord }) {
  const isPos = cw.group === 'positive';
  const isNeg = cw.group === 'negative';
  return (
    <View style={[styles.card, isPos && styles.cardPos, isNeg && styles.cardNeg]}>
      <View style={styles.cardHeader}>
        <View style={[styles.pill, isPos ? styles.pillPos : isNeg ? styles.pillNeg : styles.pillNeutral]}>
          <Text style={[styles.pillText, isPos ? styles.pillTextPos : isNeg ? styles.pillTextNeg : styles.pillTextNeutral]}>
            {cw.phrase_fi}
          </Text>
        </View>
        <View style={[styles.signal, isPos ? styles.signalCorrect : isNeg ? styles.signalWrong : styles.signalNeutral]}>
          <Text style={styles.signalText}>{isPos ? 'CORRECT' : isNeg ? 'WRONG' : 'CONTEXT'}</Text>
        </View>
      </View>
      <Text style={styles.meaning}><Text style={{ fontFamily: font.semibold }}>Meaning: </Text>"{cw.phrase_en}"</Text>
      <Text style={styles.effect}>{cw.effect}</Text>
      {cw.exceptions.length > 0 && (
        <View style={styles.trap}>
          <Text style={styles.trapLabel}>EXCEPTION</Text>
          {cw.exceptions.map((ex, i) => (
            <Text key={i} style={styles.trapText}>{ex}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

export function ClueWordsScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<ClueGroup>('positive');
  const allClues = getClueWords();
  const filtered = allClues.filter(c => c.group === activeTab);
  const questions = getQuestions();

  const practiceClueQIds = allClues
    .filter(c => c.group === activeTab)
    .flatMap(c => c.linked_question_ids);
  const uniqueIds = [...new Set(practiceClueQIds)].slice(0, 8);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Clue Words" onBack={() => navigation.goBack()} />

      <View style={styles.intro}>
        <Text style={styles.introText}>
          The Finnish exam has hidden patterns. Learn these words and predict the answer — even with weak Finnish.
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <t.Icon size={16} color={activeTab === t.key ? colors.primary : colors.textSecondary} strokeWidth={2.2} />
            <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {filtered.map(cw => <ClueCard key={cw.id} cw={cw} />)}

        {uniqueIds.length > 0 && (
          <View style={styles.practiceBtn}>
            <AppButton
              label={`Practice with ${filtered.length} clue pattern${filtered.length !== 1 ? 's' : ''} →`}
              onPress={() => navigation.navigate('Practice', {
                questionId: uniqueIds[0],
                queue: uniqueIds,
                queueIndex: 0,
                sourceLabel: 'Clue Words Practice',
              })}
            />
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  intro: { padding: spacing.md, paddingBottom: 0 },
  introText: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  tabs: {
    flexDirection: 'row', paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, gap: 8,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  tabLabel: { fontSize: 10, fontFamily: font.semibold, color: colors.textSecondary },
  tabLabelActive: { color: colors.primary },
  scroll: { padding: spacing.md },
  card: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    marginBottom: 12, backgroundColor: colors.bg,
    ...shadow.sm,
  },
  cardPos: { borderColor: colors.success + '55' },
  cardNeg: { borderColor: colors.error + '55' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pill: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1.5, maxWidth: '65%' },
  pillPos: { backgroundColor: colors.successTint, borderColor: colors.success },
  pillNeg: { backgroundColor: colors.errorTint, borderColor: colors.error },
  pillNeutral: { backgroundColor: colors.surface, borderColor: colors.border },
  pillText: { fontSize: 13, fontFamily: font.semibold },
  pillTextPos: { color: colors.success },
  pillTextNeg: { color: colors.error },
  pillTextNeutral: { color: colors.textSecondary },
  signal: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  signalCorrect: { backgroundColor: colors.success },
  signalWrong: { backgroundColor: colors.error },
  signalNeutral: { backgroundColor: colors.textSecondary },
  signalText: { fontSize: 10, fontFamily: font.bold, color: '#fff', letterSpacing: 0.5 },
  meaning: { fontSize: 13, color: colors.textSecondary, marginBottom: 6, lineHeight: 18 },
  effect: { fontSize: 13, color: colors.text, lineHeight: 18, marginBottom: 6 },
  trap: {
    backgroundColor: colors.warningTint, borderRadius: radius.sm,
    padding: 10, marginTop: 4,
  },
  trapLabel: { fontSize: 11, fontFamily: font.bold, color: colors.warning, marginBottom: 4, letterSpacing: 0.5 },
  trapText: { fontSize: 12, color: colors.text, lineHeight: 17 },
  practiceBtn: { marginTop: spacing.md },
});
