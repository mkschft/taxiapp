import type { ExamCategory, Topic, VocabWord, ClueWord, Question, ModelTest, GuideSection } from './types';

import categoriesRaw from './json/categories.json';
import topicsRaw from './json/topics.json';
import vocabRaw from './json/vocab_words.json';
import clueWordsRaw from './json/clue_words.json';
import questionsRaw from './json/questions.json';
import modelTestsRaw from './json/model_tests.json';
import guideRaw from './json/guide.json';

export const getCategories = (): ExamCategory[] => categoriesRaw as ExamCategory[];
export const getTopics = (): Topic[] => topicsRaw as Topic[];
export const getVocabWords = (): VocabWord[] => vocabRaw as VocabWord[];
export const getClueWords = (): ClueWord[] => clueWordsRaw as ClueWord[];
export const getQuestions = (): Question[] => questionsRaw as unknown as Question[];
export const getModelTests = (): ModelTest[] => modelTestsRaw as ModelTest[];

export const getQuestionById = (id: string) =>
  (questionsRaw as unknown as Question[]).find(q => q.id === id);

export const getQuestionsByCategory = (catId: string) =>
  (questionsRaw as unknown as Question[]).filter(q => q.category_id === catId);

export const getVocabByPage = (page: number) =>
  (vocabRaw as VocabWord[]).filter(w => w.page_no === page);

export const getVocabPageCount = () => {
  const pages = new Set((vocabRaw as VocabWord[]).map(w => w.page_no));
  return pages.size;
};

// ClueWords screen still uses the clue_words.json dictionary
export const getClueWordsByGroup = (group: ClueWord['group']) =>
  (clueWordsRaw as ClueWord[]).filter(c => c.group === group);

export const getModelTestById = (id: string) =>
  (modelTestsRaw as ModelTest[]).find(t => t.id === id);

export const getGuideSections = (): GuideSection[] => guideRaw as GuideSection[];
