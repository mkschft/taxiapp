import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { loadItem, saveItem } from '../store/storage';
import en from './locales/en.json';
import fi from './locales/fi.json';

// UI-chrome localisation only. Content (questions, answers, vocabulary) is never
// translated here — see docs/plans/next-changes-plan.md (D5).

export const LANGUAGE_KEY = '@taxi/appLanguage';
export type AppLanguage = 'en' | 'fi';
export const APP_LANGUAGES: AppLanguage[] = ['en', 'fi'];

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
