import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { setAppLanguage, type AppLanguage } from '../../i18n';
import { colors, fontSize, font, radius } from '../../theme/tokens';

type Props = {
  compact?: boolean;
};

export function LanguageToggle({ compact = false }: Props) {
  const { i18n } = useTranslation();
  const active: AppLanguage = i18n.language === 'fi' ? 'fi' : 'en';

  const item = (lang: AppLanguage, label: string) => (
    <Pressable
      key={lang}
      onPress={() => setAppLanguage(lang)}
      style={({ pressed }) => [
        styles.item,
        compact && styles.itemCompact,
        active === lang && styles.itemActive,
        pressed && styles.itemPressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          compact && styles.labelCompact,
          active === lang && styles.labelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {item('en', 'EN')}
      {item('fi', 'FI')}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
    height: 38,
  },
  rowCompact: { height: 32 },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radius.full,
  },
  itemCompact: {
    paddingHorizontal: 10,
    height: 26,
  },
  itemActive: { backgroundColor: colors.primary },
  itemPressed: { opacity: 0.85 },
  label: {
    fontSize: fontSize.sm,
    fontFamily: font.semibold,
    color: colors.textSecondary,
  },
  labelCompact: { fontSize: 12 },
  labelActive: { color: '#fff' },
});
