import { useState, useEffect, useRef, useCallback } from 'react';
import { PitchDetector } from 'pitchy';
import type { DetectedPitch } from '../types/game';
import { CLARITY_THRESHOLD, MIN_FREQUENCY, MAX_FREQUENCY } from '../constants/game';
import { frequencyToMidi, midiToNoteName } from '../utils/noteUtils';

interface UsePitchDetectionResult {
  detectedPitch: DetectedPitch | null;
  isListening: boolean;
  permissionDenied: boolean;
  startListening: (audioContext: AudioContext) => Promise<void>;
  stopListening: () => void;
}

export function usePitchDetection(): UsePitchDetectionResult {
  const [detectedPitch, setDetectedPitch] = useState<DetectedPitch | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stopListening = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    setIsListening(false);
    setDetectedPitch(null);
  }, []);

  const startListening = useCallback(async (audioContext: AudioContext) => {
    try {
      audioCtxRef.current = audioContext;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
        video: false,
      });
      streamRef.current = stream;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;  // größeres Fenster = bessere Frequenzauflösung für tiefe Töne
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.fftSize;
      detectorRef.current = PitchDetector.forFloat32Array(bufferLength);
      bufferRef.current = new Float32Array(new ArrayBuffer(bufferLength * Float32Array.BYTES_PER_ELEMENT));

      setPermissionDenied(false);
      setIsListening(true);

      const calibOffsetCents = parseFloat(localStorage.getItem('klavier_calib') ?? '0') || 0;
      const clarityThreshold = parseFloat(localStorage.getItem('klavier_sensitivity') ?? String(CLARITY_THRESHOLD)) || CLARITY_THRESHOLD;

      const detect = () => {
        if (!analyserRef.current || !detectorRef.current || !bufferRef.current) return;
        analyserRef.current.getFloatTimeDomainData(bufferRef.current);
        const [freq, clarity] = detectorRef.current.findPitch(
          bufferRef.current,
          audioContext.sampleRate
        );
        if (clarity >= clarityThreshold && freq >= MIN_FREQUENCY && freq <= MAX_FREQUENCY) {
          const midi = frequencyToMidi(freq);
          const adjustedMidi = midi - calibOffsetCents / 100;
          const midiRounded = Math.round(adjustedMidi);
          const noteName = midiToNoteName(midiRounded);
          const centsDeviation = (adjustedMidi - midiRounded) * 100;
          setDetectedPitch({ frequency: freq, clarity, noteName, centsDeviation });
        } else {
          setDetectedPitch(null);
        }
        animFrameRef.current = requestAnimationFrame(detect);
      };
      animFrameRef.current = requestAnimationFrame(detect);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setPermissionDenied(true);
      }
      console.error('Mikrofon-Fehler:', err);
    }
  }, []);

  useEffect(() => () => stopListening(), [stopListening]);

  return { detectedPitch, isListening, permissionDenied, startListening, stopListening };
}
