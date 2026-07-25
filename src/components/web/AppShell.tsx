import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { SidebarNav } from './SidebarNav';
import { TopNavbar } from './TopNavbar';
import { usePaywall } from '../../store/paywallStore';
import type { RootStackParamList } from '../../navigation/types';

type Props = {
  children: React.ReactNode;
  activeTab: string;
  activeRoute: string;
};

export function AppShell({ children, activeTab, activeRoute }: Props) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { hasFullAccess } = usePaywall();

  const onNavigate = (target: { name: string; params?: object }) => {
    navigation.navigate('App', { screen: target.name, params: target.params } as any);
  };

  return (
    <View style={styles.shell}>
      <SidebarNav
        activeTab={activeTab}
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        onSignIn={() => navigation.navigate('Welcome')}
      />
      <View style={styles.main}>
        <TopNavbar
          activeRoute={activeRoute}
          showUpgrade={!hasFullAccess()}
          onUpgrade={() => navigation.navigate('Pricing')}
        />
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row', width: '100%', height: '100%' },
  main: { flex: 1, flexDirection: 'column', height: '100%' },
  content: { flex: 1, minWidth: 0 },
});
