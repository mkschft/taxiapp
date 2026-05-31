import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, StyleSheet } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ProgressProvider } from './src/store/progressStore';

export default function App() {
  const inner = (
    <SafeAreaProvider>
      <ProgressProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </ProgressProvider>
    </SafeAreaProvider>
  );

  if (Platform.OS !== 'web') return inner;

  // On web: center a phone-width shell with subtle outer background
  return (
    <View style={styles.webOuter}>
      <View style={styles.webShell}>
        {inner}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    // subtle phone-frame shadow on desktop
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 40px rgba(0,0,0,0.12)',
    } as any : {}),
  },
});
