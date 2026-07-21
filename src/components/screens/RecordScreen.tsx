import { useState, useRef, useCallback, useEffect } from 'react';
import { PitchDetector } from 'pitchy';
import { frequencyToMidi, midiToNoteName, noteToFrequency } from '../../utils/noteUtils';
import { CLARITY_THRESHOLD, MIN_FREQUENCY, MAX_FREQUENCY } from '../../constants/game';
import { getNoteColor } from '../../constants/boomwhacker';

interface RecordScreenProps {
  onBack: () => void;
}

interface RecordedNote {
  note: string;
  timestamp: number;
}

function displayNote(note: string): string {
  const letter = note.replace(/[#\d]/g, '');
  const rest = note.slice(letter.length);
  return (letter === 'B' ? 'H' : letter) + rest;
}

export function RecordScreen({ onBack }: RecordScreenProps) {
  const [phase, setPhase] = useState<'idle' | 'recording' | 'done' | 'playing'>('idle');
  const [recorded, setRecorded] = useState<RecordedNote[]>([]);
  const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastNoteRef = useRef<string | null>(null);
  const lastNoteTimeRef = useRef(0);
  const recordedRef = useRef<RecordedNote[]>([]);
  const playCtxRef = useRef<AudioContext | null>(null);

  const stopMic = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      const detector = PitchDetector.forFloat32Array(analyser.fftSize);
      const sensitivity = parseFloat(localStorage.getItem('klavier_sensitivity') ?? String(CLARITY_THRESHOLD)) || CLARITY_THRESHOLD;

      recordedRef.current = [];
      setRecorded([]);
      setPhase('recording');

      const detect = () => {
        analyser.getFloatTimeDomainData(buf);
        const [freq, clarity] = detector.findPitch(buf, ctx.sampleRate);
        if (clarity >= sensitivity && freq >= MIN_FREQUENCY && freq <= MAX_FREQUENCY) {
          const midi = frequencyToMidi(freq);
          const note = midiToNoteName(Math.round(midi));
          const now = Date.now();
          // Debounce: only record if different note OR same note after 500ms
          if (note !== lastNoteRef.current || now - lastNoteTimeRef.current > 500) {
            lastNoteRef.current = note;
            lastNoteTimeRef.current = now;
            const entry: RecordedNote = { note, timestamp: now };
            recordedRef.current = [...recordedRef.current, entry];
            setRecorded([...recordedRef.current]);
          }
        }
        animFrameRef.current = requestAnimationFrame(detect);
      };
      animFrameRef.current = requestAnimationFrame(detect);
    } catch {
      setPermissionDenied(true);
    }
  }, []);

  const stopRecording = useCallback(() => {
    stopMic();
    setPhase('done');
  }, [stopMic]);

  const playback = useCallback(() => {
    if (recorded.length === 0) return;
    playCtxRef.current?.close();
    const ctx = new AudioContext();
    playCtxRef.current = ctx;
    setPhase('playing');
    setCurrentPlayIndex(0);

    let t = ctx.currentTime + 0.05;
    const noteDur = 0.4;

    recorded.forEach((entry, i) => {
      const freq = noteToFrequency(entry.note);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + noteDur);

      // Visual tracking via setTimeout
      const delay = (t - ctx.currentTime) * 1000;
      setTimeout(() => setCurrentPlayIndex(i), delay);

      t += noteDur;
    });

    const totalDuration = (t - ctx.currentTime) * 1000 + 100;
    setTimeout(() => {
      setPhase('done');
      setCurrentPlayIndex(-1);
    }, totalDuration);
  }, [recorded]);

  const handleClear = useCallback(() => {
    playCtxRef.current?.close();
    setRecorded([]);
    recordedRef.current = [];
    lastNoteRef.current = null;
    setPhase('idle');
    setCurrentPlayIndex(-1);
  }, []);

  useEffect(() => () => { stopMic(); playCtxRef.current?.close(); }, [stopMic]);

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-950 text-white">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800 flex-shrink-0">
        <button onClick={() => { stopMic(); playCtxRef.current?.close(); onBack(); }}
          className="text-xl p-1.5 rounded-xl hover:bg-gray-800 transition-colors">◄</button>
        <h1 className="text-lg font-black flex-1">Eigenes Lied aufnehmen</h1>
        {recorded.length > 0 && (
          <span className="text-gray-500 text-xs">{recorded.length} Töne</span>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
        {/* Status */}
        <div className="text-center">
          {phase === 'idle' && <p className="text-gray-400 text-sm">Drücke Aufnehmen und spiel dein Lied!</p>}
          {phase === 'recording' && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <p className="text-red-400 text-sm font-bold">Aufnahme läuft…</p>
            </div>
          )}
          {phase === 'done' && <p className="text-emerald-400 text-sm font-bold">Aufnahme fertig!</p>}
          {phase === 'playing' && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-blue-400 text-sm font-bold">Wiedergabe…</p>
            </div>
          )}
          {permissionDenied && <p className="text-red-300 text-sm">🎤 Mikrofon nicht erlaubt</p>}
        </div>

        {/* Recorded notes display */}
        <div
          className="flex-1 overflow-y-auto rounded-2xl p-3 border border-gray-800"
          style={{ background: 'rgba(17,24,39,0.8)', minHeight: 120 }}
        >
          {recorded.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-700 text-sm">
              Noch keine Töne aufgenommen
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {recorded.map((entry, i) => {
                const color = getNoteColor(entry.note);
                const isPlaying = i === currentPlayIndex;
                return (
                  <div
                    key={i}
                    className="rounded-full flex items-center justify-center font-black text-white text-xs transition-all"
                    style={{
                      width: 36,
                      height: 36,
                      background: isPlaying ? color : `${color}60`,
                      border: `2px solid ${color}`,
                      transform: isPlaying ? 'scale(1.3)' : 'scale(1)',
                      boxShadow: isPlaying ? `0 0 12px ${color}` : 'none',
                    }}
                  >
                    {displayNote(entry.note)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3 flex-shrink-0">
          {phase === 'idle' && (
            <button
              onClick={startRecording}
              className="flex-1 py-4 rounded-2xl font-black text-white text-lg transition-transform active:scale-95"
              style={{ background: 'linear-gradient(to bottom, #dc2626, #991b1b)' }}
            >
              🎤 Aufnehmen
            </button>
          )}
          {phase === 'recording' && (
            <button
              onClick={stopRecording}
              className="flex-1 py-4 rounded-2xl font-black text-white text-lg transition-transform active:scale-95"
              style={{ background: 'linear-gradient(to bottom, #374151, #1f2937)', border: '2px solid #dc2626' }}
            >
              ■ Stopp
            </button>
          )}
          {(phase === 'done' || phase === 'playing') && (
            <>
              <button
                onClick={playback}
                disabled={phase === 'playing'}
                className="flex-1 py-4 rounded-2xl font-black text-white text-lg transition-transform active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(to bottom, #2563eb, #1e40af)' }}
              >
                ▶ Abspielen
              </button>
              <button
                onClick={() => { stopMic(); setPhase('recording'); startRecording(); }}
                className="flex-1 py-4 rounded-2xl font-black text-white text-lg transition-transform active:scale-95"
                style={{ background: 'linear-gradient(to bottom, #dc2626, #991b1b)' }}
              >
                🎤 Neu
              </button>
              <button
                onClick={handleClear}
                className="py-4 px-4 rounded-2xl font-black text-gray-400 text-lg bg-gray-800 border border-gray-700"
              >
                🗑
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
