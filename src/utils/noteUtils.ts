const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

export function frequencyToMidi(freq: number): number {
  return 12 * Math.log2(freq / 440) + 69;
}

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const index = ((midi % 12) + 12) % 12;
  return `${NOTE_NAMES[index]}${octave}`;
}
