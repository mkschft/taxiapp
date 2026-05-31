import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VocabularyScreen } from '../screens/VocabularyScreen';
import { ClueWordsScreen } from '../screens/ClueWordsScreen';
import { PracticeScreen } from '../screens/PracticeScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { StudyHomeScreen } from '../screens/StudyHomeScreen';
import type { StudyStackParamList } from './types';

const Stack = createNativeStackNavigator<StudyStackParamList>();

export function StudyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudyHome" component={StudyHomeScreen} />
      <Stack.Screen name="Vocabulary" component={VocabularyScreen} />
      <Stack.Screen name="ClueWords" component={ClueWordsScreen} />
      <Stack.Screen name="Practice" component={PracticeScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
}
