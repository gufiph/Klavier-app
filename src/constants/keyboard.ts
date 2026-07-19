export interface PianoKey {
  note: string;
  type: 'white' | 'black';
  whiteIndex: number;
}

const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

export const PIANO_KEYS: PianoKey[] = [];

let wi = 0;
for (let oct = 3; oct <= 6; oct++) {
  for (const n of CHROMATIC) {
    if (oct === 6 && n !== 'C') break;
    const isBlack = n.includes('#');
    PIANO_KEYS.push({ note: `${n}${oct}`, type: isBlack ? 'black' : 'white', whiteIndex: isBlack ? wi - 1 : wi });
    if (!isBlack) wi++;
  }
}

export const WHITE_KEY_COUNT = PIANO_KEYS.filter(k => k.type === 'white').length;
