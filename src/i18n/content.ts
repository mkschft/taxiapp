// Bilingual-field helper (D-A — "flip, don't drop").
//
// For any data field that has both a Finnish and an English variant (section
// name, category name, model-test title), show the app-language variant as the
// primary and the other language as the secondary/subtitle. This keeps the
// bilingual value (the product's premise) while respecting the language choice.
//
// Usage:
//   const { t, i18n } = useTranslation();
//   const { primary, secondary } = localizedPair(section.name_fi, section.name_en, i18n.language);

export type LocalizedPair = { primary: string; secondary: string };

export function localizedPair(fi: string, en: string, lang: string): LocalizedPair {
  return lang === 'fi'
    ? { primary: fi, secondary: en }
    : { primary: en, secondary: fi };
}
