import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';
import { parseClues } from '../../utils/clueParser';
import type { ClueAnnotation } from '../../data/types';

type Props = {
  text: string | null | undefined;
  clueAnnotations: ClueAnnotation[];
  style?: object;
  showHighlights?: boolean;
};

export function ClueHighlight({ text, clueAnnotations, style, showHighlights = false }: Props) {
  const safeText = text ?? '';

  if (!showHighlights || !clueAnnotations?.length) {
    return <Text style={style}>{safeText}</Text>;
  }

  const segments = parseClues(safeText, clueAnnotations);

  return (
    <Text style={style}>
      {segments.map((seg, i) => {
        if (!seg.isClue) return <Text key={i}>{seg.text}</Text>;
        return (
          <Text
            key={i}
            style={[
              styles.clue,
              seg.clueType === 'fw' && styles.focusWord,
              seg.clueType === 'pcw' && styles.positive,
              seg.clueType === 'ncw' && styles.negative,
            ]}
          >
            {seg.text}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  clue: {
    fontWeight: '700',
    borderRadius: 3,
  },
  focusWord: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  positive: {
    backgroundColor: colors.successTint,
    color: colors.success,
  },
  negative: {
    backgroundColor: colors.errorTint,
    color: colors.error,
  },
});
