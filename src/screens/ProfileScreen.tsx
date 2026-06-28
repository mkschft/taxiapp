import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Alert, Platform, Modal, Pressable, Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Target, CreditCard, Gift, HelpCircle, Trash2,
  ChevronRight, CalendarDays, Languages, Bookmark, type LucideIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/ui/AppButton';
import { AppInput } from '../components/ui/AppInput';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { setAppLanguage, type AppLanguage } from '../i18n';
import { useAuth } from '../store/authStore';
import { useSavedQuestions } from '../store/savedQuestionsStore';
import { clearAll } from '../store/storage';
import { updateExpectedExamDate } from '../lib/authApi';
import { useProgress } from '../hooks/useProgress';
import { GuestOverlay } from '../components/GuestOverlay';

const HELP_URL = 'https://taxipilot.fi';

/** today + n weeks, as an ISO date string (YYYY-MM-DD). */
function weeksFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n * 7);
  return d.toISOString().slice(0, 10);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
function isValidExamDate(s: string): boolean {
  if (!ISO_DATE.test(s)) return false;
  const t = new Date(s + 'T00:00:00').getTime();
  return !Number.isNaN(t);
}

function SettingRow({
  Icon, tint, title, subtitle, onPress, right,
}: {
  Icon: LucideIcon; tint?: string; title: string; subtitle?: string;
  onPress?: () => void; right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={[styles.settingIconChip, { backgroundColor: (tint ?? colors.textSecondary) + '18' }]}>
        <Icon size={18} color={tint ?? colors.textSecondary} strokeWidth={2.1} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSub}>{subtitle}</Text>}
      </View>
      {right ?? <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2} />}
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { state: auth, clearAuth, updateUser } = useAuth();
  const isGuest = auth.guest && !auth.user;
  const { data: progress } = useProgress(!isGuest);
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'fi' ? 'fi' : 'en') as AppLanguage;
  const { saved } = useSavedQuestions();

  const totalCompleted = progress?.reduce((sum, item) => sum + item.progress.completed, 0) ?? 0;
  const totalQuestions = progress?.reduce((sum, item) => sum + item.progress.total, 0) ?? 0;
  const completion = totalQuestions === 0 ? 0 : Math.round((totalCompleted / totalQuestions) * 100);
  const userName = auth.user?.name ?? t('profile.yourName');
  const initial = userName ? userName[0].toUpperCase() : '?';
  const examDate = auth.user?.expectedExamDate ?? null;

  const [dateModal, setDateModal] = useState(false);
  const [dateInput, setDateInput] = useState(examDate ?? '');
  const [dateError, setDateError] = useState<string | null>(null);
  const [savingDate, setSavingDate] = useState(false);

  const daysLeft = examDate
    ? Math.max(0, Math.round((new Date(examDate).getTime() - Date.now()) / 86400000))
    : null;

  const setExamDate = async (iso: string | null) => {
    setDateError(null);

    setSavingDate(true);
    try {
      await updateExpectedExamDate(iso);
      await updateUser({ expectedExamDate: iso });
      setDateModal(false);
    } catch (err: any) {
      setDateError(err?.message ?? t('profile.examDateSaveError'));
    } finally {
      setSavingDate(false);
    }
  };

  const openDateModal = () => {
    setDateInput(examDate ?? '');
    setDateError(null);
    setDateModal(true);
  };

  const saveTypedDate = async () => {
    if (!isValidExamDate(dateInput.trim())) {
      setDateError(t('profile.examDateInvalid'));
      return;
    }
    await setExamDate(dateInput.trim());
  };

  const subscription = auth.user?.subscription;
  const isPaid = subscription && subscription.planType !== 'free_preview' && subscription.isActive;
  const subDaysLeft = subscription?.expiresAt
    ? Math.max(0, Math.ceil((subscription.expiresAt - Date.now()) / 86400000))
    : null;

  const handleManageSub = () => {
    navigation.navigate('Pricing');
  };

  const handleHelp = () => {
    Linking.openURL(HELP_URL).catch(() =>
      Alert.alert(t('profile.helpFaq'), t('profile.helpFaqBody', { url: HELP_URL })),
    );
  };

  const handleLogout = () => {
    const doLogout = async () => {
      await clearAuth();
      navigation.navigate('Welcome');
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${t('profile.logoutTitle')} ${t('profile.logoutBody')}`);
      if (confirmed) doLogout();
      return;
    }

    Alert.alert(
      t('profile.logoutTitle'),
      t('profile.logoutBody'),
      [
        { text: t('common.cancel') },
        { text: t('profile.logout'), style: 'destructive', onPress: doLogout },
      ],
    );
  };

  const handleClearData = () => {
    Alert.alert(
      t('profile.clearTitle'),
      t('profile.clearBody'),
      [
        { text: t('common.cancel') },
        {
          text: t('profile.clear'), style: 'destructive',
          onPress: async () => { await clearAll(); Alert.alert(t('common.done'), t('profile.clearedBody')); },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('profile.title')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{userName}</Text>
        </View>

        {/* Exam countdown */}
        {daysLeft !== null && (
          <View style={styles.examCard}>
            <View>
              <Text style={styles.examLabel}>{t('profile.examDate')}</Text>
              <Text style={styles.examDate}>{examDate}</Text>
              <Text style={[styles.examDays, daysLeft < 7 && { color: colors.error }]}>
                {t('profile.daysLeft', { n: daysLeft })}
              </Text>
            </View>
            <CalendarDays size={36} color={colors.warning} strokeWidth={1.8} />
          </View>
        )}

        {/* Overall completion (real progress data) */}
        <View style={styles.statRow}>
          <View style={styles.statChip}>
            <Text style={styles.statVal}>{`${completion}%`}</Text>
            <Text style={styles.statLbl}>{t('profile.complete')}</Text>
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionHeader}>{t('profile.account')}</Text>
        <View style={styles.settingGroup}>
          <SettingRow Icon={Target} tint={colors.primary} title={t('profile.setExamDate')} subtitle={examDate ?? t('profile.notSet')} onPress={openDateModal} />
        </View>

        {/* Preferences */}
        <Text style={styles.sectionHeader}>{t('profile.preferences')}</Text>
        <View style={styles.settingGroup}>
          <SettingRow
            Icon={Languages}
            tint={colors.primary}
            title={t('profile.appLanguage')}
            subtitle={t('profile.appLanguageHint')}
            onPress={() => setAppLanguage(lang === 'fi' ? 'en' : 'fi')}
            right={<Text style={styles.langValue}>{lang === 'fi' ? 'Suomi' : 'English'}</Text>}
          />
          <SettingRow
            Icon={Bookmark}
            tint={colors.primary}
            title={t('profile.savedQuestions')}
            onPress={() => navigation.navigate('SavedQuestions')}
            right={
              <View style={styles.countRow}>
                {saved.length > 0 && <Text style={styles.langValue}>{saved.length}</Text>}
                <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2.2} />
              </View>
            }
          />
        </View>

        {/* Subscription */}
        <Text style={styles.sectionHeader}>{t('profile.subscription')}</Text>
        <View style={styles.settingGroup}>
          <SettingRow
            Icon={CreditCard}
            tint={colors.primary}
            title={isPaid ? subscription!.planName : t('profile.manageSubscription')}
            subtitle={isPaid ? t('profile.daysLeft', { n: subDaysLeft }) : t('profile.upgradeHint')}
            onPress={handleManageSub}
          />
          <View style={styles.sep} />
          <SettingRow
            Icon={Gift} tint={colors.success} title={t('profile.referralTitle')}
            subtitle={t('profile.referralHint')}
            onPress={() => navigation.navigate('Referral')}
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionHeader}>{t('profile.support')}</Text>
        <View style={styles.settingGroup}>
          <SettingRow Icon={HelpCircle} title={t('profile.helpFaq')} onPress={handleHelp} />
          <View style={styles.sep} />
          <SettingRow Icon={Trash2} tint={colors.error} title={t('profile.clearProgressData')} onPress={handleClearData} />
        </View>

        <AppButton
          label={t('profile.logout')}
          variant="danger"
          onPress={handleLogout}
          style={{ margin: spacing.md }}
        />
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Exam-date picker — presets or an exact date, no extra dependency */}
      <Modal visible={dateModal} transparent animationType="fade" onRequestClose={() => setDateModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setDateModal(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('profile.setExamDate')}</Text>
            <Text style={styles.modalSub}>{t('profile.examDateModalSub')}</Text>
            <View style={styles.presetRow}>
              {[1, 2, 4, 8].map((w) => (
                <Pressable
                  key={w}
                  style={[styles.presetChip, savingDate && styles.presetChipDisabled]}
                  onPress={() => setExamDate(weeksFromNow(w))}
                  disabled={savingDate}
                >
                  <Text style={[styles.presetText, savingDate && styles.presetTextDisabled]}>+{w}w</Text>
                </Pressable>
              ))}
            </View>
            <AppInput
              label={t('profile.exactDate')}
              placeholder="2026-09-01"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              value={dateInput}
              onChangeText={(t) => { setDateInput(t); setDateError(null); }}
              error={dateError ?? undefined}
              editable={!savingDate}
              style={{ marginTop: spacing.md }}
            />
            <AppButton label={t('profile.saveDate')} onPress={saveTypedDate} loading={savingDate} style={{ marginTop: spacing.md }} />
            {examDate && (
              <AppButton label={t('profile.clearDate')} variant="secondary" onPress={() => setExamDate(null)} loading={savingDate} style={{ marginTop: spacing.sm }} />
            )}
          </Pressable>
        </Pressable>
      </Modal>
      <GuestOverlay blurb={t('profile.guestBlurb')} />
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
  avatarSection: { alignItems: 'center', paddingVertical: spacing.lg, gap: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontFamily: font.bold, color: '#fff' },
  name: { fontSize: fontSize.lg, fontFamily: font.bold, color: colors.text },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.bg, borderRadius: radius.lg, padding: spacing.lg,
  },
  modalTitle: { fontSize: fontSize.lg, fontFamily: font.bold, color: colors.text },
  modalSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  presetRow: { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  presetChip: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md,
  },
  presetChipDisabled: { opacity: 0.5 },
  presetText: { fontSize: fontSize.sm, fontFamily: font.bold, color: colors.text },
  presetTextDisabled: { color: colors.textTertiary },
  examCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    backgroundColor: colors.warningTint, borderWidth: 1.5, borderColor: colors.warningBorder,
    borderRadius: radius.md, padding: spacing.md,
  },
  examLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 2 },
  examDate: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  examDays: { fontSize: 13, color: colors.warning, fontFamily: font.semibold, marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 10, marginHorizontal: spacing.md, marginBottom: spacing.sm },
  statChip: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 12, alignItems: 'center',
  },
  statVal: { fontSize: fontSize.lg, fontFamily: font.bold, color: colors.text },
  statLbl: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  sectionHeader: {
    fontSize: fontSize.xs, fontFamily: font.bold, letterSpacing: 1,
    textTransform: 'uppercase', color: colors.textSecondary,
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  settingGroup: {
    marginHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.bg,
    marginBottom: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  settingIconChip: {
    width: 34, height: 34, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 14, fontFamily: font.semibold, color: colors.text },
  settingSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  langValue: { fontSize: 13, fontFamily: font.semibold, color: colors.primary },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: 62 },
});
