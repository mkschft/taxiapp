import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { X, Bookmark } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { localizedPair } from '../i18n/content';
import { OptionRow, OptionState } from '../components/question/OptionRow';
import { QuestionImage } from '../components/question/QuestionImage';
import { QuestionTariff } from '../components/question/QuestionTariff';
import { AppButton } from '../components/ui/AppButton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useSavedQuestions } from '../store/savedQuestionsStore';
import { useAuth } from '../store/authStore';
import { usePaywall } from '../store/paywallStore';
import { Paywall } from '../components/Paywall';
import { colors, spacing, fontSize, font, radius } from '../theme/tokens';
import { ContentContainer } from '../components/web/ContentContainer';
import { getTopicSection, getTopicSectionQuestionIds, getQuestionById } from '../data/loaders';
import type { Question } from '../data/types';
import type { DashboardStackParamList } from '../navigation/types';
import { getProblemSet, submitAnswer, completeSession } from '../lib/quizApi';
import type { BackendProblem } from '../lib/quizApi';
import { loadItem, saveItem, removeItem } from '../store/storage';

type Props = {
  navigation: NativeStackNavigationProp<DashboardStackParamList, 'ModuleQuiz'>;
  route: RouteProp<DashboardStackParamList, 'ModuleQuiz'>;
};

type Choice = 'A' | 'B' | 'C';

type ModuleQuestion = {
  id: string;
  text: string;
  options: { key: Choice; fi: string }[];
  correctKey: Choice;
  imageKey?: string;
};

const DEFAULT_PASS_PCT = 70;
const RESUME_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const progressKey = (sectionId: string) => `@taxi/moduleQuizProgress:${sectionId}`;

type SavedProgress = {
  questions: ModuleQuestion[];
  answers: Record<string, Choice>;
  qIndex: number;
  startedAt: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fromLocal(q: Question): ModuleQuestion {
  return {
    id: q.id,
    text: q.question.fi ?? '',
    options: q.options
      .filter(o => o.fi)
      .map(o => ({ key: o.key as Choice, fi: o.fi! })),
    correctKey: q.correct_option as Choice,
    imageKey: q.id,
  };
}

function fromBackend(p: BackendProblem): ModuleQuestion {
  const options = p.options
    .map((text, i) => ({ key: String.fromCharCode(65 + i) as Choice, fi: text }));
  return {
    id: p._id,
    text: p.text,
    options,
    correctKey: String.fromCharCode(65 + p.correctAnswer) as Choice,
    imageKey: p.imageKey,
  };
}

// One quiz covering the whole module at once (all lessons combined), sized to
// the real Traficom module pass gate (pass_total) — same layout/UX as Mock
// Exams (ModelTestScreen) minus the countdown timer, since this is a shorter
// checkpoint rather than a full timed exam.
export function ModuleQuizScreen({ navigation, route }: Props) {
  const { sectionId, sessionId, problemSetId } = route.params;
  const section = getTopicSection(sectionId);
  const { t, i18n } = useTranslation();
  const { isSaved, toggle } = useSavedQuestions();
  const { state: authState } = useAuth();
  const { hasFullAccess } = usePaywall();
  const isAuthenticated = !!authState.user;
  const rootNav = useNavigation<any>();

  const passPct =
    section?.pass_correct && section?.pass_total
      ? Math.round((section.pass_correct / section.pass_total) * 100)
      : DEFAULT_PASS_PCT;

  const [loading, setLoading] = useState(!!problemSetId);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ModuleQuestion[]>([]);

  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Choice>>({});

  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    variant?: 'default' | 'danger';
    onConfirm: () => void;
  } | null>(null);

  const startTimeRef = useRef(Date.now());
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const saved = await loadItem<SavedProgress | null>(progressKey(sectionId), null);
      if (saved && Date.now() - saved.startedAt < RESUME_MAX_AGE_MS && saved.questions.length > 0) {
        if (cancelled) return;
        setQuestions(saved.questions);
        setAnswers(saved.answers);
        setQIndex(Math.min(saved.qIndex, saved.questions.length - 1));
        startTimeRef.current = saved.startedAt;
        setLoading(false);
        setHydrated(true);
        return;
      }
      if (saved) void removeItem(progressKey(sectionId));

      if (problemSetId) {
        setLoading(true);
        try {
          const ps = await getProblemSet(problemSetId);
          if (!cancelled) setQuestions(ps.problems.map(fromBackend));
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : t('moduleQuiz.loadError'));
        } finally {
          if (!cancelled) setLoading(false);
        }
      } else if (section) {
        const pool = getTopicSectionQuestionIds(sectionId)
          .map(getQuestionById)
          .filter((q): q is Question => !!q);
        const size = section.pass_total ?? pool.length;
        if (!cancelled) setQuestions(shuffle(pool).slice(0, size).map(fromLocal));
      }
      if (!cancelled) setHydrated(true);
    })();

    return () => { cancelled = true; };
  }, [problemSetId, sectionId, section, t]);

  useEffect(() => {
    if (!hydrated || loading || questions.length === 0) return;
    void saveItem(progressKey(sectionId), {
      questions, answers, qIndex, startedAt: startTimeRef.current,
    } satisfies SavedProgress);
  }, [hydrated, loading, sectionId, questions, answers, qIndex]);

  const submit = useCallback(async (auto: boolean) => {
    if (questions.length === 0 || !section) return;

    const ids = questions.map(q => q.id);
    const finalAnswers = answersRef.current;
    const wrongIds = ids.filter(id => {
      const q = questions.find(x => x.id === id);
      return !q || finalAnswers[id] !== q.correctKey;
    });
    const score = ids.length - wrongIds.length;
    const total = ids.length;
    const pct = Math.round((score / total) * 100);
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const { primary: moduleTitle } = localizedPair(section.name_fi, section.name_en, i18n.language);
    const label = t('topic.moduleHeader', { n: section.order, name: moduleTitle });

    if (sessionId) {
      for (const id of ids) {
        const q = questions.find(x => x.id === id);
        if (!q) continue;
        const optionIndex = q.options.findIndex(o => o.key === finalAnswers[id]);
        if (optionIndex >= 0) {
          try {
            await submitAnswer(sessionId, id, optionIndex);
          } catch (e) {
            console.warn('Failed to submit answer', e);
          }
        }
      }
      try {
        await completeSession(sessionId);
      } catch (e) {
        console.warn('Failed to complete session', e);
      }
    }

    void removeItem(progressKey(sectionId));

    navigation.replace('Result', {
      mode: 'quiz',
      label,
      score,
      total,
      wrongIds,
      timeTaken,
      answers: finalAnswers,
      passed: pct >= passPct,
    });
  }, [questions, navigation, section, sessionId, sectionId, i18n.language, t, passPct]);

  if (isAuthenticated && !hasFullAccess()) {
    return (
      <Paywall
        title={t('topic.title')}
        blurb={t('topic.paywallBlurb')}
        perks={[t('topic.paywallPerkAll'), t('topic.paywallPerkExplained'), t('topic.paywallPerkPassMark')]}
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard' as never))}
        onSubscribe={() => rootNav.navigate('Pricing', { redirectTab: 'Dashboard', redirectScreen: 'DashboardHome' })}
      />
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !section || questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || t('moduleQuiz.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ids = questions.map(q => q.id);
  const question = questions[qIndex];
  const selected = answers[question.id];
  const isLast = qIndex === ids.length - 1;
  const answeredCount = ids.filter(id => answers[id]).length;
  const { primary: moduleTitle } = localizedPair(section.name_fi, section.name_en, i18n.language);
  const navTitle = t('topic.moduleHeader', { n: section.order, name: moduleTitle });

  const optionStates: Record<string, OptionState> = {};
  question.options.forEach(o => {
    optionStates[o.key] = selected === o.key ? 'selected' : 'idle';
  });

  const handleSelect = (key: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: key as Choice }));
  };

  const goNext = () => setQIndex(i => Math.min(ids.length - 1, i + 1));

  const confirmSubmit = () => {
    const unanswered = ids.length - answeredCount;
    const detail = unanswered > 0
      ? t('modelTest.submitUnanswered', { n: unanswered })
      : t('modelTest.submitConfirm');
    setDialog({
      title: t('modelTest.submitTitle'),
      message: detail,
      confirmLabel: t('modelTest.submit'),
      cancelLabel: t('common.cancel'),
      onConfirm: () => submit(false),
    });
  };

  const progress = ((qIndex + 1) / ids.length) * 100;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => setDialog({
            title: t('moduleQuiz.closeTitle'),
            message: t('moduleQuiz.closeMessage'),
            confirmLabel: t('moduleQuiz.close'),
            cancelLabel: t('common.cancel'),
            variant: 'danger',
            onConfirm: () => navigation.goBack(),
          })}
          style={styles.backBtn}
        >
          <X size={22} color={colors.textSecondary} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{navTitle}</Text>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.qCount}>{qIndex + 1}/{ids.length}</Text>
      </View>

      <ContentContainer maxWidth={1120}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.qCategory}>{t('modelTest.question', { n: qIndex + 1, total: ids.length })}</Text>
          <View style={styles.questionCard}>
            <Text style={styles.qText}>{question.text}</Text>
            <QuestionImage imageKey={question.imageKey ?? question.id} />
            <QuestionTariff id={question.id} />
          </View>

          {question.options.map(opt => (
            <OptionRow
              key={opt.key}
              letter={opt.key}
              text={opt.fi}
              state={optionStates[opt.key]}
              onPress={() => handleSelect(opt.key)}
            />
          ))}

          <View style={{ height: 16 }} />
        </ScrollView>
      </ContentContainer>

      <View style={styles.footer}>
        <Text style={styles.answeredHint}>
          {t('modelTest.answered', { count: answeredCount, total: ids.length })}
        </Text>
        <TouchableOpacity
          style={[styles.markBtn, isSaved(question.id) && styles.markBtnActive]}
          onPress={() => toggle({
            id: question.id,
            text: question.text,
            options: question.options.map(o => ({ key: o.key, text: o.fi })),
            correctKey: question.correctKey,
            source: navTitle,
          })}
        >
          <Bookmark
            size={15}
            color={isSaved(question.id) ? colors.primary : colors.textSecondary}
            fill={isSaved(question.id) ? colors.primary : 'transparent'}
            strokeWidth={2.2}
          />
          <Text style={[styles.markText, isSaved(question.id) && styles.markTextActive]}>
            {isSaved(question.id) ? t('modelTest.marked') : t('modelTest.mark')}
          </Text>
        </TouchableOpacity>
        {isLast ? (
          <View style={styles.submitWrap}>
            <AppButton label={t('modelTest.finish')} onPress={confirmSubmit} />
          </View>
        ) : (
          <TouchableOpacity style={[styles.navBtn, styles.navBtnPrimary]} onPress={goNext}>
            <Text style={[styles.navBtnText, styles.navBtnTextPrimary]}>{t('modelTest.next')} →</Text>
          </TouchableOpacity>
        )}
      </View>

      <ConfirmDialog
        visible={!!dialog}
        title={dialog?.title ?? ''}
        message={dialog?.message}
        confirmLabel={dialog?.confirmLabel ?? ''}
        cancelLabel={dialog?.cancelLabel ?? ''}
        variant={dialog?.variant}
        onConfirm={() => { dialog?.onConfirm(); setDialog(null); }}
        onCancel={() => setDialog(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
  navBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.md, height: 52,
    borderBottomWidth: 1, borderColor: colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  navTitle: { flex: 1, fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  progressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  progressTrack: {
    flex: 1, height: 6, backgroundColor: colors.surface,
    borderRadius: radius.full, overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
  qCount: { fontSize: fontSize.sm, color: colors.textSecondary, minWidth: 36, textAlign: 'right' },
  scroll: { flex: 1, padding: spacing.md },
  qCategory: { fontSize: fontSize.sm, color: colors.textSecondary, fontFamily: font.semibold, marginBottom: 8 },
  questionCard: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  qText: { fontSize: 15, lineHeight: 24, color: colors.text, fontFamily: font.medium },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderColor: colors.border,
  },
  navBtn: {
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
  },
  navBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  navBtnText: { fontSize: fontSize.md, fontFamily: font.semibold, color: colors.text },
  navBtnTextPrimary: { color: '#fff' },
  answeredHint: { flex: 1, textAlign: 'left', fontSize: fontSize.xs, color: colors.textSecondary },
  submitWrap: { minWidth: 130 },
  markBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
  },
  markBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  markText: { fontSize: fontSize.sm, fontFamily: font.semibold, color: colors.textSecondary },
  markTextActive: { color: colors.primary },
});
