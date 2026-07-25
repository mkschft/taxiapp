import React from 'react';
import {
  View, Text, StyleSheet, useWindowDimensions, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from './LanguageToggle';
import { useBreakpoint } from '../../theme/breakpoints';
import { colors, spacing, fontSize, font, radius, shadow } from '../../theme/tokens';

type Props = {
  children: React.ReactNode;
  variant?: 'split' | 'centered';
  maxWidth?: number;
};

function BrandMark({ appName }: { appName: string }) {
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}>
        <Text style={styles.brandMarkText}>T</Text>
      </View>
      <Text style={styles.brandText}>{appName}</Text>
    </View>
  );
}

export function GuestShell({ children, variant = 'split', maxWidth = 520 }: Props) {
  const { t } = useTranslation();
  const { isCompact } = useBreakpoint();
  const { height } = useWindowDimensions();
  const appName = t('common.appName');

  // On phones and native devices, keep the screen's own mobile layout.
  if (isCompact || Platform.OS !== 'web') return <>{children}</>;

  const cardStyle = [
    styles.card,
    { maxWidth, maxHeight: height * 0.9 },
    shadow.md,
  ];

  if (variant === 'centered') {
    return (
      <View style={styles.webFull}>
        <View style={styles.topBar}>
          <BrandMark appName={appName} />
          <LanguageToggle compact />
        </View>
        <View style={styles.centeredStage}>
          <View style={cardStyle}>{children}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.outer}>
      <View style={[styles.leftPanel, { paddingBottom: height * 0.1 }]}>
        <BrandMark appName={appName} />
        <Text style={styles.tagline}>{t('auth.welcomeTagline')}</Text>
        <Text style={styles.headline}>{t('auth.welcomeHeadlinePrefix')}</Text>
        <Text style={styles.subtitle}>{t('auth.welcomeSubtitle')}</Text>
        <View style={styles.leftFooter}>
          <LanguageToggle />
        </View>
      </View>
      <View style={styles.rightPanel}>
        <View style={cardStyle}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webFull: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceAlt,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: spacing.xl,
  },
  centeredStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  outer: {
    flex: 1,
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
  },
  leftPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.primaryTint,
  },
  rightPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.xl,
    overflow: 'auto' as any,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { fontSize: 18, fontFamily: font.bold, color: '#fff' },
  brandText: { fontSize: fontSize.md, fontFamily: font.bold, color: colors.text },
  tagline: {
    fontSize: fontSize.xs,
    fontFamily: font.bold,
    letterSpacing: 1.2,
    color: colors.primary,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  headline: {
    fontSize: fontSize.xl,
    fontFamily: font.extrabold,
    color: colors.text,
    lineHeight: 36,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  leftFooter: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
  },
});
