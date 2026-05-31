import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AppButton } from '../components/ui/AppButton';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme/tokens';
import { useProgress, useQuestionStats } from '../store/progressStore';
import { getQuestions } from '../data/loaders';
import { clearAll } from '../store/storage';
import type { ProfileStackParamList } from '../navigation/types';

const TOTAL_QS = getQuestions().length;

function SettingRow({
  icon, title, subtitle, onPress, right,
}: {
  icon: string; title: string; subtitle?: string;
  onPress?: () => void; right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSub}>{subtitle}</Text>}
      </View>
      {right ?? <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { state, dispatch } = useProgress();
  const { completion, accuracy } = useQuestionStats(TOTAL_QS);

  const daysLeft = state.profile.exam_date
    ? Math.max(0, Math.round((new Date(state.profile.exam_date).getTime() - Date.now()) / 86400000))
    : null;

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
            <Text style={styles.planText}>⭐ Full Access</Text>
          </View>
        </View>

        {/* Exam countdown */}
        {daysLeft !== null && (
          <View style={styles.examCard}>
            <View>
              <Text style={styles.examLabel}>Exam date</Text>
              <Text style={styles.examDate}>{state.profile.exam_date}</Text>
              <Text style={[styles.examDays, daysLeft < 7 && { color: colors.error }]}>
                ⏳ {daysLeft} days left
              </Text>
            </View>
            <Text style={{ fontSize: 40 }}>📅</Text>
          </View>
        )}

        {/* Mini stats */}
        <View style={styles.statRow}>
          {[
            { val: `${completion}%`, label: 'Complete' },
            { val: `${accuracy}%`, label: 'Accuracy', color: colors.success },
            { val: `${state.streak}🔥`, label: 'Streak' },
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
          <SettingRow icon="🎯" title="Set exam date" subtitle={state.profile.exam_date ?? 'Not set'} onPress={() => {}} />
          <View style={styles.sep} />
          <SettingRow icon="🌐" title="Interface language" subtitle={state.profile.language_pref === 'en' ? 'English' : 'Finnish'} onPress={() => {}} />
          <View style={styles.sep} />
          <SettingRow
            icon="🔔" title="Daily reminder" subtitle="08:00 every day"
            right={<Switch value={true} onValueChange={() => {}} trackColor={{ true: colors.success }} />}
          />
        </View>

        {/* Subscription */}
        <Text style={styles.sectionHeader}>Subscription</Text>
        <View style={styles.settingGroup}>
          <SettingRow icon="💳" title="Manage subscription" subtitle="Full Access · active" onPress={() => {}} />
          <View style={styles.sep} />
          <SettingRow
            icon="🎁" title="Referral — give & get free week"
            subtitle="Share your code, earn rewards"
            onPress={() => navigation.navigate('Referral')}
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionHeader}>Support</Text>
        <View style={styles.settingGroup}>
          <SettingRow icon="❓" title="Help & FAQ" onPress={() => {}} />
          <View style={styles.sep} />
          <SettingRow icon="⭐" title="Rate the app" onPress={() => {}} />
          <View style={styles.sep} />
          <SettingRow icon="🗑️" title="Clear progress data" onPress={handleClearData} />
        </View>

        <AppButton
          label="Log out"
          variant="danger"
          onPress={() => {}}
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
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.lg, gap: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: fontWeight.bold, color: '#fff' },
  name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  planBadge: {
    backgroundColor: colors.primaryTint, borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 4,
  },
  planText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.primary },
  examCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    backgroundColor: colors.warningTint, borderWidth: 1.5, borderColor: '#F0D070',
    borderRadius: radius.md, padding: spacing.md,
  },
  examLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 2 },
  examDate: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  examDays: { fontSize: 13, color: colors.warning, fontWeight: fontWeight.semibold, marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 10, marginHorizontal: spacing.md, marginBottom: spacing.sm },
  statChip: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 12, alignItems: 'center',
  },
  statVal: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  statLbl: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  sectionHeader: {
    fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 1,
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
    paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  settingIcon: { fontSize: 18 },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: fontWeight.semibold },
  settingSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  chevron: { fontSize: 18, color: colors.textSecondary },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: 46 },
});
