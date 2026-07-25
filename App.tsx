import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useState } from 'react';
import { loadSavedLanguage } from './src/i18n';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './src/navigation/types';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { RootNavigator } from './src/navigation/RootNavigator';
import { WebRootFrame } from './src/components/web/WebRootFrame';
import { AuthProvider } from './src/store/authStore';
import { PaywallProvider } from './src/store/paywallStore';
import { SavedQuestionsProvider } from './src/store/savedQuestionsStore';
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
      Welcome: 'app/welcome',
      Onboarding: 'app/onboarding',
      Signup: 'app/signup',
      Login: 'app/login',
      VerifyEmail: 'verify-email',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      Pricing: 'pricing',
      PaymentSuccess: 'payment/success',
      PaymentCancel: 'payment/cancel',
      App: {
        path: 'app',
        screens: {
          Dashboard: {
            path: 'home',
            screens: {
              DashboardHome: '',
              Guide: 'guide',
              HowTo: 'how-to-use',
              VocabSets: 'vocab/sets',
              VocabLesson: 'vocab/sets/:setId/lesson/:index',
              VocabQuiz: 'vocab/sets/:setId/quiz',
              ClueWords: 'clue-words',
              ClueLesson: 'clue-words/:groupId/lesson/:index',
              ClueQuiz: 'clue-words/:groupId/quiz',
              TopicLessons: 'practice/:sectionId',
              Practice: 'practice/run',
              Result: 'result',
            },
          },
          Test: {
            screens: {
              TestHome: 'tests',
              ModelTest: 'tests/:testId',
              Practice: 'tests/review',
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
  const [rootRoute, setRootRoute] = useState<string | null>(null);
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (loaded) applyGlobalFont();

  useEffect(() => {
    void loadSavedLanguage();
  }, []);

  const inner = !loaded ? (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
    </View>
  ) : (
    <SafeAreaProvider>
      <AuthProvider>
        <PaywallProvider>
          <SavedQuestionsProvider>
            <NavigationContainer
              linking={linking}
              onStateChange={(state) => {
                const route = state?.routes?.[state?.index ?? 0];
                setRootRoute(route?.name ?? null);
              }}
            >
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </SavedQuestionsProvider>
        </PaywallProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );

  return (
    <WebRootFrame isAppRoute={rootRoute === 'App'}>
      {inner}
    </WebRootFrame>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
