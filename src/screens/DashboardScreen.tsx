import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme/tokens';
import { ProgressRing } from '../components/ui/ProgressRing';
import { Badge } from '../components/ui/Badge';
import { useQuestionStats } from '../store/progressStore';
import { getQuestions } from '../data/loaders';

const TOTAL_QUESTIONS = getQuestions().length;

type HubItem = {
  icon: string; title: string; sub: string; paid: boolean;
  screen: string; stack?: string; wide?: boolean;
};

const HUBS: HubItem[] = [
  { icon: '📚', title: 'Vocabulary', sub: '20 words · 2 pages', paid: false, screen: 'Vocabulary', stack: 'Study' },
  { icon: '🎯', title: 'Clue Words', sub: '10 clue patterns', paid: true, screen: 'ClueWords', stack: 'Study' },
  { icon: '💬', title: 'Topic Practice', sub: '4 categories · 10 Qs', paid: true, screen: 'Practice', stack: 'Study' },
  { icon: '⏱️', title: 'Model Tests', sub: '2 full timed tests', paid: true, screen: 'TestHome', stack: 'Test' },
  { icon: '📊', title: 'Progress & Weak Areas', sub: 'Spaced repetition · review what you missed', paid: false, screen: 'Progress', wide: true },
];

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { answered, accuracy, completion } = useQuestionStats(TOTAL_QUESTIONS);

  const navigate = (hub: HubItem) => {
    if (hub.stack) {
      navigation.navigate(hub.stack, { screen: hub.screen });
    } else {
      navigation.navigate(hub.screen);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.caption}>Keep going — exam day is coming!</Text>
          </View>
        </View>

        {/* Progress card */}
        <View style={styles.progressCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.progressLabel}>Overall progress</Text>
            <Text style={styles.progressPct}>{completion}%</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completion}%` }]} />
            </View>
            <Text style={styles.progressSub}>
              {answered} of {TOTAL_QUESTIONS} questions practiced · {accuracy}% accuracy
            </Text>
          </View>
          <ProgressRing value={completion} size={80} strokeWidth={7} color="#fff" />
        </View>

        {/* Hub grid */}
        <View style={styles.grid}>
          {HUBS.map(hub => (
            <TouchableOpacity
              key={hub.title}
              style={[styles.hubCard, hub.wide && styles.hubCardWide]}
              onPress={() => navigate(hub)}
              activeOpacity={0.75}
            >
              {hub.wide ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={styles.hubIcon}>{hub.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hubTitle}>{hub.title}</Text>
                    <Text style={styles.hubSub}>{hub.sub}</Text>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.hubIcon}>{hub.icon}</Text>
                  <Text style={styles.hubTitle}>{hub.title}</Text>
                  <Text style={styles.hubSub}>{hub.sub}</Text>
                  <Badge type={hub.paid ? 'paid' : 'free'} />
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  greeting: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  caption: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  progressCard: {
    margin: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  progressPct: { fontSize: 28, fontWeight: fontWeight.bold, color: '#fff', marginBottom: 8 },
  progressTrack: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: radius.full, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: radius.full },
  progressSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.md, gap: 12,
    paddingBottom: spacing.lg,
  },
  hubCard: {
    width: '47%', backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    gap: spacing.sm, minHeight: 110,
  },
  hubCardWide: { width: '100%', minHeight: 'auto' },
  hubIcon: { fontSize: 26 },
  hubTitle: { fontSize: 14, fontWeight: fontWeight.semibold, color: colors.text },
  hubSub: { fontSize: 12, color: colors.textSecondary },
});
