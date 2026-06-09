import type { ClueAnnotation } from '../data/types';

export type TextSegment = {
  text: string;
  isClue: boolean;
  clueType?: 'fw' | 'pcw' | 'ncw';
};

/**
 * Splits a Finnish text string into segments, tagging which parts match
 * clue annotation phrases so they can be rendered as highlighted spans.
 *
 * clue_type mapping:
 *   fw  → focus word   (yellow highlight)
 *   pcw → positive cue → correct answer signal (green)
 *   ncw → negative cue → wrong answer signal   (red)
 */
export function parseClues(
  text: string,
  clueAnnotations: ClueAnnotation[],
): TextSegment[] {
  if (!text) return [];
  if (!clueAnnotations?.length) return [{ text, isClue: false }];

  type Match = { start: number; end: number; clueType: 'fw' | 'pcw' | 'ncw' };
  const matches: Match[] = [];

  const lowerText = text.toLowerCase();

  for (const ann of clueAnnotations) {
    if (!ann.text_fi) continue;
    const phrase = ann.text_fi.toLowerCase();
    let idx = lowerText.indexOf(phrase);
    while (idx !== -1) {
      matches.push({ start: idx, end: idx + ann.text_fi.length, clueType: ann.clue_type });
      idx = lowerText.indexOf(phrase, idx + 1);
    }
  }

  if (matches.length === 0) return [{ text, isClue: false }];

  // Sort by start, drop overlaps (keep first/longest)
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
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
      clueType: m.clueType,
    });
    pos = m.end;
  }
  if (pos < text.length) {
    segments.push({ text: text.slice(pos), isClue: false });
  }
  return segments;
}

// Legacy helper kept for ClueWordsScreen which still looks up by ClueWord id
export type { ClueAnnotation };
