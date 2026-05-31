// Stub — replace with RevenueCat SDK when integrating payments
export type PaidFeature =
  | 'full_questions'
  | 'model_tests'
  | 'clue_words_full'
  | 'referral';

// Set to true to test the full paid experience locally
const DEV_UNLOCK_ALL = true;

export const isFeatureUnlocked = (_feature: PaidFeature): boolean => {
  return DEV_UNLOCK_ALL;
};
