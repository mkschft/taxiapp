export type ExamCategory = {
  id: string;
  name_fi: string;
  name_en: string;
  icon: string;
  color: string;
};

export type Topic = {
  id: string;
  category_id: string;
  title_fi: string;
  title_en: string;
  order: number;
};

export type Lesson = {
  id: string;
  topic_id: string;
  title_fi: string;
  title_en: string;
  body_fi: string;
  body_en: string;
};

export type ClueType = 'positive' | 'negative' | 'neutral';

export type VocabWord = {
  id: string;
  page_no: number;
  word_fi: string;
  forms_fi: string[];
  easy_en: string;
  alt_en?: string;
  clue_type: ClueType;
  appears_in_question_ids: string[];
};

export type ClueGroup = 'positive' | 'negative' | 'wh' | 'conjunction';

export type ClueWord = {
  id: string;
  group: ClueGroup;
  phrase_fi: string;
  phrase_en: string;
  effect: string;
  exceptions: string[];
  linked_question_ids: string[];
};

export type QuestionOption = {
  letter: 'A' | 'B' | 'C' | 'D';
  fi: string;
  en: string;
};

export type Question = {
  id: string;
  category_id: string;
  topic_id: string;
  q_fi: string;
  q_en: string;
  options: QuestionOption[];
  correct_letter: 'A' | 'B' | 'C' | 'D';
  explanation_en: string;
  clue_word_ids: string[];
  difficulty: 1 | 2 | 3;
  free_preview: boolean;
};

export type Quiz = {
  id: string;
  topic_id: string;
  title_fi: string;
  title_en: string;
  question_ids: string[];
};

export type ModelTest = {
  id: string;
  title_fi: string;
  title_en: string;
  question_ids: string[];
  time_minutes: number;
  pass_mark: number;
};
