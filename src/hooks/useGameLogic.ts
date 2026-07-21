import { useState, useEffect, useRef, useCallback } from 'react';
import type { Song } from '../types/music';
import type { DetectedPitch, FeedbackState } from '../types/game';
import { CENTS_TOLERANCE } from '../constants/game';

interface UseGameLogicResult {
  currentNoteIndex: number;
  feedback: FeedbackState;
  isComplete: boolean;
  isActive: boolean;
  wrongCount: number;
  start: () => void;
  reset: () => void;
}

export function useGameLogic(
  song: Song | null,
  detectedPitch: DetectedPitch | null,
  onNoteCorrect?: () => void,
  tempoMultiplier = 1
): UseGameLogicResult {
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);

  const currentNoteIndexRef = useRef(0);
  const isActiveRef = useRef(false);
  const processingRef = useRef(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const restTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const songRef = useRef<Song | null>(null);
  songRef.current = song;

  const beatDurationMs = useCallback((duration: string, tempo: number) => {
    const beats: Record<string, number> = { whole: 4, half: 2, quarter: 1, eighth: 0.5 };
    return ((60 / (tempo * tempoMultiplier)) * (beats[duration] ?? 1)) * 1000;
  }, [tempoMultiplier]);

  const advanceToIndex = useCallback((index: number) => {
    const s = songRef.current;
    if (!s) return;
    if (index >= s.notes.length) {
      setIsComplete(true);
      setIsActive(false);
      isActiveRef.current = false;
      processingRef.current = false;
      return;
    }
    currentNoteIndexRef.current = index;
    setCurrentNoteIndex(index);
    processingRef.current = false;
    const note = s.notes[index];
    if (note.rest) {
      restTimerRef.current = setTimeout(
        () => advanceToIndex(index + 1),
        beatDurationMs(note.duration, s.tempo)
      );
    }
  }, [beatDurationMs]);

  useEffect(() => {
    if (!isActiveRef.current || !song || !detectedPitch?.noteName || processingRef.current) return;
    const idx = currentNoteIndexRef.current;
    const currentNote = song.notes[idx];
    if (!currentNote || currentNote.rest) return;

    const detected = detectedPitch.noteName;
    const expected = currentNote.note;
    const centsOk = Math.abs(detectedPitch.centsDeviation) <= CENTS_TOLERANCE;

    if (detected === expected && centsOk) {
      processingRef.current = true;
      setFeedback('correct');
      onNoteCorrect?.();
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback('idle');
        advanceToIndex(idx + 1);
      }, 300);
    } else if (detected !== expected) {
      clearTimeout(feedbackTimerRef.current);
      setFeedback('wrong');
      setWrongCount(c => c + 1);
      feedbackTimerRef.current = setTimeout(() => setFeedback('idle'), 300);
    }
  }, [detectedPitch, song, onNoteCorrect, advanceToIndex]);

  const start = useCallback(() => {
    clearTimeout(feedbackTimerRef.current);
    clearTimeout(restTimerRef.current);
    currentNoteIndexRef.current = 0;
    isActiveRef.current = true;
    processingRef.current = false;
    setCurrentNoteIndex(0);
    setFeedback('idle');
    setIsComplete(false);
    setIsActive(true);
    setWrongCount(0);
    const s = songRef.current;
    if (s?.notes[0]?.rest) {
      restTimerRef.current = setTimeout(
        () => advanceToIndex(1),
        beatDurationMs(s.notes[0].duration, s.tempo)
      );
    }
  }, [advanceToIndex, beatDurationMs]);

  const reset = useCallback(() => {
    clearTimeout(feedbackTimerRef.current);
    clearTimeout(restTimerRef.current);
    currentNoteIndexRef.current = 0;
    isActiveRef.current = false;
    processingRef.current = false;
    setCurrentNoteIndex(0);
    setFeedback('idle');
    setIsComplete(false);
    setIsActive(false);
    setWrongCount(0);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(feedbackTimerRef.current);
      clearTimeout(restTimerRef.current);
    };
  }, []);

  return { currentNoteIndex, feedback, isComplete, isActive, wrongCount, start, reset };
}
