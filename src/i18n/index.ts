import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { loadItem, saveItem } from '../store/storage';

// UI-chrome localisation only. Content (questions, answers, vocabulary) is never
// translated here — see docs/plans/phase2-i18n-and-quiz-ux-plan.md (D-D).
//
// Translations live in per-namespace JSON files under locales/{en,fi}/ so that
// each area can be edited independently. They are merged into a single
// `translation` namespace below; reference keys as `t('dashboard.title')` etc.

// ── English ──
import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enDashboard from './locales/en/dashboard.json';
import enProgress from './locales/en/progress.json';
import enProfile from './locales/en/profile.json';
import enTopic from './locales/en/topic.json';
import enQuiz from './locales/en/quiz.json';
import enModelTest from './locales/en/modelTest.json';
import enTestHome from './locales/en/testHome.json';
import enResult from './locales/en/result.json';
import enPractice from './locales/en/practice.json';
import enVocab from './locales/en/vocab.json';
import enClue from './locales/en/clue.json';
import enGuide from './locales/en/guide.json';
import enHowto from './locales/en/howto.json';
import enStudyHome from './locales/en/studyHome.json';
import enComponents from './locales/en/components.json';
import enAuth from './locales/en/auth.json';
import enPricing from './locales/en/pricing.json';
import enReferral from './locales/en/referral.json';
import enSaved from './locales/en/saved.json';

// ── Finnish ──
import fiCommon from './locales/fi/common.json';
import fiNav from './locales/fi/nav.json';
import fiDashboard from './locales/fi/dashboard.json';
import fiProgress from './locales/fi/progress.json';
import fiProfile from './locales/fi/profile.json';
import fiTopic from './locales/fi/topic.json';
import fiQuiz from './locales/fi/quiz.json';
import fiModelTest from './locales/fi/modelTest.json';
import fiTestHome from './locales/fi/testHome.json';
import fiResult from './locales/fi/result.json';
import fiPractice from './locales/fi/practice.json';
import fiVocab from './locales/fi/vocab.json';
import fiClue from './locales/fi/clue.json';
import fiGuide from './locales/fi/guide.json';
import fiHowto from './locales/fi/howto.json';
import fiStudyHome from './locales/fi/studyHome.json';
import fiComponents from './locales/fi/components.json';
import fiAuth from './locales/fi/auth.json';
import fiPricing from './locales/fi/pricing.json';
import fiReferral from './locales/fi/referral.json';
import fiSaved from './locales/fi/saved.json';

export const LANGUAGE_KEY = '@taxi/appLanguage';
export type AppLanguage = 'en' | 'fi';
export const APP_LANGUAGES: AppLanguage[] = ['en', 'fi'];

const en = {
  common: enCommon,
  nav: enNav,
  dashboard: enDashboard,
  progress: enProgress,
  profile: enProfile,
  topic: enTopic,
  quiz: enQuiz,
  modelTest: enModelTest,
  testHome: enTestHome,
  result: enResult,
  practice: enPractice,
  vocab: enVocab,
  clue: enClue,
  guide: enGuide,
  howto: enHowto,
  studyHome: enStudyHome,
  components: enComponents,
  auth: enAuth,
  pricing: enPricing,
  referral: enReferral,
  saved: enSaved,
};

const fi = {
  common: fiCommon,
  nav: fiNav,
  dashboard: fiDashboard,
  progress: fiProgress,
  profile: fiProfile,
  topic: fiTopic,
  quiz: fiQuiz,
  modelTest: fiModelTest,
  testHome: fiTestHome,
  result: fiResult,
  practice: fiPractice,
  vocab: fiVocab,
  clue: fiClue,
  guide: fiGuide,
  howto: fiHowto,
  studyHome: fiStudyHome,
  components: fiComponents,
  auth: fiAuth,
  pricing: fiPricing,
  referral: fiReferral,
  saved: fiSaved,
};

// Synchronous init so t() works on first render; the saved preference is applied
// shortly after via loadSavedLanguage(). Default is English (manual switch only).
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fi: { translation: fi },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export async function loadSavedLanguage(): Promise<void> {
  const saved = await loadItem<AppLanguage | null>(LANGUAGE_KEY, null);
  if (saved && saved !== i18n.language) {
    await i18n.changeLanguage(saved);
  }
}

export async function setAppLanguage(lng: AppLanguage): Promise<void> {
  await i18n.changeLanguage(lng);
  await saveItem(LANGUAGE_KEY, lng);
}

export default i18n;
