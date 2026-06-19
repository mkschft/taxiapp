import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { radius, colors, spacing } from '../../theme/tokens';

/* ── Question images ────────────────────────────────────────────────────────
 * A few questions reference a diagram/sign that lived only in the editor's
 * Excel. The question CONTENT is regenerated from Excel into JSON, so images
 * are kept here as a static id→asset registry (rebuild-safe — not wiped when
 * the JSON is rebuilt). Keyed by Question.id / ModelTestQuestion.id.
 */
const QUESTION_IMAGES: Record<string, ReturnType<typeof require>> = {
  Q284: require('../../../assets/questions/Q284.jpg'),
  Q293: require('../../../assets/questions/Q293.png'),
  Q324: require('../../../assets/questions/Q324.png'),
  // Q246 & Q247 are the same question (no-vehicles sign + taxi pickup/drop-off plate).
  Q246: require('../../../assets/questions/Q246.png'),
  Q247: require('../../../assets/questions/Q246.png'),
  'MTQ-026': require('../../../assets/questions/MTQ-026.jpeg'),
  'MTQ-042': require('../../../assets/questions/MTQ-042.jpg'),
  'MTQ-043': require('../../../assets/questions/MTQ-043.jpg'),
  'MTQ-044': require('../../../assets/questions/MTQ-044.jpeg'),
  // MTQ-053 asks about the same "no motor vehicles" sign as Q293 — reuse it.
  'MTQ-053': require('../../../assets/questions/Q293.png'),
};

export function hasQuestionImage(id: string): boolean {
  return id in QUESTION_IMAGES;
}

/** Renders the question's diagram if one is registered, otherwise nothing. */
export function QuestionImage({ id }: { id: string }) {
  const source = QUESTION_IMAGES[id];
  if (!source) return null;
  return (
    <View style={styles.wrap}>
      <Image source={source} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
});
