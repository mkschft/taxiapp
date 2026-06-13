import type {
  ExamCategory, Topic, Question, ModelTest, GuideSection,
  VocabData, VocabSet, VocabLessonWord, VocabQuizQuestion,
  ClueData, ClueGroup, ClueLessonWord, ClueQuizQuestion,
  TopicData, TopicSection, TopicLesson,
} from './types';

import categoriesRaw from './json/categories.json';
import topicsRaw from './json/topics.json';
import vocabDataRaw from './json/vocab.json';
import clueDataRaw from './json/clue.json';
import questionsRaw from './json/questions.json';
import modelTestsRaw from './json/model_tests.json';
import modelTestQuestionsRaw from './json/model_test_questions.json';
import guideRaw from './json/guide.json';
import topicPracticeRaw from './json/topic_practice.json';

export const getCategories = (): ExamCategory[] => categoriesRaw as ExamCategory[];
export const getTopics = (): Topic[] => topicsRaw as Topic[];
export const getQuestions = (): Question[] => questionsRaw as unknown as Question[];
export const getModelTests = (): ModelTest[] => modelTestsRaw as ModelTest[];

// Model-test-only questions (not in the main bank) live in a separate file but
// share the Question shape, so the runner resolves both via this lookup.
const allQuestionsById: Record<string, Question> = Object.fromEntries(
  [...(questionsRaw as unknown as Question[]), ...(modelTestQuestionsRaw as unknown as Question[])]
    .map(q => [q.id, q]),
);

export const getQuestionById = (id: string): Question | undefined =>
  allQuestionsById[id];

export const getQuestionsByCategory = (catId: string) =>
  (questionsRaw as unknown as Question[]).filter(q => q.category_id === catId);

/* ── Vocabulary — set-based flow (vocab.json) ────────────────────────────── */
const vocabData = vocabDataRaw as VocabData;

export const getVocabSets = (): VocabSet[] =>
  [...vocabData.sets].sort((a, b) => a.order - b.order);

export const getVocabSet = (setId: string): VocabSet | undefined =>
  vocabData.sets.find(s => s.id === setId);

export const getVocabLesson = (setId: string): VocabLessonWord[] =>
  vocabData.words
    .filter(w => w.set_id === setId)
    .sort((a, b) => a.index - b.index);

export const getVocabQuiz = (setId: string): VocabQuizQuestion[] =>
  vocabData.questions
    .filter(q => q.set_id === setId)
    .sort((a, b) => a.index - b.index);

/** Total lesson words across all sets (for dashboard/progress counts). */
export const getVocabWordTotal = (): number => vocabData.words.length;

/* ── Clue Words — group-based flow (clue.json) ───────────────────────────── */
const clueData = clueDataRaw as ClueData;

export const getClueGroups = (): ClueGroup[] =>
  [...clueData.groups].sort((a, b) => a.order - b.order);

export const getClueGroup = (groupId: string): ClueGroup | undefined =>
  clueData.groups.find(g => g.id === groupId);

export const getClueLesson = (groupId: string): ClueLessonWord[] =>
  clueData.words
    .filter(w => w.group_id === groupId)
    .sort((a, b) => a.index - b.index);

export const getClueQuiz = (groupId: string): ClueQuizQuestion[] =>
  clueData.questions
    .filter(q => q.group_id === groupId)
    .sort((a, b) => a.index - b.index);

/** Total clue words across all groups (for dashboard/progress counts). */
export const getClueWordTotal = (): number => clueData.words.length;

/* ── Topic Practice — section/lesson flow (topic_practice.json) ───────────── */
const topicData = topicPracticeRaw as TopicData;

export const getTopicSections = (): TopicSection[] =>
  [...topicData.sections].sort((a, b) => a.order - b.order);

export const getTopicSection = (sectionId: string): TopicSection | undefined =>
  topicData.sections.find(s => s.id === sectionId);

export const getTopicLessons = (sectionId: string): TopicLesson[] =>
  topicData.lessons
    .filter(l => l.section_id === sectionId)
    .sort((a, b) => a.order - b.order);

export const getTopicLesson = (lessonId: string): TopicLesson | undefined =>
  topicData.lessons.find(l => l.id === lessonId);

/** All question ids in a section, in lesson order (for a whole-section run). */
export const getTopicSectionQuestionIds = (sectionId: string): string[] =>
  getTopicLessons(sectionId).flatMap(l => l.question_ids);

export const getModelTestById = (id: string) =>
  (modelTestsRaw as ModelTest[]).find(t => t.id === id);

export const getGuideSections = (): GuideSection[] => guideRaw as GuideSection[];
