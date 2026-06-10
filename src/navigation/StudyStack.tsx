import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VocabSetsScreen } from '../screens/VocabSetsScreen';
import { VocabSetDetailScreen } from '../screens/VocabSetDetailScreen';
import { VocabLessonScreen } from '../screens/VocabLessonScreen';
import { VocabQuizScreen } from '../screens/VocabQuizScreen';
import { ClueWordsScreen } from '../screens/ClueWordsScreen';
import { ClueLessonScreen } from '../screens/ClueLessonScreen';
import { ClueQuizScreen } from '../screens/ClueQuizScreen';
import { PracticeScreen } from '../screens/PracticeScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { StudyHomeScreen } from '../screens/StudyHomeScreen';
import { GuideScreen } from '../screens/GuideScreen';
import type { StudyStackParamList } from './types';

const Stack = createNativeStackNavigator<StudyStackParamList>();

export function StudyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudyHome" component={StudyHomeScreen} />
      <Stack.Screen name="VocabSets" component={VocabSetsScreen} />
      <Stack.Screen name="VocabSetDetail" component={VocabSetDetailScreen} />
      <Stack.Screen name="VocabLesson" component={VocabLessonScreen} />
      <Stack.Screen name="VocabQuiz" component={VocabQuizScreen} />
      <Stack.Screen name="ClueWords" component={ClueWordsScreen} />
      <Stack.Screen name="ClueLesson" component={ClueLessonScreen} />
      <Stack.Screen name="ClueQuiz" component={ClueQuizScreen} />
      <Stack.Screen name="Practice" component={PracticeScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="Guide" component={GuideScreen} />
    </Stack.Navigator>
  );
}
