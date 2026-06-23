import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../store/authStore';
import { colors } from '../theme/tokens';
import type { AppTabParamList, AuthRedirectInfo } from '../navigation/types';

export function RequireAuth<P extends object>(
  Component: React.ComponentType<P>,
  tab: keyof AppTabParamList,
) {
  return function WrappedComponent(props: P) {
    const { state } = useAuth();
    const navigation = useNavigation<any>();
    const route = useRoute();

    useEffect(() => {
      if (state.hydrated && !state.user) {
        const redirect: AuthRedirectInfo = {
          tab,
          screen: route.name,
          params: route.params as Record<string, unknown> | undefined,
        };
        navigation.navigate('Login', { redirect });
      }
    }, [state.hydrated, state.user, route.name, route.params, tab, navigation]);

    if (!state.hydrated || !state.user) {
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
