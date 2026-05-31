import type { ClueWord, ClueGroup } from '../data/types';

export type TextSegment = {
  text: string;
  isClue: boolean;
  clueGroup?: ClueGroup;
  clueId?: string;
};

/**
 * Splits a Finnish text string into segments, tagging which parts
 * match clue word phrases so they can be rendered as highlighted spans.
 */
export function parseClues(
  text: string,
  clueWordIds: string[],
  allClueWords: ClueWord[],
): TextSegment[] {
  const relevant = allClueWords.filter(c => clueWordIds.includes(c.id));
  if (relevant.length === 0) return [{ text, isClue: false }];

  // Build list of { start, end, clueWord } matches
  type Match = { start: number; end: number; cw: ClueWord };
  const matches: Match[] = [];

  for (const cw of relevant) {
    // Each phrase_fi may have variants separated by " / "
    const variants = cw.phrase_fi.split(' / ').map(v => v.trim());
    for (const variant of variants) {
      const lower = text.toLowerCase();
      const variantLower = variant.toLowerCase();
      let idx = lower.indexOf(variantLower);
      while (idx !== -1) {
        matches.push({ start: idx, end: idx + variant.length, cw });
        idx = lower.indexOf(variantLower, idx + 1);
      }
    }
  }

  if (matches.length === 0) return [{ text, isClue: false }];

  // Sort by start position, resolve overlaps (keep first)
  matches.sort((a, b) => a.start - b.start);
  const noOverlap: Match[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start >= cursor) {
      noOverlap.push(m);
      cursor = m.end;
    }
  }

  // Build segments
  const segments: TextSegment[] = [];
  let pos = 0;
  for (const m of noOverlap) {
    if (m.start > pos) {
      segments.push({ text: text.slice(pos, m.start), isClue: false });
    }
    segments.push({
      text: text.slice(m.start, m.end),
      isClue: true,
      clueGroup: m.cw.group,
      clueId: m.cw.id,
    });
    pos = m.end;
  }
  if (pos < text.length) {
    segments.push({ text: text.slice(pos), isClue: false });
  }
  return segments;
}
