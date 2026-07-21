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

type ViewMode = 'waterfall' | 'sheet';
type LayoutMode = 'portrait' | 'landscape';

interface PlayScreenProps {
  song: Song;
  onBack: () => void;
  onComplete: () => void;
}

const DIFF_DOT_COLOR = ['', '#22c55e', '#f59e0b', '#ef4444'];

// Toggle switch for finger hints
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
      {/* Visual switch track */}
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
  const audioCtxRef = useRef<AudioContext | null>(null);

  const { markComplete } = useProgress();
  const { detectedPitch, isListening, permissionDenied, startListening, stopListening } =
    usePitchDetection();
  useAudioFeedback();
  const { currentNoteIndex, feedback, isComplete, start, reset } = useGameLogic(
    song,
    gameStarted ? detectedPitch : null,
    undefined,
    tempoMult
  );

  useEffect(() => {
    if (isComplete) {
      markComplete(song.id);
      const t = setTimeout(() => onComplete(), 800);
      return () => clearTimeout(t);
    }
  }, [isComplete, onComplete, markComplete, song.id]);

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

  // Reusable sub-components
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

  const progressBar = (
    <ProgressDots current={completedCount} total={nonRestCount} />
  );

  const keyboard = (
    <PianoKeyboard
      expectedNote={expectedNote}
      detectedNote={detectedPitch?.noteName ?? null}
      feedback={feedback}
      showFingerHints={showFingers}
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

        {/* Portrait ↕ / Landscape ↔ toggle */}
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

        {/* Finger hints toggle switch */}
        <ToggleSwitch on={showFingers} onChange={() => setShowFingers(f => !f)} label="Finger-Tipps" />
      </div>

      {/* Main layout: portrait vs landscape */}
      {isLandscape ? (
        <div className="flex flex-row flex-1 min-h-0">
          {/* Left: notes + lyric (sheet) + mic + progress */}
          <div className="flex flex-col flex-1 min-w-0">
            {notesView}
            {lyricBar}
            {micBar}
            {progressBar}
          </div>
          {/* Right: full-height keyboard */}
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
