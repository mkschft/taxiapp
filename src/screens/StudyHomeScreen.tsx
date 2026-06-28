import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { type LucideIcon } from 'lucide-react-native';
import { useAuth, hasActivePaidPlan } from '../store/authStore';
import { Badge } from '../components/ui/Badge';
import { IconChip } from '../components/ui/IconChip';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { MODULE_ICONS } from '../theme/icons';
import { getVocabSets, getVocabWordTotal, getQuestions, getTopicSections } from '../data/loaders';
import { GuestOverlay } from '../components/GuestOverlay';

const MENU: { id: string; Icon: LucideIcon; tint: string; screen: string; paid: boolean; params: any }[] = [
  { id: 'howTo', Icon: MODULE_ICONS.howTo, tint: colors.textSecondary, screen: 'HowTo', paid: false, params: {} },
  { id: 'examGuide', Icon: MODULE_ICONS.examGuide, tint: colors.primary, screen: 'Guide', paid: false, params: {} },
  { id: 'vocabulary', Icon: MODULE_ICONS.vocabulary, tint: colors.success, screen: 'VocabSets', paid: true, params: {} },
  { id: 'clueWords', Icon: MODULE_ICONS.clueWords, tint: colors.warning, screen: 'ClueWords', paid: true, params: {} },
  { id: 'topicPractice', Icon: MODULE_ICONS.topicPractice, tint: colors.error, screen: 'TopicSections', paid: true, params: {} },
];

export function StudyHomeScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { state: auth } = useAuth();
  const isPaid = auth.user ? hasActivePaidPlan(auth.user.subscription) : false;

  const menuText: Record<string, { title: string; sub: string }> = {
    howTo: { title: t('studyHome.howToTitle'), sub: t('studyHome.howToSub') },
    examGuide: { title: t('studyHome.examGuideTitle'), sub: t('studyHome.examGuideSub') },
    vocabulary: {
      title: t('studyHome.vocabularyTitle'),
      sub: t('studyHome.vocabSub', { sets: getVocabSets().length, words: getVocabWordTotal() }),
    },
    clueWords: { title: t('studyHome.clueWordsTitle'), sub: t('studyHome.clueWordsSub') },
    topicPractice: {
      title: t('studyHome.topicPracticeTitle'),
      sub: t('studyHome.topicSub', { questions: getQuestions().length, sections: getTopicSections().length }),
    },
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('studyHome.title')}</Text>
        <Text style={styles.sub}>{t('studyHome.subtitle')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {MENU.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => navigation.navigate(item.screen, item.params)}
            activeOpacity={0.75}
          >
            <IconChip Icon={item.Icon} tint={item.tint} />
            <View style={styles.info}>
              <Text style={styles.cardTitle}>{menuText[item.id].title}</Text>
              <Text style={styles.cardSub}>{menuText[item.id].sub}</Text>
            </View>
            {!isPaid && <Badge type={item.paid ? 'paid' : 'free'} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <GuestOverlay blurb={t('studyHome.guestBlurb')} />
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
