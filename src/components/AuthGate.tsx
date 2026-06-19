import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../store/authStore';
import { colors } from '../theme/tokens';

export function AuthGate<P extends object>(Component: React.ComponentType<P>) {
  return function WrappedComponent(props: P) {
    const { state, enterGuest } = useAuth();

    const allowed = state.user || state.guest;

    useEffect(() => {
      // The marketing site already handles "try for free", so we skip the
      // in-app splash and drop visitors straight into the app as a local-first
      // guest. Signing up (from Profile) upgrades the guest to a real account.
      if (state.hydrated && !allowed) {
        void enterGuest();
      }
    }, [state.hydrated, allowed, enterGuest]);

    if (!state.hydrated || !allowed) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    return <Component {...props} />;
  };
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
