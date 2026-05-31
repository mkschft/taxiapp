import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';
import { parseClues } from '../../utils/clueParser';
import type { ClueWord } from '../../data/types';

type Props = {
  text: string;
  clueWordIds: string[];
  allClueWords: ClueWord[];
  style?: object;
  showHighlights?: boolean;
};

export function ClueHighlight({ text, clueWordIds, allClueWords, style, showHighlights = false }: Props) {
  if (!showHighlights) {
    return <Text style={style}>{text}</Text>;
  }

  const segments = parseClues(text, clueWordIds, allClueWords);

  return (
    <Text style={style}>
      {segments.map((seg, i) => {
        if (!seg.isClue) return <Text key={i}>{seg.text}</Text>;
        const isPos = seg.clueGroup === 'positive';
        const isNeg = seg.clueGroup === 'negative';
        return (
          <Text
            key={i}
            style={[
              styles.clue,
              isPos && styles.positive,
              isNeg && styles.negative,
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
  positive: {
    backgroundColor: colors.successTint,
    color: colors.success,
  },
  negative: {
    backgroundColor: colors.errorTint,
    color: colors.error,
  },
});
