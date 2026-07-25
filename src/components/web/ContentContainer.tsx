import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { useBreakpoint } from '../../theme/breakpoints';

type Props = {
  children: React.ReactNode;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
};

export function ContentContainer({ children, maxWidth = 1120, style }: Props) {
  const { isCompact } = useBreakpoint();
  return (
    <View
      style={[
        { flex: 1, width: '100%' },
        !isCompact && { maxWidth, alignSelf: 'center' },
        style,
      ]}
    >
      {children}
    </View>
  );
}
