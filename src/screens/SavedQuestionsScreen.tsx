import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Bookmark, X } from 'lucide-react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import { useSavedQuestions } from '../store/savedQuestionsStore';
import type { ProfileStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'SavedQuestions'>;
};

export function SavedQuestionsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { saved, remove } = useSavedQuestions();

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={t('saved.title')} onBack={() => navigation.goBack()} />

      {saved.length === 0 ? (
        <View style={styles.center}>
          <Bookmark size={28} color={colors.textTertiary} strokeWidth={1.8} />
          <Text style={styles.emptyText}>{t('saved.empty')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {saved.map(q => {
            const correct = q.options.find(o => o.key === q.correctKey);
            return (
              <View key={q.id} style={styles.card}>
                <View style={styles.cardHead}>
                  {q.source ? <Text style={styles.source}>{q.source}</Text> : <View />}
                  <TouchableOpacity onPress={() => remove(q.id)} hitSlop={8} style={styles.removeBtn}>
                    <X size={16} color={colors.textTertiary} strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.qText}>{q.text}</Text>
                {correct && (
                  <View style={styles.answerRow}>
                    <Text style={styles.answerLabel}>{t('saved.correctAnswer')}:</Text>
                    <Text style={styles.answerText}>{correct.key}. {correct.text}</Text>
                  </View>
                )}
              </View>
            );
          })}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyText: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  list: { padding: spacing.md, gap: 12 },
  card: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, backgroundColor: colors.bg,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  source: { fontSize: fontSize.xs, fontFamily: font.bold, color: colors.textTertiary, letterSpacing: 0.5 },
  removeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qText: { fontSize: 14, lineHeight: 21, color: colors.text, fontFamily: font.medium },
  answerRow: {
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, gap: 2,
  },
  answerLabel: { fontSize: fontSize.xs, fontFamily: font.bold, color: colors.textTertiary, letterSpacing: 0.4 },
  answerText: { fontSize: fontSize.sm, color: colors.success, fontFamily: font.semibold },
});
