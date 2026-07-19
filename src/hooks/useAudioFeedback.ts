import { useRef, useCallback } from 'react';

export function useAudioFeedback() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine', delay = 0) => {
      const ctx = getCtx();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.value = frequency;
        const start = ctx.currentTime + delay;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.start(start);
        osc.stop(start + duration);
      } catch {
        // ignore
      }
    },
    [getCtx]
  );

  const playCorrect = useCallback(() => {
    playTone(523.25, 0.12); // C5
    playTone(659.25, 0.15, 'sine', 0.08); // E5
  }, [playTone]);

  const playWrong = useCallback(() => {
    playTone(220, 0.12, 'sawtooth');
  }, [playTone]);

  return { playCorrect, playWrong };
}
