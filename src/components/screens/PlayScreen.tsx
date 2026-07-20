import { useState, useRef, useEffect, useCallback } from 'react';
import type { Song } from '../../types/music';
import { usePitchDetection } from '../../hooks/usePitchDetection';
import { useGameLogic } from '../../hooks/useGameLogic';
import { useAudioFeedback } from '../../hooks/useAudioFeedback';
import { NoteWaterfall } from '../music/NoteWaterfall';
import { SheetMusicView } from '../music/SheetMusicView';
import { PianoKeyboard } from '../music/PianoKeyboard';
import { MicFeedbackBar } from '../feedback/MicFeedbackBar';
import { CorrectFlash } from '../feedback/CorrectFlash';
import { ProgressDots } from '../feedback/ProgressDots';

type ViewMode = 'waterfall' | 'sheet';

interface PlayScreenProps {
  song: Song;
  onBack: () => void;
  onComplete: () => void;
}

const DIFF_DOT_COLOR = ['', '#22c55e', '#f59e0b', '#ef4444'];

export function PlayScreen({ song, onBack, onComplete }: PlayScreenProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('waterfall');
  const [coloredNotes, setColoredNotes] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const { detectedPitch, isListening, permissionDenied, startListening, stopListening } =
    usePitchDetection();
  useAudioFeedback();
  const { currentNoteIndex, feedback, isComplete, start, reset } = useGameLogic(
    song,
    gameStarted ? detectedPitch : null
  );

  useEffect(() => {
    if (isComplete) {
      const t = setTimeout(() => onComplete(), 800);
      return () => clearTimeout(t);
    }
  }, [isComplete, onComplete]);

  const handleStart = useCallback(async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
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
  const diffColor = DIFF_DOT_COLOR[song.difficulty] ?? '#6b7280';

  return (
    <div className="relative flex flex-col h-[100dvh] bg-gray-950 text-white overflow-hidden">

      {/* Header — always horizontal bar, portrait and landscape */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/95 border-b border-gray-800 flex-shrink-0">
        <button
          onClick={handleBack}
          className="text-xl p-1.5 rounded-xl hover:bg-gray-800 active:bg-gray-700 flex-shrink-0 transition-colors"
        >
          ◄
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0">{song.coverEmoji}</span>
          <span className="text-sm font-bold truncate">{song.title}</span>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: diffColor }} />
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-0.5 bg-gray-800 rounded-xl p-1 flex-shrink-0">
          <button
            onClick={() => setViewMode('waterfall')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'waterfall' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
            title="Wasserfall"
          >
            ⬇
          </button>
          <button
            onClick={() => setViewMode('sheet')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'sheet' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
            title="Noten"
          >
            𝄞
          </button>
        </div>

        {/* Color toggle — only visible in sheet mode */}
        {viewMode === 'sheet' && (
          <button
            onClick={() => setColoredNotes(c => !c)}
            className={`p-1.5 rounded-xl text-sm transition-colors flex-shrink-0 border ${
              coloredNotes
                ? 'bg-purple-700/80 border-purple-600 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}
            title={coloredNotes ? 'Farben an' : 'Farben aus'}
          >
            🎨
          </button>
        )}
      </div>

      {/* Main view — waterfall or sheet music. flex-1 so keyboard stays at bottom */}
      <div className="flex-1 min-h-0">
        {viewMode === 'waterfall' ? (
          <NoteWaterfall
            song={song}
            currentNoteIndex={currentNoteIndex}
            feedback={feedback}
          />
        ) : (
          <SheetMusicView
            song={song}
            currentNoteIndex={currentNoteIndex}
            feedback={feedback}
            coloredNotes={coloredNotes}
          />
        )}
      </div>

      {/* Mic feedback */}
      <MicFeedbackBar detectedPitch={detectedPitch} isListening={isListening} />

      {/* Piano keyboard — landscape:h-44 gives more key height in landscape */}
      <div className="h-36 landscape:h-44 flex-shrink-0 px-1 pb-1">
        <PianoKeyboard
          expectedNote={expectedNote}
          detectedNote={detectedPitch?.noteName ?? null}
          feedback={feedback}
        />
      </div>

      {/* Progress */}
      <ProgressDots current={completedCount} total={nonRestCount} />

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
