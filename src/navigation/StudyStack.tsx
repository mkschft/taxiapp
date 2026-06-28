import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VocabSetsScreen } from '../screens/VocabSetsScreen';
import { VocabLessonScreen } from '../screens/VocabLessonScreen';
import { VocabQuizScreen } from '../screens/VocabQuizScreen';
import { ClueWordsScreen } from '../screens/ClueWordsScreen';
import { ClueLessonScreen } from '../screens/ClueLessonScreen';
import { ClueQuizScreen } from '../screens/ClueQuizScreen';
import { TopicSectionsScreen } from '../screens/TopicSectionsScreen';
import { TopicLessonsScreen } from '../screens/TopicLessonsScreen';
import { TopicQuizScreen } from '../screens/TopicQuizScreen';
import { PracticeScreen } from '../screens/PracticeScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { StudyHomeScreen } from '../screens/StudyHomeScreen';
import { GuideScreen } from '../screens/GuideScreen';
import { HowToScreen } from '../screens/HowToScreen';
import { RequireAuth } from '../components/RequireAuth';
import type { StudyStackParamList } from './types';

const Stack = createNativeStackNavigator<StudyStackParamList>();

export function StudyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudyHome" component={StudyHomeScreen} />
      <Stack.Screen name="VocabSets" component={RequireAuth(VocabSetsScreen, 'Study')} />
      <Stack.Screen name="VocabLesson" component={RequireAuth(VocabLessonScreen, 'Study')} />
      <Stack.Screen name="VocabQuiz" component={RequireAuth(VocabQuizScreen, 'Study')} />
      <Stack.Screen name="ClueWords" component={RequireAuth(ClueWordsScreen, 'Study')} />
      <Stack.Screen name="ClueLesson" component={RequireAuth(ClueLessonScreen, 'Study')} />
      <Stack.Screen name="ClueQuiz" component={RequireAuth(ClueQuizScreen, 'Study')} />
      <Stack.Screen name="TopicSections" component={RequireAuth(TopicSectionsScreen, 'Study')} />
      <Stack.Screen name="TopicLessons" component={RequireAuth(TopicLessonsScreen, 'Study')} />
      <Stack.Screen name="TopicQuiz" component={RequireAuth(TopicQuizScreen, 'Study')} />
      <Stack.Screen name="Practice" component={RequireAuth(PracticeScreen, 'Study')} />
      <Stack.Screen name="Result" component={RequireAuth(ResultScreen, 'Study')} />
      <Stack.Screen name="Guide" component={GuideScreen} />
      <Stack.Screen name="HowTo" component={HowToScreen} />
    </Stack.Navigator>
  );
}
