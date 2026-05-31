import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Check, AlertTriangle, Zap } from 'lucide-react-native';
import { AppButton } from '../components/ui/AppButton';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import { getVocabByPage, getVocabPageCount } from '../data/loaders';
import { useProgress } from '../store/progressStore';
import type { StudyStackParamList } from '../navigation/types';
import type { VocabWord } from '../data/types';

type Props = {
  navigation: NativeStackNavigationProp<StudyStackParamList, 'Vocabulary'>;
  route: RouteProp<StudyStackParamList, 'Vocabulary'>;
};

type Lang = 'fi' | 'en';

const CLUE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  positive: { label: 'Positive clue', color: colors.success, bg: colors.successTint },
  negative: { label: 'Negative clue', color: colors.error, bg: colors.errorTint },
  neutral: { label: '', color: '', bg: '' },
};

function VocabRow({ word, lang, seen }: { word: VocabWord; lang: Lang; seen: boolean }) {
  const clue = CLUE_LABELS[word.clue_type];
  const isPos = word.clue_type === 'positive';
  return (
    <View style={[styles.vocabRow, seen && styles.vocabRowSeen]}>
      <View style={styles.vocabFi}>
        <Text style={styles.wordFi}>{word.word_fi}</Text>
        <Text style={styles.formsFi}>{word.forms_fi.join(' / ')}</Text>
      </View>
      <View style={styles.vocabRight}>
        {lang === 'en' ? (
          <Text style={styles.wordEn}>{word.easy_en}</Text>
        ) : (
          <Text style={styles.wordEn}>{word.word_fi}</Text>
        )}
        {clue.label !== '' && (
          <View style={[styles.cluePill, { backgroundColor: clue.bg }]}>
            {isPos
              ? <Check size={11} color={clue.color} strokeWidth={3} />
              : <AlertTriangle size={10} color={clue.color} strokeWidth={2.6} />}
            <Text style={[styles.cluePillText, { color: clue.color }]}>{clue.label}</Text>
          </View>
        )}
        {word.appears_in_question_ids.length > 0 && (
          <View style={styles.appearsInRow}>
            <Zap size={11} color={colors.textSecondary} strokeWidth={2.2} />
            <Text style={styles.appearsIn}>{word.appears_in_question_ids.length} exam Qs</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function VocabularyScreen({ navigation, route }: Props) {
  const page = route.params?.page ?? 1;
  const totalPages = getVocabPageCount();
  const words = getVocabByPage(page);
  const { state, dispatch } = useProgress();

  const [lang, setLang] = useState<Lang>('en');

  const markAllSeen = () => {
    words.forEach(w => dispatch({ type: 'MARK_VOCAB_SEEN', id: w.id }));
  };

  const handleStartQuiz = () => {
    markAllSeen();
    // Navigate to practice with a set of questions from this vocab page's question IDs
    const qIds = [...new Set(words.flatMap(w => w.appears_in_question_ids))].slice(0, 5);
    if (qIds.length > 0) {
      navigation.navigate('Practice', {
        questionId: qIds[0],
        queue: qIds,
        queueIndex: 0,
        sourceLabel: `Vocab Page ${page} Quiz`,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={`Vocabulary — Page ${page}`}
        onBack={() => navigation.goBack()}
        right={
          <View style={styles.langToggle}>
            {(['fi', 'en'] as Lang[]).map(l => (
              <TouchableOpacity
                key={l}
                style={[styles.langBtn, lang === l && styles.langBtnActive]}
                onPress={() => setLang(l)}
              >
                <Text style={[styles.langBtnText, lang === l && styles.langBtnTextActive]}>
                  {l.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        }
      />

      <View style={styles.subHeader}>
        <Text style={styles.caption}>Page {page} of {totalPages} · {words.length} words</Text>
      </View>

      <FlatList
        data={words}
        keyExtractor={w => w.id}
        renderItem={({ item }) => (
          <VocabRow
            word={item}
            lang={lang}
            seen={!!state.vocab[item.id]?.seen}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListFooterComponent={
          <View style={styles.footer}>
            <AppButton label="Start mini quiz ✓" variant="success" onPress={handleStartQuiz} />
            {page < totalPages && (
              <AppButton
                label={`Next page →`}
                variant="secondary"
                onPress={() => navigation.replace('Vocabulary', { page: page + 1 })}
                style={{ marginTop: spacing.sm }}
              />
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  langToggle: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: 8, padding: 2, gap: 2,
  },
  langBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  langBtnActive: { backgroundColor: colors.bg },
  langBtnText: { fontSize: fontSize.sm, fontFamily: font.semibold, color: colors.textSecondary },
  langBtnTextActive: { color: colors.primary },
  subHeader: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  caption: { fontSize: fontSize.sm, color: colors.textSecondary },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  vocabRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 12, gap: 12,
  },
  vocabRowSeen: { opacity: 0.8 },
  vocabFi: { width: 130, flexShrink: 0 },
  wordFi: { fontSize: 15, fontFamily: font.semibold, color: colors.text },
  formsFi: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  vocabRight: { flex: 1, gap: 4 },
  wordEn: { fontSize: 14, color: colors.text },
  cluePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 2 },
  cluePillText: { fontSize: 11, fontFamily: font.semibold },
  appearsInRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  appearsIn: { fontSize: 12, color: colors.textSecondary },
  sep: { height: 1, backgroundColor: colors.border },
  footer: { paddingTop: spacing.lg, paddingBottom: 32 },
});
