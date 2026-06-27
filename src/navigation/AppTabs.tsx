import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { Home, BookOpen, Timer, TrendingUp, User } from 'lucide-react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProgressStack } from './ProgressStack';
import { StudyStack } from './StudyStack';
import { TestStack } from './TestStack';
import { ProfileStack } from './ProfileStack';
import { colors, fontSize, font } from '../theme/tokens';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

const ICONS: Record<string, any> = {
  Dashboard: Home, Study: BookOpen, Test: Timer, Progress: TrendingUp, Profile: User,
};

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, focused }) => {
          const Icon = ICONS[route.name];
          return <Icon size={22} color={color} strokeWidth={focused ? 2.4 : 2} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: { paddingTop: 6 },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Study" component={StudyStack} />
      <Tab.Screen name="Test" component={TestStack} options={{ title: 'Tests' }} />
      <Tab.Screen name="Progress" component={ProgressStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
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
