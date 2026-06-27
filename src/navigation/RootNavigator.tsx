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
import { PricingScreen } from '../screens/PricingScreen';
import { PaymentSuccessScreen } from '../screens/PaymentSuccessScreen';
import { PaymentCancelScreen } from '../screens/PaymentCancelScreen';
import { AppTabs } from './AppTabs';
import { useAuth } from '../store/authStore';
import { colors } from '../theme/tokens';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// All screens are always registered so navigation actions never fail with a
// missing-route error.  The entry point is driven by `initialRouteName`, which
// React Navigation evaluates on mount.  After auth state changes the *calling*
// screen performs the navigation imperatively (e.g. Login → replace('App')) so
// the user is never left stranded.
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

  let initialRouteName: keyof RootStackParamList;
  if (!entered) {
    initialRouteName = 'Welcome';
  } else if (needsVerification) {
    initialRouteName = 'VerifyEmail';
  } else if (!state.onboardingSeen) {
    initialRouteName = 'Onboarding';
  } else {
    initialRouteName = 'App';
  }

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="App" component={AppTabs} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="Pricing" component={PricingScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="PaymentCancel" component={PaymentCancelScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
