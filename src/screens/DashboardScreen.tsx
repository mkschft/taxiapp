import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Lock, UserPlus, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { MODULE_ICONS, CategoryIcon } from '../theme/icons';
import { IconChip } from '../components/ui/IconChip';
import { ProgressRing } from '../components/ui/ProgressRing';
import { Badge } from '../components/ui/Badge';
import { AppButton } from '../components/ui/AppButton';
import { useAuth } from '../store/authStore';
import { isGuestLocked } from '../lib/access';
import { useProgress } from '../hooks/useProgress';
import {
  getQuestions, getVocabSets, getVocabWordTotal, getClueGroups, getClueWordTotal,
  getModelTests, getCategories, getTopicSections,
} from '../data/loaders';

const TOTAL_QUESTIONS = getQuestions().length;
const VOCAB_SETS = getVocabSets().length;
const VOCAB_WORDS = getVocabWordTotal();
const CLUE_GROUPS = getClueGroups().length;
const CLUE_WORDS = getClueWordTotal();
const MODEL_TESTS = getModelTests().length;

// Hero: the four official exam categories (Topic Practice sections) — the core
// curriculum, so they lead the dashboard. Ordered by the section `order` field.
const CAT = Object.fromEntries(getCategories().map(c => [c.id, c]));
const TOPIC_SECTIONS = [...getTopicSections()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

type HubItem = {
  Icon: LucideIcon; tint: string; title: string; sub: string; paid: boolean;
  screen: string; stack?: string;
};

// Everything below the hero. Topic Practice is no longer here — it's the hero.
const SECONDARY: HubItem[] = [
  { Icon: MODULE_ICONS.examGuide, tint: colors.primary, title: 'Exam Guide', sub: 'Rules · categories · exam day', paid: false, screen: 'Guide', stack: 'Study' },
  { Icon: MODULE_ICONS.modelTests, tint: colors.modelTest, title: 'Model Tests', sub: `${MODEL_TESTS} full timed tests`, paid: true, screen: 'TestHome', stack: 'Test' },
  { Icon: MODULE_ICONS.vocabulary, tint: colors.success, title: 'Vocabulary', sub: `${VOCAB_SETS} sets · ${VOCAB_WORDS} words`, paid: true, screen: 'VocabSets', stack: 'Study' },
  { Icon: MODULE_ICONS.clueWords, tint: colors.warning, title: 'Clue Words', sub: `${CLUE_GROUPS} groups · ${CLUE_WORDS} clue words`, paid: true, screen: 'ClueWords', stack: 'Study' },
];

// Low-priority destinations rendered as lightweight text links.
const LINKS: { title: string; screen: string; stack?: string }[] = [
  { title: 'How to use the app', screen: 'HowTo', stack: 'Study' },
  { title: 'Progress & weak areas', screen: 'Progress' },
];

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { state: auth } = useAuth();
  const isGuest = auth.guest && !auth.user;
  const { data: progress, loading } = useProgress(!isGuest);

  const totalCompleted = progress?.reduce((sum, item) => sum + item.progress.completed, 0) ?? 0;
  const totalQuestions = progress?.reduce((sum, item) => sum + item.progress.total, 0) ?? 0;
  const completion = totalQuestions === 0 ? 0 : Math.round((totalCompleted / totalQuestions) * 100);

  // Per-section completion comes from the backend progress feed, matched by the
  // official category name — same mapping ProgressScreen uses.
  const official = progress?.find(item => item.mainCategory.name === 'Official');
  const sectionPct = (categoryId: string, fallbackName: string) => {
    const name = CAT[categoryId]?.name_en ?? fallbackName;
    const sub = official?.subcategories.find(
      (s: { category: { name: string }; percentage: number }) => s.category.name === name
    );
    return sub?.percentage ?? 0;
  };

  // Topic Practice is paid/guest-gated; the hero tiles inherit that rule.
  const topicLocked = isGuestLocked('TopicSections', isGuest);

  const openSection = (sectionId: string) => {
    if (topicLocked) navigation.navigate('Signup');
    else navigation.navigate('Study', { screen: 'TopicLessons', params: { sectionId } });
  };

  const openHub = (screen: string, stack?: string) => {
    if (isGuestLocked(screen, isGuest)) navigation.navigate('Signup');
    else if (screen === 'Progress') navigation.navigate('Progress');
    else if (stack) navigation.navigate(stack, { screen, params: {} });
    else navigation.navigate(screen);
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
            <ProgressRing value={completion} size={80} strokeWidth={7} color="#fff" trackColor="rgba(255,255,255,0.28)" />
          </View>
        )}

        {/* HERO — Topic Practice categories (core curriculum) */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Topic Practice</Text>
          <Text style={styles.sectionSub}>The core exam curriculum — practise by category</Text>
        </View>
        <View style={styles.grid}>
          {TOPIC_SECTIONS.map(section => {
            const cat = CAT[section.category_id];
            const tint = cat?.color ?? colors.primary;
            const pct = sectionPct(section.category_id, section.name_en);
            return (
              <TouchableOpacity
                key={section.id}
                style={styles.topicCard}
                onPress={() => openSection(section.id)}
                activeOpacity={0.78}
              >
                <View style={styles.topicTop}>
                  <View style={[styles.topicIcon, { backgroundColor: tint + '18' }]}>
                    <CategoryIcon id={section.category_id} size={22} color={tint} />
                  </View>
                  {topicLocked && <Lock size={15} color={colors.textTertiary} strokeWidth={2.2} />}
                </View>
                <Text style={styles.topicTitle} numberOfLines={2}>{cat?.name_en ?? section.name_en}</Text>
                <Text style={styles.topicFi} numberOfLines={1}>{cat?.name_fi ?? section.name_fi}</Text>
                <Text style={styles.topicSub}>{section.question_count} questions</Text>
                <View style={styles.topicTrack}>
                  <View style={[styles.topicFill, { width: `${pct}%`, backgroundColor: tint }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SECONDARY — other modules, as full-width rows */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>More</Text>
        </View>
        <View style={styles.rows}>
          {SECONDARY.map(hub => {
            const locked = isGuestLocked(hub.screen, isGuest);
            return (
              <TouchableOpacity
                key={hub.title}
                style={styles.hubRow}
                onPress={() => openHub(hub.screen, hub.stack)}
                activeOpacity={0.78}
              >
                <IconChip Icon={hub.Icon} tint={hub.tint} />
                <View style={styles.rowInfo}>
                  <Text style={styles.hubTitle}>{hub.title}</Text>
                  <Text style={styles.hubSub}>{hub.sub}</Text>
                </View>
                <Badge type={locked ? 'locked' : hub.paid ? 'paid' : 'free'} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* LINKS — low-priority destinations */}
        <View style={styles.links}>
          {LINKS.map(link => (
            <TouchableOpacity
              key={link.title}
              style={styles.linkRow}
              onPress={() => openHub(link.screen, link.stack)}
              activeOpacity={0.6}
            >
              <Text style={styles.linkText}>{link.title}</Text>
              <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2.2} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: spacing.lg }} />
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

  sectionHead: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.md, fontFamily: font.bold, color: colors.text },
  sectionSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.md, gap: 12,
  },

  // Hero topic tiles — slightly stronger than secondary cards
  topicCard: {
    width: '47%', backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.borderStrong,
    borderRadius: radius.md, padding: spacing.md,
    gap: spacing.sm, minHeight: 128,
    ...shadow.sm,
  },
  topicTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topicIcon: {
    width: 44, height: 44, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  topicTitle: { fontSize: 14, fontFamily: font.semibold, color: colors.text, lineHeight: 19 },
  topicFi: { fontSize: 11, fontStyle: 'italic', color: colors.textTertiary },
  topicSub: { fontSize: 12, color: colors.textSecondary, fontFamily: font.regular },
  topicTrack: {
    height: 5, backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full, overflow: 'hidden', marginTop: 'auto',
  },
  topicFill: { height: '100%', borderRadius: radius.full },

  // Secondary modules — full-width horizontal rows
  rows: { paddingHorizontal: spacing.md, gap: 12 },
  hubRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    ...shadow.sm,
  },
  rowInfo: { flex: 1 },
  hubTitle: { fontSize: 14, fontFamily: font.semibold, color: colors.text },
  hubSub: { fontSize: 12, color: colors.textSecondary, fontFamily: font.regular },

  // Text links
  links: { paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: 2 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  linkText: { fontSize: fontSize.sm, fontFamily: font.medium, color: colors.textSecondary },

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
