import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(scriptDir, '../src/i18n/locales');
const languages = ['en', 'fi'];

function jsonFiles(language) {
  const directory = path.join(localesDir, language);

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort();
}

function leafKeys(value, prefix = '') {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key)
  );
}

function difference(left, right) {
  const rightSet = new Set(right);
  return left.filter((value) => !rightSet.has(value));
}

const filesByLanguage = Object.fromEntries(
  languages.map((language) => [language, jsonFiles(language)])
);
const errors = [];

for (const language of languages) {
  const otherLanguage = languages.find((candidate) => candidate !== language);
  const missingFiles = difference(
    filesByLanguage[otherLanguage],
    filesByLanguage[language]
  );

  if (missingFiles.length > 0) {
    errors.push(`${language} is missing namespaces: ${missingFiles.join(', ')}`);
  }
}

for (const file of filesByLanguage.en) {
  if (!filesByLanguage.fi.includes(file)) continue;

  const keys = Object.fromEntries(
    languages.map((language) => {
      const filePath = path.join(localesDir, language, file);
      const contents = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return [language, leafKeys(contents).sort()];
    })
  );

  for (const language of languages) {
    const otherLanguage = languages.find((candidate) => candidate !== language);
    const missingKeys = difference(keys[otherLanguage], keys[language]);

    if (missingKeys.length > 0) {
      errors.push(
        `${language}/${file} is missing keys: ${missingKeys.join(', ')}`
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`i18n parity check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log('i18n parity check passed.');

