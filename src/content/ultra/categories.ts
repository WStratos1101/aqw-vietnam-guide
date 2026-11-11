export type ChallengeCategory = 'daily' | 'weekly' | 'seasonal' | 'other';
// Challenge Guide sections I/II, cross-checked with each encounter's reward reset.
export const challengeCategoryFor = (slug: string): ChallengeCategory =>
  ['ultra-ezrajal', 'ultra-warden', 'ultra-engineer', 'ultra-tyndarius','god-of-the-depths','kolr-usurper-of-flames','astral-empyrean'].includes(slug) ? 'daily' : ['kasuko','batara-kala','ultra-iara'].includes(slug)?'seasonal':'weekly';
export const challengeLabels: Record<ChallengeCategory, string> = {
  daily: 'DAILY BOSS', weekly: 'WEEKLY BOSS', seasonal: 'SEASONAL BOSS', other: 'OTHER CHALLENGE',
};
