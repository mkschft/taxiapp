import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Switch, Alert, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Target, Languages, Bell, CreditCard, Gift, HelpCircle, Star, Trash2,
  ChevronRight, CalendarDays, type LucideIcon,
} from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { useProgress, useQuestionStats } from '../store/progressStore';
import { useAuth } from '../store/authStore';
import { getQuestions } from '../data/loaders';
import { clearAll } from '../store/storage';

const TOTAL_QS = getQuestions().length;

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
  const { state, dispatch } = useProgress();
  const { clearAuth } = useAuth();
  const { completion, accuracy } = useQuestionStats(TOTAL_QS);

  const daysLeft = state.profile.exam_date
    ? Math.max(0, Math.round((new Date(state.profile.exam_date).getTime() - Date.now()) / 86400000))
    : null;

  const handleLogout = () => {
    const doLogout = async () => {
      await clearAuth();
      navigation.replace('Home');
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

  const initial = state.profile.name ? state.profile.name[0].toUpperCase() : '?';

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
          <Text style={styles.name}>{state.profile.name || 'Your Name'}</Text>
          <View style={styles.planBadge}>
            <Star size={12} color={colors.primary} strokeWidth={2.4} fill={colors.primary} />
            <Text style={styles.planText}>Full Access</Text>
          </View>
        </View>

        {/* Exam countdown */}
        {daysLeft !== null && (
          <View style={styles.examCard}>
            <View>
              <Text style={styles.examLabel}>Exam date</Text>
              <Text style={styles.examDate}>{state.profile.exam_date}</Text>
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
            { val: `${state.streak}`, label: 'Day streak' },
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
          <SettingRow Icon={Target} tint={colors.primary} title="Set exam date" subtitle={state.profile.exam_date ?? 'Not set'} onPress={() => {}} />
          <View style={styles.sep} />
          <SettingRow Icon={Languages} tint={colors.primary} title="Interface language" subtitle={state.profile.language_pref === 'en' ? 'English' : 'Finnish'} onPress={() => {}} />
          <View style={styles.sep} />
          <SettingRow
            Icon={Bell} tint={colors.warning} title="Daily reminder" subtitle="08:00 every day"
            right={<Switch value={true} onValueChange={() => {}} trackColor={{ true: colors.success }} />}
          />
        </View>

        {/* Subscription */}
        <Text style={styles.sectionHeader}>Subscription</Text>
        <View style={styles.settingGroup}>
          <SettingRow Icon={CreditCard} tint={colors.primary} title="Manage subscription" subtitle="Full Access · active" onPress={() => {}} />
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
          <SettingRow Icon={HelpCircle} title="Help & FAQ" onPress={() => {}} />
          <View style={styles.sep} />
          <SettingRow Icon={Star} title="Rate the app" onPress={() => {}} />
          <View style={styles.sep} />
          <SettingRow Icon={Trash2} tint={colors.error} title="Clear progress data" onPress={handleClearData} />
        </View>

        <AppButton
          label="Log out"
          variant="danger"
          onPress={handleLogout}
          style={{ margin: spacing.md }}
        />
        <View style={{ height: 32 }} />
      </ScrollView>
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
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primaryTint, borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5,
  },
  planText: { fontSize: 12, fontFamily: font.bold, color: colors.primary },
  examCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    backgroundColor: colors.warningTint, borderWidth: 1.5, borderColor: '#F0D070',
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
  sep: { height: 1, backgroundColor: colors.border, marginLeft: 62 },
});
