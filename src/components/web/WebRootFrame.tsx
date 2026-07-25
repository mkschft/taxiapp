import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';

type Props = {
  children: React.ReactNode;
  isAppRoute: boolean;
};

export function WebRootFrame({ children, isAppRoute }: Props) {
  if (Platform.OS !== 'web') return children;

  if (isAppRoute) {
    return <View style={styles.webFull}>{children}</View>;
  }

  return (
    <View style={styles.webOuter}>
      <View style={styles.webShell}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  webFull: { flex: 1, width: '100%', height: '100%' },
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
