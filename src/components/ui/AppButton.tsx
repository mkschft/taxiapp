import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, fontSize, font, shadow } from '../../theme/tokens';

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
  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        variant === 'primary' && shadow.sm,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'secondary' || variant === 'danger' ? colors.primary : '#fff'} size="small" />
        : <Text style={[
            styles.text,
            variant === 'secondary' && styles.textSecondary,
            variant === 'danger' && styles.textDanger,
          ]}>
            {label}
          </Text>
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.95 },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.borderStrong },
  success: { backgroundColor: colors.success },
  danger: { backgroundColor: colors.errorTint, borderWidth: 1.5, borderColor: colors.error },
  disabled: { opacity: 0.5 },
  text: { color: '#fff', fontSize: fontSize.md, fontFamily: font.semibold },
  textSecondary: { color: colors.text },
  textDanger: { color: colors.error },
});
