import React, { useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../store/authStore';
import { isGuestLocked } from '../lib/access';
import { colors } from '../theme/tokens';
import type { AppTabParamList } from '../navigation/types';

export function RequireAuth<P extends object>(
  Component: React.ComponentType<P>,
  tab: keyof AppTabParamList,
) {
  return function WrappedComponent(props: P) {
    const { state } = useAuth();
    const navigation = useNavigation<any>();
    const route = useRoute();

    const isGuest = state.guest && !state.user;
    // Guests may view the orientation screens (see lib/access); everything else
    // is sign-up gated. Signed-in users always pass (paywall handles paid tiers).
    const guestAllowed = isGuest && !isGuestLocked(route.name, true);
    const canView = !!state.user || guestAllowed;

    // Redirect on focus (not a one-shot mount effect) so returning to an
    // already-mounted tab screen re-evaluates instead of showing a dead spinner.
    useFocusEffect(
      useCallback(() => {
        if (!state.hydrated || canView) return;
        if (isGuest) {
          // Guest hitting locked content → sign-up is the natural next step.
          navigation.navigate('Signup');
        } else {
          // No account and not a guest. You can only reach the tabs while
          // entered (user || guest), so this means the session just ended
          // (logout / 401) — return to the home screen, as the logout dialog
          // promises.
          navigation.navigate('Welcome');
        }
      }, [state.hydrated, canView, isGuest, navigation]),
    );

    if (!state.hydrated || !canView) {
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
