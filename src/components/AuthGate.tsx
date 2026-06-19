import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../store/authStore';
import { colors } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function AuthGate<P extends object>(Component: React.ComponentType<P>) {
  return function WrappedComponent(props: P) {
    const navigation = useNavigation<NavigationProp>();
    const { state } = useAuth();

    const allowed = state.user || state.guest;

    useEffect(() => {
      // Send unauthenticated visitors to Signup — unless they chose the
      // local-first guest preview, which is allowed in without an account.
      if (state.hydrated && !allowed) {
        navigation.navigate('Signup');
      }
    }, [state.hydrated, allowed, navigation]);

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
