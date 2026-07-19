export const BOOMWHACKER_COLORS: Record<string, string> = {
  C: '#E21C48',
  D: '#F36421',
  E: '#FFE011',
  F: '#8DC63F',
  G: '#009A44',
  A: '#6E4B9E',
  B: '#F04E98',
};

export const ACCIDENTAL_COLOR = '#888888';

export function getNoteColor(noteName: string): string {
  if (noteName.includes('#')) return ACCIDENTAL_COLOR;
  const letter = noteName.replace(/\d/g, '');
  return BOOMWHACKER_COLORS[letter] ?? '#888888';
}
