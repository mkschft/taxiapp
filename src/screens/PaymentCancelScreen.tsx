import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { XCircle } from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { colors, spacing, fontSize, font } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PaymentCancel'>;

export function PaymentCancelScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <XCircle size={64} color={colors.error} strokeWidth={1.8} />
        <Text style={styles.h}>{t('pricing.cancelTitle')}</Text>
        <Text style={styles.sub}>{t('pricing.cancelBody')}</Text>
        <AppButton label={t('pricing.backToPlans')} onPress={() => navigation.replace('Pricing')} style={{ marginTop: spacing.lg }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  h: { fontSize: fontSize.xl, fontFamily: font.bold, color: colors.text, marginTop: spacing.lg, textAlign: 'center' },
  sub: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, maxWidth: 320 },
});
