import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, radius, fontSize } from '../../theme/tokens';

type Variant = 'primary' | 'secondary' | 'success' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function AppButton({ label, onPress, variant = 'primary', loading, disabled, style }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled, style]}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Text style={[
            styles.text,
            variant === 'secondary' && styles.textSecondary,
            variant === 'danger' && styles.textDanger,
          ]}>
            {label}
          </Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  success: { backgroundColor: colors.success },
  danger: { backgroundColor: colors.errorTint, borderWidth: 1, borderColor: colors.error, },
  disabled: { opacity: 0.5 },
  text: { color: '#fff', fontSize: fontSize.md, fontWeight: '600' },
  textSecondary: { color: colors.text },
  textDanger: { color: colors.error },
});
