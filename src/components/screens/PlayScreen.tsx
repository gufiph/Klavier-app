import { useState, useRef, useEffect, useCallback } from 'react';
import type { Song } from '../../types/music';
import { usePitchDetection } from '../../hooks/usePitchDetection';
import { useGameLogic } from '../../hooks/useGameLogic';
import { useAudioFeedback } from '../../hooks/useAudioFeedback';
import { useProgress } from '../../hooks/useProgress';
import { NoteWaterfall } from '../music/NoteWaterfall';
import { SheetMusicView } from '../music/SheetMusicView';
import { PianoKeyboard } from '../music/PianoKeyboard';
import { MicFeedbackBar } from '../feedback/MicFeedbackBar';
import { CorrectFlash } from '../feedback/CorrectFlash';
import { ProgressDots } from '../feedback/ProgressDots';

function useMetronome(bpm: number, beatsPerMeasure: number, active: boolean, audioCtx: AudioContext | null) {
  const [beat, setBeat] = useState(0);
  const beatRef = useRef(0);

  useEffect(() => {
    if (!active) { setBeat(0); return; }
    const ms = (60 / bpm) * 1000;
    const id = setInterval(() => {
      beatRef.current = (beatRef.current + 1) % beatsPerMeasure;
      setBeat(beatRef.current);
      // Soft click via Web Audio
      if (audioCtx && audioCtx.state === 'running') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = beatRef.current === 0 ? 880 : 660;
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.06);
      }
    }, ms);
    return () => clearInterval(id);
  }, [bpm, beatsPerMeasure, active, audioCtx]);

  return beat;
}

function MetronomeBar({ beat, total, active }: { beat: number; total: number; active: boolean }) {
  if (!active) return null;
  return (
    <div className="flex-shrink-0 flex items-center justify-center gap-2 py-1.5 px-4 bg-gray-900 border-t border-gray-800">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all"
          style={{
            width: i === beat ? 14 : 8,
            height: i === beat ? 14 : 8,
            background: i === beat ? (i === 0 ? '#f59e0b' : '#6b7280') : '#374151',
            boxShadow: i === beat ? `0 0 8px ${i === 0 ? '#f59e0b' : '#6b7280'}` : 'none',
          }}
        />
      ))}
    </div>
  );
}

type ViewMode = 'waterfall' | 'sheet';
type LayoutMode = 'portrait' | 'landscape';

interface PlayScreenProps {
  song: Song;
  onBack: () => void;
  onComplete: (earnedStars: 1 | 2 | 3) => void;
}

const DIFF_DOT_COLOR = ['', '#22c55e', '#f59e0b', '#ef4444'];

function ToggleSwitch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      onClick={onChange}
      title={label}
      className="flex items-center gap-1 px-1.5 py-1 rounded-xl flex-shrink-0 transition-colors"
      style={{
        background: on ? 'rgba(139,92,246,0.3)' : 'rgba(55,65,81,0.8)',
        border: `1px solid ${on ? '#7c3aed' : '#374151'}`,
      }}
    >
      <span className="text-sm">👆</span>
      <div
        className="relative flex-shrink-0 rounded-full transition-colors"
        style={{ width: 24, height: 13, background: on ? '#7c3aed' : '#4b5563' }}
      >
        <div
          className="absolute top-0.5 rounded-full bg-white transition-all"
          style={{ width: 9, height: 9, left: on ? 13 : 2 }}
        />
      </div>
    </button>
  );
}

export function PlayScreen({ song, onBack, onComplete }: PlayScreenProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('waterfall');
  const [coloredNotes, setColoredNotes] = useState(true);
  const [layout, setLayout] = useState<LayoutMode>('portrait');
  const [tempoMult, setTempoMult] = useState(1.0);
  const [showFingers, setShowFingers] = useState(false);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [accompanimentOn, setAccompanimentOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const accompanimentRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);
  const hint1Ref = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hint2Ref = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { markComplete } = useProgress();
  const { detectedPitch, isListening, permissionDenied, startListening, stopListening } =
    usePitchDetection();
  useAudioFeedback();
  const { currentNoteIndex, feedback, isComplete, wrongCount, start, reset } = useGameLogic(
    song,
    gameStarted ? detectedPitch : null,
    undefined,
    tempoMult
  );

  const metronomeBeat = useMetronome(
    song.tempo * tempoMult,
    song.timeSignature[0],
    gameStarted && metronomeOn,
    audioCtxRef.current
  );

  // Accompaniment: rhythmic bass pattern (root + fifth alternating per beat)
  useEffect(() => {
    if (!gameStarted || !accompanimentOn || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state !== 'running') return;

    const msPerBeat = (60 / (song.tempo * tempoMult)) * 1000;
    const timbreId = localStorage.getItem('klavier_timbre') ?? 'piano';
    const oscTypeMap: Record<string, OscillatorType> = {
      piano: 'triangle', organ: 'sine', xylophone: 'square', strings: 'sawtooth',
    };
    const oscType: OscillatorType = oscTypeMap[timbreId] ?? 'triangle';

    // Detect root note class from first non-rest note
    const firstNote = song.notes.find(n => !n.rest);
    const rootClass = firstNote ? firstNote.note.replace(/\d+$/, '') : 'C';
    const FIFTHS: Record<string, string> = {
      'C':'G','D':'A','E':'B','F':'C','G':'D','A':'E','B':'F#',
      'C#':'G#','D#':'A#','F#':'C#','G#':'D#','A#':'F',
    };
    const fifthClass = FIFTHS[rootClass] ?? 'G';

    const noteFreq = (name: string, octave: number): number => {
      const semitones: Record<string, number> = {
        'C':0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11
      };
      const midi = 12 * (octave + 1) + (semitones[name] ?? 0);
      return 440 * Math.pow(2, (midi - 69) / 12);
    };

    const freqs = [noteFreq(rootClass, 3), noteFreq(fifthClass, 3)];
    let beat = 0;
    let active = true;

    const playBeat = () => {
      if (!active || ctx.state !== 'running') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = oscType;
      osc.frequency.value = freqs[beat % 2];
      const beatDur = msPerBeat / 1000;
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + beatDur * 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + beatDur * 0.85);
      beat++;
    };

    playBeat();
    const id = setInterval(playBeat, msPerBeat);
    return () => { active = false; clearInterval(id); accompanimentRef.current = null; };
  }, [gameStarted, accompanimentOn, song, tempoMult]);

  // Reset hint timers whenever the note advances
  useEffect(() => {
    if (!gameStarted) return;
    clearTimeout(hint1Ref.current);
    clearTimeout(hint2Ref.current);
    setHintLevel(0);
    hint1Ref.current = setTimeout(() => setHintLevel(1), 3000);
    hint2Ref.current = setTimeout(() => setHintLevel(2), 7000);
    return () => {
      clearTimeout(hint1Ref.current);
      clearTimeout(hint2Ref.current);
    };
  }, [currentNoteIndex, gameStarted]);

  useEffect(() => {
    if (isComplete) {
      const earnedStars: 1 | 2 | 3 = wrongCount <= 2 ? 3 : wrongCount <= 8 ? 2 : 1;
      markComplete(song.id, earnedStars);
      const t = setTimeout(() => onComplete(earnedStars), 800);
      return () => clearTimeout(t);
    }
  }, [isComplete, onComplete, markComplete, song.id, wrongCount]);

  const handleStart = useCallback(async () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
    await startListening(audioCtxRef.current);
    start();
    setGameStarted(true);
  }, [startListening, start]);

  const handleBack = useCallback(() => {
    stopListening();
    reset();
    clearTimeout(hint1Ref.current);
    clearTimeout(hint2Ref.current);
    onBack();
  }, [stopListening, reset, onBack]);

  const nonRestCount = song.notes.filter(n => !n.rest).length;
  const completedCount = song.notes.slice(0, currentNoteIndex).filter(n => !n.rest).length;
  const currentNote = song.notes[currentNoteIndex];
  const expectedNote = currentNote && !currentNote.rest ? currentNote.note : null;
  const currentLyric = currentNote?.lyric;
  const diffColor = DIFF_DOT_COLOR[song.difficulty] ?? '#6b7280';

  const toggleLayout = useCallback(
    () => setLayout(l => l === 'portrait' ? 'landscape' : 'portrait'),
    []
  );
  const toggleTempo = useCallback(
    () => setTempoMult(t => t === 1 ? 0.75 : 1),
    []
  );

  const notesView = (
    <div className="flex-1 min-h-0">
      {viewMode === 'waterfall' ? (
        <NoteWaterfall song={song} currentNoteIndex={currentNoteIndex} feedback={feedback} />
      ) : (
        <SheetMusicView song={song} currentNoteIndex={currentNoteIndex} feedback={feedback} coloredNotes={coloredNotes} />
      )}
    </div>
  );

  const lyricBar = currentLyric && viewMode === 'sheet' ? (
    <div className="flex-shrink-0 flex items-center justify-center px-4 py-1.5 bg-gray-900 border-t border-gray-800">
      <span className="text-white font-bold text-base leading-tight">{currentLyric}</span>
    </div>
  ) : null;

  const micBar = <MicFeedbackBar detectedPitch={detectedPitch} isListening={isListening} />;
  const metBar = <MetronomeBar beat={metronomeBeat} total={song.timeSignature[0]} active={gameStarted && metronomeOn} />;

  const progressBar = <ProgressDots current={completedCount} total={nonRestCount} />;

  const keyboard = (
    <PianoKeyboard
      expectedNote={expectedNote}
      detectedNote={detectedPitch?.noteName ?? null}
      feedback={feedback}
      showFingerHints={showFingers}
      hintLevel={hintLevel}
    />
  );

  const isLandscape = layout === 'landscape';

  return (
    <div className="relative flex flex-col h-[100dvh] bg-gray-950 text-white overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-2 bg-gray-900/95 border-b border-gray-800 flex-shrink-0">
        <button
          onClick={handleBack}
          className="text-xl p-1.5 rounded-xl hover:bg-gray-800 active:bg-gray-700 flex-shrink-0 transition-colors"
        >
          ◄
        </button>

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0">{song.coverEmoji}</span>
          <span className="text-xs font-bold truncate">{song.title}</span>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: diffColor }} />
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-0.5 bg-gray-800 rounded-xl p-0.5 flex-shrink-0">
          <button
            onClick={() => setViewMode('waterfall')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'waterfall' ? 'bg-gray-600 text-white shadow' : 'text-gray-400'
            }`}
          >⬇</button>
          <button
            onClick={() => setViewMode('sheet')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'sheet' ? 'bg-gray-600 text-white shadow' : 'text-gray-400'
            }`}
          >𝄞</button>
        </div>

        {/* Color toggle (sheet mode only) */}
        {viewMode === 'sheet' && (
          <button
            onClick={() => setColoredNotes(c => !c)}
            className={`p-1.5 rounded-xl text-sm transition-colors flex-shrink-0 border ${
              coloredNotes ? 'bg-purple-700/80 border-purple-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}
          >🎨</button>
        )}

        {/* Portrait / Landscape toggle */}
        <button
          onClick={toggleLayout}
          title={isLandscape ? 'Hochformat' : 'Querformat'}
          className={`p-1.5 rounded-xl text-sm font-bold transition-colors flex-shrink-0 border ${
            isLandscape ? 'bg-blue-700/80 border-blue-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'
          }`}
        >
          {isLandscape ? '↔' : '↕'}
        </button>

        {/* Tempo toggle */}
        <button
          onClick={toggleTempo}
          title={tempoMult === 1 ? 'Langsam (75%)' : 'Normal (100%)'}
          className={`p-1.5 rounded-xl text-sm transition-colors flex-shrink-0 border ${
            tempoMult < 1 ? 'bg-amber-700/80 border-amber-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'
          }`}
        >
          {tempoMult < 1 ? '🐢' : '🐇'}
        </button>

        {/* Metronome toggle */}
        <button
          onClick={() => setMetronomeOn(m => !m)}
          title="Metronom"
          className={`p-1.5 rounded-xl text-sm transition-colors flex-shrink-0 border ${
            metronomeOn ? 'bg-orange-700/80 border-orange-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'
          }`}
        >
          🎵
        </button>

        {/* Accompaniment toggle */}
        <button
          onClick={() => setAccompanimentOn(a => !a)}
          title="Begleitung"
          className={`p-1.5 rounded-xl text-sm transition-colors flex-shrink-0 border ${
            accompanimentOn ? 'bg-teal-700/80 border-teal-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'
          }`}
        >
          🎸
        </button>

        {/* Finger hints toggle */}
        <ToggleSwitch on={showFingers} onChange={() => setShowFingers(f => !f)} label="Finger-Tipps" />
      </div>

      {/* Main layout: portrait vs landscape */}
      {isLandscape ? (
        <div className="flex flex-row flex-1 min-h-0">
          <div className="flex flex-col flex-1 min-w-0">
            {notesView}
            {lyricBar}
            {metBar}
            {micBar}
            {progressBar}
          </div>
          <div
            className="flex-shrink-0 flex flex-col py-1 pr-1 border-l border-gray-800"
            style={{ width: '40%' }}
          >
            <div className="flex-1 min-h-0 px-1">
              {keyboard}
            </div>
          </div>
        </div>
      ) : (
        <>
          {notesView}
          {lyricBar}
          {metBar}
          {micBar}
          <div className="h-36 flex-shrink-0 px-1 pb-1">
            {keyboard}
          </div>
          {progressBar}
        </>
      )}

      {/* Start overlay */}
      {!gameStarted && (
        <div
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(3,7,18,0.88)', backdropFilter: 'blur(8px)' }}
        >
          <div className="text-center p-8 max-w-xs w-full">
            <div
              className="text-7xl mb-5 inline-block"
              style={{ filter: 'drop-shadow(0 0 24px rgba(255,255,255,0.15))' }}
            >
              {song.coverEmoji}
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-1">{song.title}</h2>
            {song.subtitle && (
              <p className="text-gray-400 mb-6 text-sm">{song.subtitle}</p>
            )}
            {permissionDenied ? (
              <>
                <div className="bg-red-950/80 border border-red-800 rounded-2xl p-4 mb-5">
                  <p className="text-red-300 text-sm leading-snug">
                    🎤 Mikrofon nicht erlaubt. Bitte Zugriff in den Browser-Einstellungen gewähren.
                  </p>
                </div>
                <button
                  onClick={handleStart}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 px-6 py-4 rounded-2xl text-lg font-bold transition-transform"
                >
                  Nochmal versuchen
                </button>
              </>
            ) : (
              <button
                onClick={handleStart}
                className="w-full bg-gradient-to-b from-green-400 to-green-600 hover:from-green-300 hover:to-green-500 active:scale-95 px-10 py-5 rounded-3xl text-2xl font-black transition-transform"
                style={{ boxShadow: '0 0 30px rgba(34,197,94,0.35), 0 4px 15px rgba(0,0,0,0.5)' }}
              >
                🎵 Spielen!
              </button>
            )}
          </div>
        </div>
      )}

      <CorrectFlash show={feedback === 'correct'} />
    </div>
  );
}
