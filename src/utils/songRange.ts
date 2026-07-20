import { PIANO_KEYS, WHITE_KEY_COUNT } from '../constants/keyboard';
import type { Song } from '../types/music';

export interface KeyRange {
  minWi: number;
  maxWi: number;
  visibleCount: number;
}

const PADDING = 1;

export function getSongKeyRange(song: Song): KeyRange {
  const usedKeys = song.notes
    .filter(n => !n.rest)
    .map(n => PIANO_KEYS.find(k => k.note === n.note))
    .filter((k): k is NonNullable<typeof k> => !!k);

  const whiteIndices: number[] = [];
  for (const k of usedKeys) {
    if (k.type === 'white') {
      whiteIndices.push(k.whiteIndex);
    } else {
      whiteIndices.push(k.whiteIndex, k.whiteIndex + 1);
    }
  }

  if (whiteIndices.length === 0) {
    return { minWi: 0, maxWi: WHITE_KEY_COUNT - 1, visibleCount: WHITE_KEY_COUNT };
  }

  const minWi = Math.max(0, Math.min(...whiteIndices) - PADDING);
  const maxWi = Math.min(WHITE_KEY_COUNT - 1, Math.max(...whiteIndices) + PADDING);
  return { minWi, maxWi, visibleCount: maxWi - minWi + 1 };
}
