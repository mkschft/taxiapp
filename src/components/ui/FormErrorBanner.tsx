import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { colors, spacing, fontSize, font, radius } from '../../theme/tokens';

type Props = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function FormErrorBanner({ message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <AlertCircle size={18} color={colors.error} strokeWidth={2.2} />
      <Text style={styles.message}>
        {message}
        {actionLabel && onAction ? (
          <Text>
            {' '}
            <Text style={styles.action} onPress={onAction}>
              {actionLabel}
            </Text>
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.errorTint,
    borderWidth: 1,
    borderColor: colors.error + '30',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  message: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: font.medium,
    color: colors.error,
    lineHeight: 20,
  },
  action: {
    color: colors.error,
    textDecorationLine: 'underline',
    fontFamily: font.bold,
  },
});
