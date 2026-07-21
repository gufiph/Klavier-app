import { useState, useEffect, useRef, useCallback } from 'react';
import { PitchDetector } from 'pitchy';
import { frequencyToMidi } from '../../utils/noteUtils';
import { CLARITY_THRESHOLD, MIN_FREQUENCY, MAX_FREQUENCY } from '../../constants/game';

interface CalibrationScreenProps {
  onDone: () => void;
}

const C4_MIDI = 60;
const SAMPLE_TARGET = 40;

export function CalibrationScreen({ onDone }: CalibrationScreenProps) {
  const [phase, setPhase] = useState<'intro' | 'listening' | 'done' | 'error'>('intro');
  const [sampleCount, setSampleCount] = useState(0);
  const [offsetCents, setOffsetCents] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const samplesRef = useRef<number[]>([]);

  const stop = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
        video: false,
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      const bufLen = analyser.fftSize;
      const detector = PitchDetector.forFloat32Array(bufLen);
      const buf = new Float32Array(bufLen);
      samplesRef.current = [];

      setPhase('listening');

      const detect = () => {
        analyser.getFloatTimeDomainData(buf);
        const [freq, clarity] = detector.findPitch(buf, ctx.sampleRate);
        if (clarity >= CLARITY_THRESHOLD && freq >= MIN_FREQUENCY && freq <= MAX_FREQUENCY) {
          const midi = frequencyToMidi(freq);
          // Only accept pitches within 2 semitones of C4
          if (Math.abs(midi - C4_MIDI) < 2) {
            samplesRef.current.push(midi - C4_MIDI);
            setSampleCount(samplesRef.current.length);
            if (samplesRef.current.length >= SAMPLE_TARGET) {
              const avg = samplesRef.current.reduce((a, b) => a + b, 0) / samplesRef.current.length;
              const cents = Math.round(avg * 100);
              setOffsetCents(cents);
              localStorage.setItem('klavier_calib', String(cents));
              localStorage.setItem('klavier_calib_done', '1');
              setPhase('done');
              stop();
              ctx.close();
              return;
            }
          }
        }
        animFrameRef.current = requestAnimationFrame(detect);
      };
      animFrameRef.current = requestAnimationFrame(detect);
    } catch {
      setPhase('error');
    }
  }, [stop]);

  const handleSkip = useCallback(() => {
    stop();
    localStorage.setItem('klavier_calib', '0');
    localStorage.setItem('klavier_calib_done', '1');
    onDone();
  }, [stop, onDone]);

  useEffect(() => () => stop(), [stop]);

  const progress = Math.min((sampleCount / SAMPLE_TARGET) * 100, 100);

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-gray-950 text-white px-6 text-center">
      <div className="max-w-sm w-full flex flex-col items-center gap-6">
        <div className="text-6xl">🎹</div>
        <h1 className="text-2xl font-black tracking-tight">Klang-Kalibrierung</h1>

        {phase === 'intro' && (
          <>
            <p className="text-gray-300 text-sm leading-relaxed">
              Spiel das mittlere <strong className="text-white">C</strong> auf deinem Klavier
              (auch bekannt als C4), damit die App deinen Klang richtig erkennt.
            </p>
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black border-2"
              style={{ background: '#E21C4820', borderColor: '#E21C48', color: '#E21C48' }}
            >
              C
            </div>
            <button
              onClick={startListening}
              className="w-full py-4 rounded-2xl text-lg font-black text-white transition-transform active:scale-95"
              style={{ background: 'linear-gradient(to bottom, #7c3aed, #4f27a8)' }}
            >
              🎤 Kalibrierung starten
            </button>
            <button onClick={handleSkip} className="text-gray-500 text-sm underline">
              Überspringen
            </button>
          </>
        )}

        {phase === 'listening' && (
          <>
            <p className="text-gray-300 text-sm">
              Spiel jetzt das <strong className="text-white">C4</strong> (mittleres C) mehrmals…
            </p>
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black border-2 animate-pulse"
              style={{ background: '#E21C4820', borderColor: '#E21C48', color: '#E21C48' }}
            >
              C
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, background: 'linear-gradient(to right, #7c3aed, #2563eb)' }}
              />
            </div>
            <p className="text-gray-500 text-xs">{sampleCount} / {SAMPLE_TARGET} Messungen</p>
            <button onClick={handleSkip} className="text-gray-500 text-sm underline">
              Überspringen
            </button>
          </>
        )}

        {phase === 'done' && (
          <>
            <p className="text-gray-300 text-sm">
              Kalibrierung abgeschlossen!
              {Math.abs(offsetCents) > 5 ? (
                <> Dein Klavier ist <strong className="text-white">{Math.abs(offsetCents)} Cent {offsetCents > 0 ? 'zu hoch' : 'zu tief'}</strong>. Korrektur gespeichert.</>
              ) : (
                <> Dein Klavier klingt sehr genau — keine Korrektur nötig.</>
              )}
            </p>
            <div className="text-5xl">✅</div>
            <button
              onClick={onDone}
              className="w-full py-4 rounded-2xl text-lg font-black text-white transition-transform active:scale-95"
              style={{ background: 'linear-gradient(to bottom, #16a34a, #14532d)' }}
            >
              Los geht's! 🎵
            </button>
          </>
        )}

        {phase === 'error' && (
          <>
            <p className="text-red-300 text-sm">
              🎤 Mikrofon nicht verfügbar. Bitte Zugriff erlauben und neu starten.
            </p>
            <button
              onClick={handleSkip}
              className="w-full py-4 rounded-2xl text-lg font-black text-white bg-gray-800 border border-gray-700"
            >
              Ohne Kalibrierung fortfahren
            </button>
          </>
        )}
      </div>
    </div>
  );
}
