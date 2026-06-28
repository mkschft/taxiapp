import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Alert, Platform, Modal, Pressable, Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Target, CreditCard, Gift, HelpCircle, Trash2,
  ChevronRight, CalendarDays, Languages, type LucideIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/ui/AppButton';
import { AppInput } from '../components/ui/AppInput';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { setAppLanguage, type AppLanguage } from '../i18n';
import { useAuth } from '../store/authStore';
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

  const totalCompleted = progress?.reduce((sum, item) => sum + item.progress.completed, 0) ?? 0;
  const totalQuestions = progress?.reduce((sum, item) => sum + item.progress.total, 0) ?? 0;
  const completion = totalQuestions === 0 ? 0 : Math.round((totalCompleted / totalQuestions) * 100);
  const accuracy = 0;
  const userName = auth.user?.name ?? 'Your Name';
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
      setDateError(err?.message ?? 'Could not save exam date. Please try again.');
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
      setDateError('Enter a real date as YYYY-MM-DD (e.g. 2026-09-01).');
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
      Alert.alert('Help & FAQ', `Visit ${HELP_URL} for help and FAQs.`),
    );
  };

  const handleLogout = () => {
    const doLogout = async () => {
      await clearAuth();
      navigation.navigate('Welcome');
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Log out? You will be returned to the home screen.');
      if (confirmed) doLogout();
      return;
    }

    Alert.alert(
      'Log out?',
      'You will be returned to the home screen.',
      [
        { text: 'Cancel' },
        { text: 'Log out', style: 'destructive', onPress: doLogout },
      ],
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear all data?',
      'This will reset all your progress. This cannot be undone.',
      [
        { text: 'Cancel' },
        {
          text: 'Clear', style: 'destructive',
          onPress: async () => { await clearAll(); Alert.alert('Done', 'All progress cleared.'); },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
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
              <Text style={styles.examLabel}>Exam date</Text>
              <Text style={styles.examDate}>{examDate}</Text>
              <Text style={[styles.examDays, daysLeft < 7 && { color: colors.error }]}>
                {daysLeft} days left
              </Text>
            </View>
            <CalendarDays size={36} color={colors.warning} strokeWidth={1.8} />
          </View>
        )}

        {/* Mini stats */}
        <View style={styles.statRow}>
          {[
            { val: `${completion}%`, label: 'Complete' },
            { val: `${accuracy}%`, label: 'Accuracy', color: colors.success },
            { val: '0', label: 'Day streak' },
          ].map(s => (
            <View key={s.label} style={styles.statChip}>
              <Text style={[styles.statVal, s.color ? { color: s.color } : {}]}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Account */}
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.settingGroup}>
          <SettingRow Icon={Target} tint={colors.primary} title="Set exam date" subtitle={examDate ?? 'Not set'} onPress={openDateModal} />
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
        </View>

        {/* Subscription */}
        <Text style={styles.sectionHeader}>Subscription</Text>
        <View style={styles.settingGroup}>
          <SettingRow
            Icon={CreditCard}
            tint={colors.primary}
            title={isPaid ? subscription!.planName : 'Manage subscription'}
            subtitle={isPaid ? `${subDaysLeft} days left` : 'Upgrade to unlock full access'}
            onPress={handleManageSub}
          />
          <View style={styles.sep} />
          <SettingRow
            Icon={Gift} tint={colors.success} title="Referral — give & get free week"
            subtitle="Share your code, earn rewards"
            onPress={() => navigation.navigate('Referral')}
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionHeader}>Support</Text>
        <View style={styles.settingGroup}>
          <SettingRow Icon={HelpCircle} title="Help & FAQ" onPress={handleHelp} />
          <View style={styles.sep} />
          <SettingRow Icon={Trash2} tint={colors.error} title="Clear progress data" onPress={handleClearData} />
        </View>

        <AppButton
          label={'Log out'}
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
            <Text style={styles.modalTitle}>Set exam date</Text>
            <Text style={styles.modalSub}>Pick a quick option or type the exact date.</Text>
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
              label="Exact date (YYYY-MM-DD)"
              placeholder="2026-09-01"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              value={dateInput}
              onChangeText={(t) => { setDateInput(t); setDateError(null); }}
              error={dateError ?? undefined}
              editable={!savingDate}
              style={{ marginTop: spacing.md }}
            />
            <AppButton label="Save date" onPress={saveTypedDate} loading={savingDate} style={{ marginTop: spacing.md }} />
            {examDate && (
              <AppButton label="Clear date" variant="secondary" onPress={() => setExamDate(null)} loading={savingDate} style={{ marginTop: spacing.sm }} />
            )}
          </Pressable>
        </Pressable>
      </Modal>
      <GuestOverlay blurb="Sign up or log in to manage your profile, set your exam date, and view your subscription." />
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
  sep: { height: 1, backgroundColor: colors.border, marginLeft: 62 },
});
