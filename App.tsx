import 'react-native-gesture-handler';
import React, { useCallback } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './src/navigation/types';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ProgressProvider } from './src/store/progressStore';
import { AuthProvider } from './src/store/authStore';
import { colors, font } from './src/theme/tokens';

// Set Inter as the base font for all Text via defaultProps (safe on web + native).
// Explicit fontFamily in component styles overrides this for weighted text.
function applyGlobalFont() {
  const TextAny = Text as any;
  if (TextAny.__interPatched) return;
  TextAny.__interPatched = true;
  TextAny.defaultProps = TextAny.defaultProps || {};
  TextAny.defaultProps.style = [{ fontFamily: font.regular }, TextAny.defaultProps.style];
}

// URL ↔ route mapping. Web syncs the address bar; native uses the prefixes for
// deep links. Vocab paths follow /vocab/sets/:setId/lesson/:index.
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [],
  config: {
    screens: {
      Home: '',
      App: {
        screens: {
          Dashboard: 'home',
          Study: {
            screens: {
              StudyHome: 'study',
              Guide: 'guide',
              VocabSets: 'vocab/sets',
              VocabSetDetail: 'vocab/sets/:setId',
              VocabLesson: 'vocab/sets/:setId/lesson/:index',
              VocabQuiz: 'vocab/sets/:setId/quiz',
              ClueWords: 'clue-words',
              ClueLesson: 'clue-words/:groupId/lesson/:index',
              ClueQuiz: 'clue-words/:groupId/quiz',
              Practice: 'practice',
              Result: 'result',
            },
          },
          Test: {
            screens: {
              TestHome: 'tests',
              ModelTest: 'tests/:testId',
              Result: 'tests/result',
            },
          },
          Progress: 'progress',
          Profile: {
            screens: {
              ProfileHome: 'profile',
              Referral: 'profile/referral',
            },
          },
        },
      },
    },
  },
};

export default function App() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (loaded) applyGlobalFont();

  const inner = !loaded ? (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
    </View>
  ) : (
    <SafeAreaProvider>
      <AuthProvider>
        <ProgressProvider>
          <NavigationContainer linking={linking}>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </ProgressProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );

  if (Platform.OS !== 'web') return inner;

  return (
    <View style={styles.webOuter}>
      <View style={styles.webShell}>{inner}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  webOuter: {
    flex: 1,
    backgroundColor: '#E8ECF0',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  webShell: {
    width: '100%',
    maxWidth: 430,
    height: '100%',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 40px rgba(0,0,0,0.12)' } as any) : {}),
  },
});
