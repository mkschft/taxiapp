import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Lock } from 'lucide-react-native';
import { AppButton } from './ui/AppButton';
import { colors, spacing, fontSize, font, radius, shadow } from '../theme/tokens';
import { useAuth } from '../store/authStore';

type Props = {
  title?: string;
  blurb?: string;
};

export function GuestOverlay({ title = 'Create a free account', blurb = 'Sign up or log in to unlock full access and track your progress.' }: Props) {
  const navigation = useNavigation<any>();
  const { state: auth } = useAuth();
  const isGuest = auth.guest && !auth.user;

  if (!isGuest) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.lockChip}>
          <Lock size={28} color={colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.h}>{title}</Text>
        <Text style={styles.sub}>{blurb}</Text>
        <AppButton
          label="Create free account"
          onPress={() => navigation.navigate('Signup')}
          style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
        />
        <AppButton
          label="I already have an account"
          variant="secondary"
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: spacing.sm, alignSelf: 'stretch' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    zIndex: 100,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.md,
  },
  lockChip: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  h: { fontSize: fontSize.xl, fontFamily: font.bold, color: colors.text, textAlign: 'center' },
  sub: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});
