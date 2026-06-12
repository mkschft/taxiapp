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

/* ── Vocabulary — set-based flow (built by content/build_vocab.py) ─────────
 * Vocabulary → practice sets → each Set has a Lesson (word cards) + a Quiz.
 * URLs: /vocab/sets/{set_id}/lesson/{id}  ·  /vocab/sets/{set_id}/quiz/{id}
 */

/** A single inflected form / related word, with its English gloss. */
export type VocabForm = { fi: string; en: string };

/** A practice set (chapter) — groups one lesson + one quiz. */
export type VocabSet = {
  id: string;                 // "set-1" (slug, used in URLs)
  set_no: number;             // 1..9
  name: string;
  category_id: string | null; // optional theme link → ExamCategory
  order: number;
  word_count: number;         // derived
  question_count: number;     // derived
};

/** A lesson word card. URL: /vocab/sets/{set_id}/lesson/{id} */
export type VocabLessonWord = {
  id: string;                 // "set-1-w3"
  set_id: string;             // → VocabSet.id
  index: number;              // position within set
  total_in_set: number;
  word_fi: string;
  meaning_en: string;
  forms_fi: VocabForm[];
  exam_use_en: string;
};

export type VocabQuizOption = { key: 'A' | 'B' | 'C'; en: string | null };

/** A quiz question. URL: /vocab/sets/{set_id}/quiz/{id} */
export type VocabQuizQuestion = {
  id: string;                 // "set-1-q7"
  set_id: string;             // → VocabSet.id
  index: number;
  prompt_word_fi: string;
  options: VocabQuizOption[];
  correct_option: 'A' | 'B' | 'C';
  correct_meaning_en: string;
  lesson_word_id: string | null;  // soft link → VocabLessonWord.id
};

/** Shape of vocab.json. */
export type VocabData = {
  sets: VocabSet[];
  words: VocabLessonWord[];
  questions: VocabQuizQuestion[];
};

/* ── Clue Words — group-based flow (built by content/build_clue.py) ────────
 * Clue Words → group buttons (Positive / Negative / WH / Conjunction)
 * → each group has a Lesson (clue cards) + a Quiz.
 * URLs: /clue-words/:groupId/lesson/:index · /clue-words/:groupId/quiz
 */
export type ClueTone = 'positive' | 'negative' | 'neutral';

export type ClueGroup = {
  id: string;                 // "positive" (slug, used in URLs)
  short: string;              // "Positive"
  label: string;              // "Positive clue words"
  tone: ClueTone;             // drives colour
  blurb: string;
  order: number;
  word_count: number;         // derived
  question_count: number;     // derived
};

export type ClueLessonWord = {
  id: string;                 // "clue-positive-w3"
  group_id: string;           // → ClueGroup.id
  index: number;
  total_in_group: number;
  phrase_fi: string;
  meaning_en: string;
  effect_en: string | null;   // general-use context
  exception_en: string | null;// watch-out / exception
};

export type ClueQuizOption = { key: 'A' | 'B' | 'C'; en: string };

export type ClueQuizQuestion = {
  id: string;                 // "clue-positive-q3"
  group_id: string;           // → ClueGroup.id
  index: number;
  prompt_fi: string;
  options: ClueQuizOption[];
  correct_option: 'A' | 'B' | 'C';
  correct_meaning_en: string;
};

export type ClueData = {
  groups: ClueGroup[];
  words: ClueLessonWord[];
  questions: ClueQuizQuestion[];
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
