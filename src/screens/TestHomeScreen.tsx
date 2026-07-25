import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Clock, ClipboardList, CircleCheck, Lock } from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { AlertDialog } from '../components/ui/AlertDialog';
import { localizedPair } from '../i18n/content';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { useBreakpoint } from '../theme/breakpoints';
import { getModelTests } from '../data/loaders';
import { useStartQuiz } from '../hooks/useStartQuiz';
import { usePaywall } from '../store/paywallStore';

export function TestHomeScreen() {
  const navigation = useNavigation<any>();
  const { isCompact } = useBreakpoint();
  const { t, i18n } = useTranslation();
  const tests = getModelTests();
  const { startQuiz, loading, error, clearError } = useStartQuiz();
  const { isMockTestUnlocked } = usePaywall();

  return (
    <SafeAreaView style={styles.safe}>
      {isCompact && (
        <View style={styles.header}>
          <Text style={styles.title}>{t('testHome.title')}</Text>
          <Text style={styles.sub}>{t('testHome.subtitle')}</Text>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, !isCompact && styles.scrollGrid]}
      >
        {tests.map(test => {
          const { primary } = localizedPair(test.title_fi, test.title_en, i18n.language);
          const unlocked = isMockTestUnlocked(test.id);
          return (
            <View key={test.id} style={[styles.testCard, !unlocked && styles.testCardLocked, !isCompact && styles.testCardGrid]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.testTitle, !isCompact && styles.testTitleDesktop]}>{primary}</Text>
                {!unlocked && <Lock size={16} color={colors.textTertiary} strokeWidth={2.2} />}
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}><Clock size={13} color={colors.textSecondary} strokeWidth={2.2} /><Text style={styles.meta}>{t('testHome.minutes', { n: test.time_minutes })}</Text></View>
                <View style={styles.metaItem}><ClipboardList size={13} color={colors.textSecondary} strokeWidth={2.2} /><Text style={styles.meta}>{t('common.questionsCount', { n: test.question_ids.length })}</Text></View>
                <View style={styles.metaItem}><CircleCheck size={13} color={colors.textSecondary} strokeWidth={2.2} /><Text style={styles.meta}>{t('testHome.pass', { n: test.pass_mark })}</Text></View>
              </View>
              {unlocked ? (
                <AppButton
                  label={`${t('testHome.startTest')} →`}
                  disabled={loading}
                  onPress={() => startQuiz(`model-test/${test.id}`, 'ModelTest', { testId: test.id })}
                  style={{ marginTop: spacing.sm }}
                />
              ) : (
                <AppButton
                  label={t('testHome.unlock')}
                  variant="secondary"
                  onPress={() => navigation.navigate('Pricing', { redirectTab: 'Test', redirectScreen: 'TestHome' })}
                  style={{ marginTop: spacing.sm }}
                />
              )}
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>

      <AlertDialog
        visible={!!error}
        title={t('common.error')}
        message={error ?? undefined}
        buttonLabel={t('common.ok')}
        variant="danger"
        onDismiss={clearError}
      />
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
  scroll: { padding: spacing.md },
  scrollGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.md,
  },
  testCard: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, marginBottom: 14,
    backgroundColor: colors.bg,
    ...shadow.sm,
  },
  testCardLocked: { backgroundColor: colors.surfaceAlt },
  testCardGrid: {
    width: '48%',
    marginBottom: 0,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  testTitle: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  testTitleDesktop: { fontSize: fontSize.lg },
  scoreBadge: {
    borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  badgePass: { backgroundColor: colors.successTint, borderColor: colors.success },
  badgeFail: { backgroundColor: colors.errorTint, borderColor: colors.error },
  scoreBadgeText: { fontSize: 12, fontFamily: font.bold },
  metaRow: { flexDirection: 'row', gap: 14, marginBottom: 4, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 13, color: colors.textSecondary },
  lastScore: { fontSize: 12, fontFamily: font.medium, marginTop: 2 },
  authPrompt: { flex: 1, justifyContent: 'center', padding: spacing.md },
});
