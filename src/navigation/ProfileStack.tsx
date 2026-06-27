import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ReferralScreen } from '../screens/ReferralScreen';
import { RequireAuth } from '../components/RequireAuth';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={RequireAuth(ProfileScreen, 'Profile')} />
      <Stack.Screen name="Referral" component={RequireAuth(ReferralScreen, 'Profile')} />
    </Stack.Navigator>
  );
}
