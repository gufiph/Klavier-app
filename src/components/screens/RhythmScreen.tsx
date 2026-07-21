import { useState, useRef, useEffect, useCallback } from 'react';
import type { Song } from '../../types/music';
import { SONG_REGISTRY } from '../../data/songs';

const DURATION_BEATS: Record<string, number> = {
  eighth: 0.5, quarter: 1, half: 2, whole: 4,
};

function computeHitTimes(song: Song): number[] {
  const msPerBeat = 60000 / song.tempo;
  const times: number[] = [];
  let elapsed = 0;
  for (const note of song.notes) {
    const dur = (DURATION_BEATS[note.duration] ?? 1) * msPerBeat;
    if (!note.rest) times.push(elapsed);
    elapsed += dur;
  }
  return times.slice(0, 20);
}

type Accuracy = 'perfekt' | 'gut' | 'daneben' | null;

const ACC_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  perfekt: { label: 'Perfekt!', color: '#22c55e', emoji: '✨' },
  gut:     { label: 'Gut!',    color: '#f59e0b', emoji: '👍' },
  daneben: { label: 'Daneben', color: '#ef4444', emoji: '😅' },
};

export function RhythmScreen({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<'select' | 'countdown' | 'playing' | 'done'>('select');
  const [song, setSong] = useState<Song | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [totalBeats, setTotalBeats] = useState(0);
  const [lastAccuracy, setLastAccuracy] = useState<Accuracy>(null);
  const [scores, setScores] = useState<Accuracy[]>([]);
  const [pulse, setPulse] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);
  const hitTimesRef = useRef<number[]>([]);
  const hitIndexRef = useRef(0);
  const lastNoteTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const accQueueRef = useRef<Accuracy[]>([]);

  const simpleSongs = SONG_REGISTRY.filter(s => s.difficulty <= 2).slice(0, 15);

  const playClick = useCallback((high: boolean) => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== 'running') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = high ? 1000 : 700;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  }, []);

  const startCountdown = useCallback(async (s: Song) => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
    setSong(s);
    setCountdown(3);
    setPhase('countdown');
  }, []);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      if (song) {
        hitTimesRef.current = computeHitTimes(song);
        hitIndexRef.current = 0;
        accQueueRef.current = [];
        setTotalBeats(hitTimesRef.current.length);
        setCurrentBeat(0);
        setScores([]);
        setLastAccuracy(null);
        startTimeRef.current = performance.now();
        setPhase('playing');
      }
      return;
    }
    playClick(countdown === 3);
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, song, playClick]);

  // Animation + timing loop during playing phase
  useEffect(() => {
    if (phase !== 'playing' || !song) return;

    const msPerBeat = 60000 / song.tempo;
    let beatSoundIndex = 0;

    const tick = () => {
      const elapsed = performance.now() - startTimeRef.current;

      // Drive metronome click sounds
      const expectedClickIndex = Math.floor(elapsed / msPerBeat);
      if (expectedClickIndex > beatSoundIndex) {
        beatSoundIndex = expectedClickIndex;
        playClick(expectedClickIndex % song.timeSignature[0] === 0);
        setPulse(true);
        setTimeout(() => setPulse(false), 100);
      }

      setCurrentBeat(hitIndexRef.current);

      // Check if game over
      const endTime = hitTimesRef.current[hitTimesRef.current.length - 1] + msPerBeat * 4;
      if (elapsed > endTime) {
        // Fill remaining beats as missed
        const remaining = hitTimesRef.current.length - accQueueRef.current.length;
        const finalScores = [...accQueueRef.current, ...Array(remaining).fill('daneben') as Accuracy[]];
        setScores(finalScores);
        setPhase('done');
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, song, playClick]);

  // Pitch detection polling via MediaStream + pitchy would require the hook here.
  // Instead, we use a simpler approach: detect microphone loudness (volume spike = "hit")
  const micStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const detectionRafRef = useRef<number>(0);

  useEffect(() => {
    if (phase !== 'playing') return;

    let active = true;

    const setupMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        micStreamRef.current = stream;

        const ctx = audioCtxRef.current!;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserRef.current = analyser;

        const buf = new Float32Array(analyser.fftSize);
        let lastVolume = 0;
        let cooldown = false;

        const detect = () => {
          if (!active) return;
          analyser.getFloatTimeDomainData(buf);
          let rms = 0;
          for (const v of buf) rms += v * v;
          rms = Math.sqrt(rms / buf.length);

          const volume = rms;
          const isHit = volume > 0.04 && volume > lastVolume * 2.5 && !cooldown;

          if (isHit) {
            cooldown = true;
            setTimeout(() => { cooldown = false; }, 300);
            registerHit(performance.now());
          }

          lastVolume = volume;
          detectionRafRef.current = requestAnimationFrame(detect);
        };
        detectionRafRef.current = requestAnimationFrame(detect);
      } catch {
        // mic unavailable, game continues without mic
      }
    };

    setupMic();
    return () => {
      active = false;
      cancelAnimationFrame(detectionRafRef.current);
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const registerHit = useCallback((timestamp: number) => {
    if (phase !== 'playing') return;
    const elapsed = timestamp - startTimeRef.current;
    const idx = hitIndexRef.current;
    if (idx >= hitTimesRef.current.length) return;

    const expected = hitTimesRef.current[idx];
    const diff = Math.abs(elapsed - expected);

    let acc: Accuracy;
    if (diff <= 120) acc = 'perfekt';
    else if (diff <= 280) acc = 'gut';
    else acc = 'daneben';

    setLastAccuracy(acc);
    accQueueRef.current.push(acc);
    hitIndexRef.current = idx + 1;
    lastNoteTimeRef.current = timestamp;

    if (hitIndexRef.current >= hitTimesRef.current.length) {
      setTimeout(() => {
        setScores([...accQueueRef.current]);
        setPhase('done');
      }, 600);
    }
  }, [phase]);

  const perfectCount = scores.filter(s => s === 'perfekt').length;
  const goodCount = scores.filter(s => s === 'gut').length;
  const accuracy = scores.length > 0 ? Math.round(((perfectCount + goodCount * 0.5) / scores.length) * 100) : 0;

  const handleRestart = () => {
    if (song) startCountdown(song);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-950 text-white overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <button
          onClick={() => { micStreamRef.current?.getTracks().forEach(t => t.stop()); onBack(); }}
          className="text-xl p-1.5 rounded-xl hover:bg-gray-800 active:bg-gray-700 flex-shrink-0"
        >
          ◄
        </button>
        <span className="text-base font-black">🥁 Rhythmus-Training</span>
      </div>

      {/* Song selection */}
      {phase === 'select' && (
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-gray-400 text-sm mb-4 text-center">
            Wähle ein Lied und spiele den Rhythmus mit – egal welche Taste!
          </p>
          <div className="grid grid-cols-2 gap-3">
            {simpleSongs.map(s => (
              <button
                key={s.id}
                onClick={() => startCountdown(s)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gray-900 border border-gray-800 active:scale-95 transition-transform text-center"
              >
                <span className="text-3xl">{s.coverEmoji}</span>
                <span className="text-xs font-bold leading-tight line-clamp-2">{s.title}</span>
                <span className="text-gray-500 text-xs">{s.tempo} BPM</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Countdown */}
      {phase === 'countdown' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-8xl font-black animate-bounce" style={{ color: '#f59e0b' }}>
            {countdown > 0 ? countdown : '🥁'}
          </div>
          <p className="text-gray-400">Mach dich bereit…</p>
        </div>
      )}

      {/* Playing */}
      {phase === 'playing' && song && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          {/* Metronome pulse */}
          <div
            className="rounded-full transition-all duration-75"
            style={{
              width: pulse ? 120 : 90,
              height: pulse ? 120 : 90,
              background: pulse
                ? 'radial-gradient(circle, #f59e0b, #d97706)'
                : 'rgba(31,41,55,0.8)',
              boxShadow: pulse ? '0 0 40px rgba(245,158,11,0.7)' : 'none',
            }}
          />

          {/* Accuracy feedback */}
          {lastAccuracy && (() => {
            const cfg = ACC_CONFIG[lastAccuracy];
            return (
              <div
                className="text-2xl font-black px-6 py-2 rounded-2xl"
                style={{ background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}44` }}
              >
                {cfg.emoji} {cfg.label}
              </div>
            );
          })()}

          {/* Progress */}
          <div className="text-gray-500 text-sm">
            {currentBeat} / {totalBeats} Schläge
          </div>

          <div className="flex gap-1 flex-wrap justify-center">
            {hitTimesRef.current.map((_, i) => {
              const acc = accQueueRef.current[i];
              return (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: acc === 'perfekt' ? '#22c55e' : acc === 'gut' ? '#f59e0b' : acc === 'daneben' ? '#ef4444' : '#374151',
                  }}
                />
              );
            })}
          </div>

          <p className="text-gray-600 text-xs">Spiel eine Taste beim Puls!</p>
        </div>
      )}

      {/* Done */}
      {phase === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
          <div className="text-6xl">
            {accuracy >= 80 ? '🏆' : accuracy >= 50 ? '🎵' : '💪'}
          </div>
          <div>
            <div className="text-4xl font-black mb-1">{accuracy}%</div>
            <div className="text-gray-400 text-sm">Genauigkeit</div>
          </div>

          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{perfectCount}</div>
              <div className="text-gray-500">Perfekt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{goodCount}</div>
              <div className="text-gray-500">Gut</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{scores.filter(s => s === 'daneben').length}</div>
              <div className="text-gray-500">Daneben</div>
            </div>
          </div>

          {accuracy >= 80 && (
            <div className="px-5 py-2 rounded-full text-sm font-black"
              style={{ background: 'linear-gradient(to right, #7c3aed, #2563eb)', color: '#fff' }}>
              🎉 Rhythmus-König!
            </div>
          )}

          <div className="flex gap-3 w-full">
            <button
              onClick={handleRestart}
              className="flex-1 py-3 rounded-2xl font-black text-white"
              style={{ background: 'linear-gradient(to bottom, #4ade80, #16a34a)' }}
            >
              🔄 Nochmal
            </button>
            <button
              onClick={() => setPhase('select')}
              className="flex-1 py-3 rounded-2xl font-bold bg-gray-800 border border-gray-700"
            >
              🎵 Anderes Lied
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
