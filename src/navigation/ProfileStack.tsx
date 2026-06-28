import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ReferralScreen } from '../screens/ReferralScreen';
import { SavedQuestionsScreen } from '../screens/SavedQuestionsScreen';
import { RequireAuth } from '../components/RequireAuth';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="Referral" component={RequireAuth(ReferralScreen, 'Profile')} />
      <Stack.Screen name="SavedQuestions" component={RequireAuth(SavedQuestionsScreen, 'Profile')} />
    </Stack.Navigator>
  );
}
