import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { CDN_BASE_URL } from '../../lib/constants';
import { radius, colors, spacing } from '../../theme/tokens';

const QUESTION_IMAGES: Record<string, ReturnType<typeof require>> = {
  Q284: require('../../../assets/questions/Q284.jpg'),
  'Q284.jpg': require('../../../assets/questions/Q284.jpg'),
  Q293: require('../../../assets/questions/Q293.png'),
  'Q293.png': require('../../../assets/questions/Q293.png'),
  Q324: require('../../../assets/questions/Q324.png'),
  'Q324.png': require('../../../assets/questions/Q324.png'),
  Q246: require('../../../assets/questions/Q246.png'),
  'Q246.png': require('../../../assets/questions/Q246.png'),
  Q247: require('../../../assets/questions/Q246.png'),
  'Q247.png': require('../../../assets/questions/Q246.png'),
  'MTQ-026': require('../../../assets/questions/MTQ-026.jpeg'),
  'MTQ-026.jpeg': require('../../../assets/questions/MTQ-026.jpeg'),
  'MTQ-042': require('../../../assets/questions/MTQ-042.jpg'),
  'MTQ-042.jpg': require('../../../assets/questions/MTQ-042.jpg'),
  'MTQ-043': require('../../../assets/questions/MTQ-043.jpg'),
  'MTQ-043.jpg': require('../../../assets/questions/MTQ-043.jpg'),
  'MTQ-044': require('../../../assets/questions/MTQ-044.jpeg'),
  'MTQ-044.jpeg': require('../../../assets/questions/MTQ-044.jpeg'),
  'MTQ-053': require('../../../assets/questions/Q293.png'),
  'MTQ-053.png': require('../../../assets/questions/Q293.png'),
};

export function hasQuestionImage(id: string): boolean {
  return id in QUESTION_IMAGES || id.includes('.');
}

type QuestionImageProps = {
  imageKey?: string | null;
};

export function QuestionImage({ imageKey }: QuestionImageProps) {
  if (!imageKey) return null;

  if (imageKey.startsWith('http')) {
    return (
      <View style={styles.wrap}>
        <Image source={{ uri: imageKey }} style={styles.image} resizeMode="contain" />
      </View>
    );
  }

  const localSource = QUESTION_IMAGES[imageKey];
  if (localSource) {
    return (
      <View style={styles.wrap}>
        <Image source={localSource} style={styles.image} resizeMode="contain" />
      </View>
    );
  }

  if (imageKey.includes('.')) {
    return (
      <View style={styles.wrap}>
        <Image source={{ uri: `${CDN_BASE_URL}/${imageKey}` }} style={styles.image} resizeMode="contain" />
      </View>
    );
  }

  return null;
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
