import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Lock, UserPlus, type LucideIcon } from 'lucide-react-native';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { MODULE_ICONS } from '../theme/icons';
import { IconChip } from '../components/ui/IconChip';
import { ProgressRing } from '../components/ui/ProgressRing';
import { Badge } from '../components/ui/Badge';
import { AppButton } from '../components/ui/AppButton';
import { useAuth, hasActivePaidPlan } from '../store/authStore';
import { isGuestLocked } from '../lib/access';
import { useProgress } from '../hooks/useProgress';
import { getQuestions, getVocabSets, getVocabWordTotal, getClueGroups, getClueWordTotal, getTopicSections, getModelTests } from '../data/loaders';

const TOTAL_QUESTIONS = getQuestions().length;
const VOCAB_SETS = getVocabSets().length;
const VOCAB_WORDS = getVocabWordTotal();
const CLUE_GROUPS = getClueGroups().length;
const CLUE_WORDS = getClueWordTotal();
const TOPIC_SECTIONS = getTopicSections().length;
const MODEL_TESTS = getModelTests().length;

type HubItem = {
  Icon: LucideIcon; tint: string; title: string; sub: string; paid: boolean;
  screen: string; stack?: string; wide?: boolean;
};

const HUBS: HubItem[] = [
  { Icon: MODULE_ICONS.howTo, tint: colors.textSecondary, title: 'How to use the app', sub: 'New here? Start with this 1-minute guide', paid: false, screen: 'HowTo', stack: 'Study', wide: true },
  { Icon: MODULE_ICONS.examGuide, tint: colors.primary, title: 'Exam Guide', sub: 'Rules · categories', paid: false, screen: 'Guide', stack: 'Study' },
  { Icon: MODULE_ICONS.vocabulary, tint: colors.success, title: 'Vocabulary', sub: `${VOCAB_SETS} sets · ${VOCAB_WORDS} words`, paid: true, screen: 'VocabSets', stack: 'Study' },
  { Icon: MODULE_ICONS.clueWords, tint: colors.warning, title: 'Clue Words', sub: `${CLUE_GROUPS} groups · ${CLUE_WORDS} clue words`, paid: true, screen: 'ClueWords', stack: 'Study' },
  { Icon: MODULE_ICONS.topicPractice, tint: colors.error, title: 'Topic Practice', sub: `${TOTAL_QUESTIONS} questions · ${TOPIC_SECTIONS} sections`, paid: true, screen: 'TopicSections', stack: 'Study' },
  { Icon: MODULE_ICONS.modelTests, tint: colors.modelTest, title: 'Model Tests', sub: `${MODEL_TESTS} full timed tests`, paid: true, screen: 'TestHome', stack: 'Test' },
  { Icon: MODULE_ICONS.progress, tint: colors.primary, title: 'Progress & Weak Areas', sub: 'Spaced repetition · review what you missed', paid: false, screen: 'Progress', wide: true },
];

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { state: auth } = useAuth();
  const isGuest = auth.guest && !auth.user;
  const isPaid = auth.user ? hasActivePaidPlan(auth.user.subscription) : false;
  const { data: progress, loading } = useProgress(!isGuest);

  const totalCompleted = progress?.reduce((sum, item) => sum + item.progress.completed, 0) ?? 0;
  const totalQuestions = progress?.reduce((sum, item) => sum + item.progress.total, 0) ?? 0;
  const completion = totalQuestions === 0 ? 0 : Math.round((totalCompleted / totalQuestions) * 100);

  const navigate = (hub: HubItem) => {
    if (isGuestLocked(hub.screen, isGuest)) {
      navigation.navigate('Signup');
    } else if (hub.screen === 'Progress') {
      navigation.navigate('Progress');
    } else if (hub.stack) {
      navigation.navigate(hub.stack, { screen: hub.screen, params: {} });
    } else {
      navigation.navigate(hub.screen);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.caption}>Keep going — exam day is coming!</Text>
          </View>
        </View>

        {/* Progress card */}
        {isGuest ? (
          <View style={styles.guestCard}>
            <View style={styles.guestIcon}>
              <UserPlus size={20} color={colors.primary} strokeWidth={2.1} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guestTitle}>Track your progress</Text>
              <Text style={styles.guestBody}>
                Create a free account to save your progress and see how close you are to exam day.
              </Text>
            </View>
            <AppButton
              label="Create account"
              onPress={() => navigation.navigate('Signup')}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        ) : (
          <View style={styles.progressCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.progressLabel}>Overall progress</Text>
              <Text style={styles.progressPct}>{loading ? '—' : `${completion}%`}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${completion}%` }]} />
              </View>
              <Text style={styles.progressSub}>
                {totalCompleted} of {totalQuestions} questions practiced
              </Text>
            </View>
            <ProgressRing value={completion} size={80} strokeWidth={7} color="#fff" />
          </View>
        )}

        {/* Hub grid */}
        <View style={styles.grid}>
          {HUBS.map(hub => {
            const locked = isGuestLocked(hub.screen, isGuest);
            return (
              <TouchableOpacity
                key={hub.title}
                style={[styles.hubCard, hub.wide && styles.hubCardWide]}
                onPress={() => navigate(hub)}
                activeOpacity={0.75}
              >
                {hub.wide ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <IconChip Icon={hub.Icon} tint={hub.tint} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.hubTitle}>{hub.title}</Text>
                      <Text style={styles.hubSub}>{hub.sub}</Text>
                    </View>
                    {locked && <Lock size={16} color={colors.textTertiary} strokeWidth={2.2} />}
                  </View>
                ) : (
                  <>
                    <IconChip Icon={hub.Icon} tint={hub.tint} />
                    <Text style={styles.hubTitle}>{hub.title}</Text>
                    <Text style={styles.hubSub}>{hub.sub}</Text>
                    {(locked || !isPaid) && <Badge type={locked ? 'locked' : hub.paid ? 'paid' : 'free'} />}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
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
  greeting: { fontSize: fontSize.lg, fontFamily: font.bold, color: colors.text },
  caption: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  progressCard: {
    margin: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.md,
  },
  progressLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  progressPct: { fontSize: 28, fontFamily: font.bold, color: '#fff', marginBottom: 8 },
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
    gap: spacing.sm, minHeight: 120,
    ...shadow.sm,
  },
  hubCardWide: { width: '100%', minHeight: 'auto' },
  iconChip: {
    width: 44, height: 44, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  hubTitle: { fontSize: 14, fontFamily: font.semibold, color: colors.text },
  hubSub: { fontSize: 12, color: colors.textSecondary, fontFamily: font.regular },
  guestCard: {
    margin: spacing.md,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 8,
  },
  guestIcon: {
    width: 34, height: 34, borderRadius: radius.sm,
    backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  guestTitle: { fontSize: fontSize.md, fontFamily: font.bold, color: colors.text },
  guestBody: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
});
