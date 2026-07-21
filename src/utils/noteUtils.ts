const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

export function frequencyToMidi(freq: number): number {
  return 12 * Math.log2(freq / 440) + 69;
}

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const index = ((midi % 12) + 12) % 12;
  return `${NOTE_NAMES[index]}${octave}`;
}

export function noteToFrequency(noteName: string): number {
  const m = noteName.match(/^([A-G]#?)(\d)$/);
  if (!m) return 440;
  const idx = NOTE_NAMES.indexOf(m[1]);
  if (idx === -1) return 440;
  const midi = (parseInt(m[2]) + 1) * 12 + idx;
  return 440 * Math.pow(2, (midi - 69) / 12);
}
