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

  // App routes always fill the viewport. Guest/auth/payment routes only keep
  // the 430px phone shell on compact web viewports; on wider screens they
  // render full-viewport so each screen can provide its own responsive layout.
  if (isAppRoute || !isCompact) {
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
