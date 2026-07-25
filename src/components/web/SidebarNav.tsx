import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  BookOpen, Timer, TrendingUp, User, ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import { useAuth, hasActivePaidPlan, getRemainingDays } from '../../store/authStore';
import { useBreakpoint } from '../../theme/breakpoints';
import { colors, spacing, fontSize, font, radius } from '../../theme/tokens';

type NavTarget = {
  name: string;
  params?: object;
};

type NavItemDef = {
  key: string;
  route: string;
  target: NavTarget;
  Icon: LucideIcon;
  labelKey: string;
};

const MAIN_ITEMS: NavItemDef[] = [
  { key: 'Dashboard', route: 'Dashboard', target: { name: 'Dashboard' }, Icon: BookOpen, labelKey: 'nav.dashboard' },
  { key: 'Test', route: 'Test', target: { name: 'Test' }, Icon: Timer, labelKey: 'nav.tests' },
  { key: 'Progress', route: 'Progress', target: { name: 'Progress' }, Icon: TrendingUp, labelKey: 'nav.progress' },
  { key: 'Profile', route: 'Profile', target: { name: 'Profile' }, Icon: User, labelKey: 'nav.profile' },
];



type Props = {
  activeTab: string;
  activeRoute: string;
  onNavigate: (target: NavTarget) => void;
  onSignIn: () => void;
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function NavItem({
  item, active, compact, onPress,
}: {
  item: NavItemDef;
  active: boolean;
  compact: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        styles.item,
        compact && styles.itemCompact,
        active && styles.itemActive,
        (hovered || pressed) && !active && styles.itemHover,
      ]}
    >
      <item.Icon
        size={compact ? 22 : 20}
        color={active ? colors.primary : colors.textSecondary}
        strokeWidth={active ? 2.4 : 2}
      />
      {!compact && <Text style={[styles.itemLabel, active && styles.itemLabelActive]} numberOfLines={1}>{t(item.labelKey)}</Text>}
      {compact && hovered && Platform.OS === 'web' && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{t(item.labelKey)}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function SidebarNav({ activeTab, activeRoute, onNavigate, onSignIn }: Props) {
  const { t } = useTranslation();
  const { isDesktop } = useBreakpoint();
  const { state } = useAuth();
  const user = state.user;
  const compact = !isDesktop;

  const planActive = user ? hasActivePaidPlan(user.subscription) : false;
  const remainingDays = user ? getRemainingDays(user.subscription) : 0;

  return (
    <View style={[styles.sidebar, compact && styles.sidebarCompact]}>
      <View style={styles.top}>
        <View style={[styles.brand, compact && styles.brandCompact]}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>T</Text>
          </View>
          {!compact && <Text style={styles.brandText}>{t('common.appName')}</Text>}
        </View>

        <View style={styles.section}>
          {MAIN_ITEMS.map(item => (
            <NavItem
              key={item.key}
              item={item}
              compact={compact}
              active={activeTab === item.route}
              onPress={() => onNavigate(item.target)}
            />
          ))}
        </View>


      </View>

      <View style={[styles.bottom, compact && styles.bottomCompact]}>
        {!user ? (
          <Pressable onPress={onSignIn} style={({ pressed }) => [styles.signInBtn, compact && styles.signInBtnCompact, pressed && styles.pressed]}>
            <User size={compact ? 20 : 18} color="#fff" strokeWidth={2.2} />
            {!compact && <Text style={styles.signInText}>{t('auth.logIn')}</Text>}
          </Pressable>
        ) : (
          <Pressable
            onPress={() => onNavigate({ name: 'Profile' })}
            style={({ pressed }) => [styles.userCard, compact && styles.userCardCompact, pressed && styles.pressed]}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(user.name)}</Text>
            </View>
            {!compact && (
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                <Text style={styles.planBadge}>
                  {planActive ? `${user.subscription.planName} · ${remainingDays}d` : t('common.free')}
                </Text>
              </View>
            )}
            {!compact && <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2.2} />}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    height: '100%',
    backgroundColor: colors.bg,
    borderRightWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    justifyContent: 'space-between',
  },
  sidebarCompact: {
    width: 72,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  top: { width: '100%' },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  brandCompact: {
    paddingHorizontal: 0,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { fontSize: 18, fontFamily: font.bold, color: '#fff' },
  brandText: { fontSize: fontSize.md, fontFamily: font.bold, color: colors.text },
  section: { gap: 4, paddingHorizontal: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  itemCompact: {
    width: 52,
    height: 52,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  itemActive: { backgroundColor: colors.primaryTint },
  itemHover: { backgroundColor: colors.surfaceAlt },
  itemLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: font.medium,
    color: colors.textSecondary,
  },
  itemLabelActive: { color: colors.primary, fontFamily: font.semibold },
  tooltip: {
    position: 'absolute',
    left: 56,
    backgroundColor: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 10,
  },
  tooltipText: { fontSize: 12, fontFamily: font.medium, color: '#fff' },
  bottom: { paddingHorizontal: spacing.lg },
  bottomCompact: { paddingHorizontal: 0, alignItems: 'center' },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  signInBtnCompact: { width: 48, height: 48 },
  signInText: { fontSize: fontSize.sm, fontFamily: font.semibold, color: '#fff' },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  userCardCompact: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    justifyContent: 'center',
    padding: 0,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  avatarText: { fontSize: 12, fontFamily: font.bold, color: colors.primary },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: fontSize.sm, fontFamily: font.semibold, color: colors.text },
  planBadge: { fontSize: 11, color: colors.textTertiary },
  pressed: { opacity: 0.85 },
});
