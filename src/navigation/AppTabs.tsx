import React, { useState } from 'react';
import { createBottomTabNavigator, BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { type NavigationState } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BookOpen, Timer, TrendingUp, User } from 'lucide-react-native';
import { DashboardStack } from './DashboardStack';
import { ProgressStack } from './ProgressStack';
import { TestStack } from './TestStack';
import { ProfileStack } from './ProfileStack';
import { AppShell } from '../components/web/AppShell';
import { useBreakpoint } from '../theme/breakpoints';
import { colors, fontSize, font } from '../theme/tokens';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

const ICONS: Record<string, any> = {
  Dashboard: BookOpen, Test: Timer, Progress: TrendingUp, Profile: User,
};

function deriveActiveTabAndRoute(state?: NavigationState) {
  const tab = state?.routes?.[state?.index ?? 0];
  const nested = tab?.state as NavigationState | undefined;
  const subRoute = nested?.routes?.[nested?.index ?? 0];
  return {
    activeTab: tab?.name ?? 'Dashboard',
    activeRoute: subRoute?.name ?? tab?.name ?? 'Dashboard',
  };
}

export function AppTabs() {
  const { t } = useTranslation();
  const { isCompact } = useBreakpoint();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [activeRoute, setActiveRoute] = useState('Dashboard');

  const navigator = (
    <Tab.Navigator
      screenListeners={{
        state: (e) => {
          const { activeTab: tab, activeRoute: route } = deriveActiveTabAndRoute(e.data.state);
          setActiveTab(tab);
          setActiveRoute(route);
        },
      }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, focused }) => {
          const Icon = ICONS[route.name];
          return <Icon size={22} color={color} strokeWidth={focused ? 2.4 : 2} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: isCompact ? styles.tabBar : { display: 'none', height: 0 },
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: { paddingTop: 6 },
        tabBar: (props: BottomTabBarProps) => isCompact ? <BottomTabBar {...props} /> : null,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} options={{ tabBarLabel: t('nav.dashboard') }} />
      <Tab.Screen name="Test" component={TestStack} options={{ tabBarLabel: t('nav.tests') }} />
      <Tab.Screen name="Progress" component={ProgressStack} options={{ tabBarLabel: t('nav.progress') }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: t('nav.profile') }} />
    </Tab.Navigator>
  );

  if (isCompact) return navigator;

  return (
    <AppShell activeTab={activeTab} activeRoute={activeRoute}>
      {navigator}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 76,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    paddingBottom: 12,
    paddingTop: 4,
  },
  label: { fontSize: fontSize.xs, fontFamily: font.medium, marginTop: 3 },
});
