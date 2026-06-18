import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TestHomeScreen } from '../screens/TestHomeScreen';
import { ModelTestScreen } from '../screens/ModelTestScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { PracticeScreen } from '../screens/PracticeScreen';
import type { TestStackParamList } from './types';

const Stack = createNativeStackNavigator<TestStackParamList>();

export function TestStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TestHome" component={TestHomeScreen} />
      <Stack.Screen name="ModelTest" component={ModelTestScreen} />
      {/* Reviewing wrong answers after a test stays inside the Tests tab. */}
      <Stack.Screen name="Practice" component={PracticeScreen as any} />
      <Stack.Screen name="Result" component={ResultScreen as any} />
    </Stack.Navigator>
  );
}
