import { Platform, ViewStyle } from 'react-native';

export const colors = {
  bg: '#FFFFFF',
  surface: '#F7F9FC',
  surfaceAlt: '#F0F3F8',
  border: '#E6EAF0',
  borderStrong: '#D7DDE6',
  text: '#16181D',
  textSecondary: '#6B7280',
  textTertiary: '#9AA1AD',
  primary: '#1F6FEB',
  primaryDark: '#1558C4',
  success: '#1FA463',
  warning: '#D98E00',
  error: '#E23B3B',
  // Model Tests module accent (distinct from the 4 category colours)
  modelTest: '#7C3AED',
  // tints
  primaryTint: '#EDF3FE',
  successTint: '#E8F6EF',
  warningTint: '#FDF6E7',
  errorTint: '#FDECEC',
  // named accent borders/surfaces that were previously hard-coded in screens
  warningBorder: '#F0D070',
  errorSurface: '#FFF8F8',
  errorBorder: '#FECACA',
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 28,
};

// Inter font family names (loaded in App.tsx)
export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

// kept for backwards-compat with existing screens (fontWeight refs)
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Soft, layered elevation — subtle, not heavy
export const shadow = {
  sm: Platform.select({
    web: { boxShadow: '0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)' },
    default: {
      shadowColor: '#101828',
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
  }) as ViewStyle,
  md: Platform.select({
    web: { boxShadow: '0 4px 12px rgba(16,24,40,0.08), 0 2px 4px rgba(16,24,40,0.04)' },
    default: {
      shadowColor: '#101828',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
  }) as ViewStyle,
};
