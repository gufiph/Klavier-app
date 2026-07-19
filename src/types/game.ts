export type Screen = 'song-selector' | 'play' | 'completion';
export type FeedbackState = 'idle' | 'correct' | 'wrong';

export interface DetectedPitch {
  frequency: number;
  clarity: number;
  noteName: string | null;
  centsDeviation: number;
}
