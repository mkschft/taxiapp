import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VocabSetsScreen } from '../screens/VocabSetsScreen';
import { VocabLessonScreen } from '../screens/VocabLessonScreen';
import { VocabQuizScreen } from '../screens/VocabQuizScreen';
import { ClueWordsScreen } from '../screens/ClueWordsScreen';
import { ClueLessonScreen } from '../screens/ClueLessonScreen';
import { ClueQuizScreen } from '../screens/ClueQuizScreen';
import { TopicLessonsScreen } from '../screens/TopicLessonsScreen';
import { TopicQuizScreen } from '../screens/TopicQuizScreen';
import { ModuleQuizScreen } from '../screens/ModuleQuizScreen';
import { PracticeScreen } from '../screens/PracticeScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { RequireAuth } from '../components/RequireAuth';
import type { DashboardStackParamList } from './types';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="VocabSets" component={RequireAuth(VocabSetsScreen, 'Dashboard')} />
      <Stack.Screen name="VocabLesson" component={VocabLessonScreen} />
      <Stack.Screen name="VocabQuiz" component={RequireAuth(VocabQuizScreen, 'Dashboard')} />
      <Stack.Screen name="ClueWords" component={RequireAuth(ClueWordsScreen, 'Dashboard')} />
      <Stack.Screen name="ClueLesson" component={RequireAuth(ClueLessonScreen, 'Dashboard')} />
      <Stack.Screen name="ClueQuiz" component={RequireAuth(ClueQuizScreen, 'Dashboard')} />
      <Stack.Screen name="TopicLessons" component={RequireAuth(TopicLessonsScreen, 'Dashboard')} />
      <Stack.Screen name="TopicQuiz" component={RequireAuth(TopicQuizScreen, 'Dashboard')} />
      <Stack.Screen name="ModuleQuiz" component={RequireAuth(ModuleQuizScreen, 'Dashboard')} />
      <Stack.Screen name="Practice" component={RequireAuth(PracticeScreen, 'Dashboard')} />
      <Stack.Screen name="Result" component={RequireAuth(ResultScreen, 'Dashboard')} />
    </Stack.Navigator>
  );
}
