import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { useBreakpoint } from '../../theme/breakpoints';

type Props = {
  children: React.ReactNode;
  isAppRoute: boolean;
};

export function WebRootFrame({ children, isAppRoute }: Props) {
  const { isCompact } = useBreakpoint();
  if (Platform.OS !== 'web') return children;

  const usePhoneShell = !isAppRoute && isCompact;

  // Keep this two-View structure stable across route changes. Re-parenting the
  // NavigationContainer here remounts it, which resets compact-web navigation.
  return (
    <View style={usePhoneShell ? styles.webOuter : styles.webFull}>
      <View style={usePhoneShell ? styles.webShell : styles.webFull}>{children}</View>
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
