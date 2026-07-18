import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Check, AlertTriangle, HelpCircle, Link2, ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { getClueGroups } from '../data/loaders';
import { useAuth } from '../store/authStore';
import { useStartQuiz } from '../hooks/useStartQuiz';
import { AuthPrompt } from '../components/AuthPrompt';
import { usePaywall } from '../store/paywallStore';
import { Paywall } from '../components/Paywall';
import type { ClueTone } from '../data/types';
import type { DashboardStackParamList } from '../navigation/types';

type Props = {
  route: RouteProp<DashboardStackParamList, 'ClueWords'>;
};

const GROUP_ICON: Record<string, LucideIcon> = {
  positive: Check,
  negative: AlertTriangle,
  wh: HelpCircle,
  conjunction: Link2,
};

function toneColors(tone: ClueTone) {
  if (tone === 'positive') return { fg: colors.success, bg: colors.successTint };
  if (tone === 'negative') return { fg: colors.error, bg: colors.errorTint };
  return { fg: colors.primary, bg: colors.primaryTint };
}

const GROUPS = getClueGroups();

export function ClueWordsScreen({ route }: Props) {
  const [mode, setMode] = useState<'practice' | 'quiz'>(route.params?.mode === 'quiz' ? 'quiz' : 'practice');
  const isQuizMode = mode === 'quiz';
  const navigation = useNavigation<any>();
  const { state: authState } = useAuth();
  const { startQuiz } = useStartQuiz();
  const { isUnlocked } = usePaywall();
  const { t } = useTranslation();
  const isAuthenticated = !!authState.user;

  if (!isUnlocked('clue_words')) {
    return (
      <Paywall
        title={t('clue.title')}
        blurb={t('clue.paywallBlurb')}
        perks={[t('clue.paywallPerk1'), t('clue.paywallPerk2'), t('clue.paywallPerk3')]}
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
        onSubscribe={() => navigation.navigate('Pricing', { redirectTab: 'Dashboard', redirectScreen: 'ClueWords' })}
      />
    );
  }

  const headerTitle = isQuizMode ? `${t('clue.title')} · ${t('quiz.title')}` : t('clue.title');

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={headerTitle}
        onBack={() => navigation.goBack()}
        right={
          !isQuizMode ? (
            <Pressable onPress={() => setMode('quiz')} style={styles.modeBtn} hitSlop={4}>
              <Text style={styles.modeBtnText}>{t('dashboard.takeQuiz')}</Text>
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          {t('clue.intro')}
        </Text>

        {!isAuthenticated && (
          <AuthPrompt
            title={t('clue.authTitle')}
            body={t('clue.authBody')}
          />
        )}

        {GROUPS.map((group, index) => {
          const Icon = GROUP_ICON[group.id] ?? HelpCircle;
          const tc = toneColors(group.tone);
          const kicker = t('clue.groupHeader', { n: index + 1, count: group.word_count });

          return (
            <Pressable
              key={group.id}
              onPress={() =>
                isQuizMode
                  ? startQuiz(`clue/${group.id}`, 'ClueQuiz', { groupId: group.id })
                  : navigation.navigate('ClueLesson', { groupId: group.id, index: 1 })
              }
              style={({ pressed }) => [styles.card, pressed && styles.btnPressed]}
            >
              <View style={styles.cardHead}>
                <View style={[styles.iconChip, { backgroundColor: tc.bg }]}>
                  <Icon size={22} color={tc.fg} strokeWidth={2.3} />
                </View>
                <View style={styles.headInfo}>
                  <Text style={styles.kicker}>{kicker}</Text>
                  <Text style={styles.cardTitle}>{group.label}</Text>
                  <Text style={styles.cardBlurb}>{group.blurb}</Text>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2.2} />
              </View>
            </Pressable>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, gap: 12 },
  intro: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: 2 },
  card: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    backgroundColor: colors.bg, padding: spacing.md, gap: 12,
    ...shadow.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconChip: {
    width: 44, height: 44, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headInfo: { flex: 1, gap: 2 },
  kicker: { fontSize: 12, fontFamily: font.semibold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3 },
  cardTitle: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  cardBlurb: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18 },
  btnPressed: { transform: [{ scale: 0.97 }], opacity: 0.95 },
  modeBtn: {
    height: 32, borderRadius: radius.full, paddingHorizontal: spacing.sm + 2,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  modeBtnText: { fontSize: 13, fontFamily: font.semibold, color: '#fff' },
});
