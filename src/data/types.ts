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

/** Inline clue annotation attached to a question — replaces the old clue_word_ids ref model */
export type ClueAnnotation = {
  text_fi: string;
  meaning_en: string | null;
  /** fw = focus word (yellow), pcw = positive clue → correct, ncw = negative clue → wrong */
  clue_type: 'fw' | 'pcw' | 'ncw';
  /** Which parts of the question this clue appears in */
  found_in: string[];
};

export type QuestionOption = {
  key: 'A' | 'B' | 'C';
  fi: string | null;
  fi_raw: string | null;
  en: string | null;
  is_correct: boolean;
};

export type Question = {
  id: string;
  category_id: string;
  category_en: string | null;
  source_topic_fi: string | null;
  ref_no: string | null;
  source_set: string | null;
  question: {
    fi: string | null;
    en: string | null;
    fi_raw: string | null;
  };
  options: QuestionOption[];
  correct_option: 'A' | 'B' | 'C' | null;
  correct_master: string;
  key_overridden: boolean;
  clue_annotations: ClueAnnotation[];
  explanation_en: string | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  tags: string[];
  status: string;
  fi_edited: boolean;
  reviewer_notes: string | null;
  enriched: boolean;
};

export type Quiz = {
  id: string;
  topic_id: string;
  title_fi: string;
  title_en: string;
  question_ids: string[];
};

export type GuideItem = { label: string; value: string };
export type GuideCategoryRule = {
  id: string; name: string; icon: string; color: string;
  description: string; keyRules: string[];
};
export type GuideSection = {
  id: string; icon: string; title: string; summary: string;
  items?: GuideItem[];
  categories?: GuideCategoryRule[];
  note?: string;
};

export type ModelTest = {
  id: string;
  title_fi: string;
  title_en: string;
  question_ids: string[];
  time_minutes: number;
  pass_mark: number;
};
