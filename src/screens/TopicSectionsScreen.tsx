import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Check } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { ProgressRing } from '../components/ui/ProgressRing';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getTopicSections, getTopicSectionQuestionIds, getCategories } from '../data/loaders';
import { usePaywall } from '../store/paywallStore';
import { useAuth } from '../store/authStore';
import { useProgress } from '../hooks/useProgress';
import { getSectionProgress } from '../lib/progressLookup';
import { formatRelativeDay } from '../lib/time';
import { localizedPair } from '../i18n/content';
import { Paywall } from '../components/Paywall';
import type { StudyStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<StudyStackParamList, 'TopicSections'>;
};

const CAT = Object.fromEntries(getCategories().map(c => [c.id, c]));
const SECTIONS = getTopicSections();

export function TopicSectionsScreen({ navigation }: Props) {
  const { isUnlocked } = usePaywall();
  const { state: auth } = useAuth();
  const { data: progress } = useProgress(!!auth.user);
  const { t, i18n } = useTranslation();
  const rootNav = useNavigation<any>();

  if (!isUnlocked('topic_practice')) {
    return (
      <Paywall
        title={t('topic.title')}
        blurb={t('topic.paywallBlurb')}
        perks={[t('topic.paywallPerkSections', { n: SECTIONS.length }), t('topic.paywallPerkExplained'), t('topic.paywallPerkPassMark')]}
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard' as never))}
        onSubscribe={() => rootNav.navigate('Pricing', { redirectTab: 'Study', redirectScreen: 'TopicSections' })}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={t('topic.title')} onBack={() => navigation.goBack()} />

      <View style={styles.subHeader}>
        <Text style={styles.caption}>
          {t('topic.sectionsCaption')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {SECTIONS.map(section => {
          const cat = CAT[section.category_id];
          const tint = cat?.color ?? colors.primary;
          const sectionProgress = getSectionProgress(progress, cat?.name_en ?? '');
          const answered = sectionProgress?.completed ?? 0;
          const total = sectionProgress?.total ?? section.question_count;
          const pctDone = sectionProgress?.percentage ?? 0;
          const lastPracticed = formatRelativeDay(sectionProgress?.lastPracticedAt);
          const { primary, secondary } = localizedPair(section.name_fi, section.name_en, i18n.language);

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
              />

              <View style={styles.info}>
                <Text style={styles.cardTitle} numberOfLines={2}>{primary}</Text>
                <Text style={styles.cardFi} numberOfLines={1}>{secondary}</Text>
                <Text style={styles.cardSub}>
                  {t('topic.sectionMeta', { questions: section.question_count, lessons: section.lesson_count })}
                </Text>
                <View style={styles.metaRow}>
                  <View style={[styles.tag, { backgroundColor: colors.surface }]}>
                    <Text style={styles.tagText}>
                      {lastPracticed
                        ? t('topic.lastPracticed', { when: lastPracticed })
                        : t('topic.doneCount', { completed: answered, total })}
                    </Text>
                  </View>
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
