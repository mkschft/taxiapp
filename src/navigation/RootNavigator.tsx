import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { VerifyEmailScreen } from '../screens/VerifyEmailScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { AppTabs } from './AppTabs';
import { useAuth } from '../store/authStore';
import { colors } from '../theme/tokens';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// State-driven entry gate (the idiomatic React Navigation auth pattern). Which
// screens exist depends on auth state, so the navigator moves itself when state
// changes — no imperative reset/replace that would fight web deep-linking:
//   no account & no guest        → only Welcome exists  (a deep link to /app
//                                   has no App screen to match, so it falls
//                                   back here — auth first)
//   entered & unverified user    → only VerifyEmail exists
//   entered & onboarding unseen  → only Onboarding exists
//   entered & onboarding seen    → App tabs
// Signup/Login/ForgotPassword/ResetPassword are always present so guests can
// upgrade from inside the app and deep links work.
export function RootNavigator() {
  const { state } = useAuth();

  if (!state.hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const entered = !!(state.user || state.guest);
  const needsVerification = entered && state.user && !state.user.emailVerified;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!entered ? (
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      ) : needsVerification ? (
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      ) : !state.onboardingSeen ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Screen name="App" component={AppTabs} />
      )}
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
