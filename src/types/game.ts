export type Screen =
  | 'song-selector' | 'play' | 'completion' | 'calibration'
  | 'profiles' | 'quiz' | 'record' | 'parent-log' | 'onboarding';
export type FeedbackState = 'idle' | 'correct' | 'wrong';

export interface DetectedPitch {
  frequency: number;
  clarity: number;
  noteName: string | null;
  centsDeviation: number;
}
