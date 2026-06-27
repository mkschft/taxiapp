import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProgressScreen } from '../screens/ProgressScreen';
import { RequireAuth } from '../components/RequireAuth';

const Stack = createNativeStackNavigator();

export function ProgressStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProgressHome" component={RequireAuth(ProgressScreen, 'Progress')} />
    </Stack.Navigator>
  );
}
