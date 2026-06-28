import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Languages, Target, ClipboardList, Lock, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/ui/AppButton';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../store/authStore';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'> };

type Slide = { Icon: LucideIcon; tint: string; titleKey: string; bodyKey: string };

const SLIDES: Slide[] = [
  {
    Icon: Languages, tint: colors.primary,
    titleKey: 'auth.slide1Title',
    bodyKey: 'auth.slide1Body',
  },
  {
    Icon: Target, tint: colors.success,
    titleKey: 'auth.slide2Title',
    bodyKey: 'auth.slide2Body',
  },
  {
    Icon: ClipboardList, tint: colors.warning,
    titleKey: 'auth.slide3Title',
    bodyKey: 'auth.slide3Body',
  },
  {
    Icon: Lock, tint: colors.modelTest,
    titleKey: 'auth.slide4Title',
    bodyKey: 'auth.slide4Body',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { markOnboardingSeen } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);
  const isProgrammaticScroll = useRef(false);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  useEffect(() => { indexRef.current = index; }, [index]);

  const isLast = index === SLIDES.length - 1;

  const finish = () => {
    void markOnboardingSeen();
    navigation.replace('App');
  };

  const next = () => {
    if (isLast) { void finish(); return; }
    const nextIndex = index + 1;
    isProgrammaticScroll.current = true;
    setIndex(nextIndex);
    indexRef.current = nextIndex;
    scrollRef.current?.scrollTo({ x: width * nextIndex, animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);

    if (isProgrammaticScroll.current) {
      if (i === indexRef.current) {
        isProgrammaticScroll.current = false;
      }
      return;
    }

    if (i >= 0 && i < SLIDES.length && i !== indexRef.current) {
      setIndex(i);
      indexRef.current = i;
    }
  };

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.skip} onPress={finish}>{t('auth.skip')}</Text>
      </View>

      <View style={styles.carousel} onLayout={onLayout}>
        {width > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onScroll}
          >
            {SLIDES.map(s => (
              <View key={s.titleKey} style={[styles.slide, { width }]}>
                <View style={[styles.iconChip, { backgroundColor: s.tint + '18' }]}>
                  <s.Icon size={40} color={s.tint} strokeWidth={2} />
                </View>
                <Text style={styles.title}>{t(s.titleKey)}</Text>
                <Text style={styles.body}>{t(s.bodyKey)}</Text>
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
        <AppButton label={isLast ? t('auth.getStarted') : t('common.next')} onPress={next} />
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
