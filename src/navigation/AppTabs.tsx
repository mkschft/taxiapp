import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { StudyStack } from './StudyStack';
import { TestStack } from './TestStack';
import { ProfileStack } from './ProfileStack';
import { colors, fontSize } from '../theme/tokens';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

const ICONS: Record<string, string> = {
  Dashboard: '🏠', Study: '📚', Test: '⏱️', Progress: '📊', Profile: '👤',
};

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: () => <Text style={styles.icon}>{ICONS[route.name]}</Text>,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Study" component={StudyStack} />
      <Tab.Screen name="Test" component={TestStack} options={{ title: 'Tests' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 72, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bg,
    paddingBottom: 8, paddingTop: 4,
  },
  icon: { fontSize: 22 },
  label: { fontSize: fontSize.xs, marginTop: 2 },
});
