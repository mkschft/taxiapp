import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppButton } from './ui/AppButton';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';

type Props = {
  title?: string;
  body?: string;
  compact?: boolean;
};

export function AuthPrompt({ title, body, compact }: Props) {
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, compact && styles.compact, !compact && shadow.sm]}>
      <Text style={styles.title}>{title ?? 'Sign in to practice'}</Text>
      <Text style={styles.body}>{body ?? 'Create a free account to take quizzes and track your progress.'}</Text>
      <AppButton label="Sign up" onPress={() => navigation.navigate('Signup')} />
      <AppButton
        label="Log in"
        variant="secondary"
        onPress={() => navigation.navigate('Login')}
        style={{ marginTop: spacing.sm }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bg,
    gap: spacing.sm,
  },
  compact: { padding: spacing.sm },
  title: { fontSize: fontSize.md, fontFamily: font.bold, color: colors.text },
  body: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.xs },
});
