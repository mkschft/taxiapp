import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Languages, Target, ClipboardList, Lock, type LucideIcon } from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../store/authStore';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'> };

type Slide = { Icon: LucideIcon; tint: string; title: string; body: string };

const SLIDES: Slide[] = [
  {
    Icon: Languages, tint: colors.primary,
    title: 'Study in your language',
    body: 'The exam is in Finnish, but you don’t have to be. Read every question and answer in English alongside the original Finnish.',
  },
  {
    Icon: Target, tint: colors.success,
    title: 'Learn the clue words',
    body: 'Finnish “trigger words” quietly signal the right answer. We teach you to spot them — so you pass even with weak Finnish.',
  },
  {
    Icon: ClipboardList, tint: colors.warning,
    title: 'Practice the real exam',
    body: '300+ questions across all 4 official categories, plus 5 timed model tests scored exactly like Traficom’s.',
  },
  {
    Icon: Lock, tint: colors.modelTest,
    title: 'Free preview vs full access',
    body: 'Browsing as a guest? You get “How to use the app” and the Exam Guide. Create a free account to unlock vocabulary, practice, clue words and model tests.',
  },
];

export function OnboardingScreen(_props: Props) {
  const { markOnboardingSeen } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  // Marking onboarding seen flips auth state; the root navigator swaps this
  // screen out for the App tabs automatically.
  const finish = () => { void markOnboardingSeen(); };

  const next = () => {
    if (isLast) { void finish(); return; }
    scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.skip} onPress={finish}>Skip</Text>
      </View>

      <View style={styles.carousel} onLayout={onLayout}>
        {width > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
          >
            {SLIDES.map(s => (
              <View key={s.title} style={[styles.slide, { width }]}>
                <View style={[styles.iconChip, { backgroundColor: s.tint + '18' }]}>
                  <s.Icon size={40} color={s.tint} strokeWidth={2} />
                </View>
                <Text style={styles.title}>{s.title}</Text>
                <Text style={styles.body}>{s.body}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        <AppButton label={isLast ? 'Get started' : 'Next'} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { height: 44, justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: spacing.lg },
  skip: { fontSize: fontSize.sm, color: colors.textSecondary, fontFamily: font.semibold, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  carousel: { flex: 1 },
  slide: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xl, gap: spacing.md,
  },
  iconChip: {
    width: 88, height: 88, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  title: { fontSize: fontSize.xl, fontFamily: font.extrabold, color: colors.text, textAlign: 'center' },
  body: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: spacing.md },
  dot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 22 },
  actions: { padding: spacing.lg, paddingTop: 0 },
});
