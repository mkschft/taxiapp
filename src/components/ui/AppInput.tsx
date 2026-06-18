import React from 'react';
import { View, TextInput, Text, StyleSheet, type TextInputProps } from 'react-native';
import { colors, spacing, fontSize, font, radius } from '../../theme/tokens';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export const AppInput = React.forwardRef<TextInput, Props>(
  ({ label, error, style, ...rest }, ref) => {
    return (
      <View style={[styles.container, style]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, error ? styles.inputError : {}]}
          {...rest}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: { width: '100%' },
  label: {
    fontSize: fontSize.sm,
    fontFamily: font.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    fontFamily: font.regular,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
    fontFamily: font.medium,
  },
});
