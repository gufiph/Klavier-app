import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Song } from '../../types/music';
import { usePitchDetection } from '../../hooks/usePitchDetection';
import { useGameLogic } from '../../hooks/useGameLogic';
import { useAudioFeedback } from '../../hooks/useAudioFeedback';
import { NoteWaterfall } from '../music/NoteWaterfall';
import { PianoKeyboard } from '../music/PianoKeyboard';
import { MicFeedbackBar } from '../feedback/MicFeedbackBar';
import { CorrectFlash } from '../feedback/CorrectFlash';
import { ProgressDots } from '../feedback/ProgressDots';
import { getSongKeyRange } from '../../utils/songRange';

interface PlayScreenProps {
  song: Song;
  onBack: () => void;
  onComplete: () => void;
}

export function PlayScreen({ song, onBack, onComplete }: PlayScreenProps) {
  const [gameStarted, setGameStarted] = useState(false);
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

  const keyRange = useMemo(() => getSongKeyRange(song), [song]);
  const nonRestCount = song.notes.filter(n => !n.rest).length;
  const completedCount = song.notes.slice(0, currentNoteIndex).filter(n => !n.rest).length;
  const currentNote = song.notes[currentNoteIndex];
  const expectedNote = currentNote && !currentNote.rest ? currentNote.note : null;

  return (
    <div className="relative flex flex-col h-[100dvh] bg-gray-950 text-white overflow-hidden
                    landscape:flex-row landscape:items-stretch">
      {/* Header — portrait: top bar | landscape: left side strip */}
      <div className="flex items-center px-3 py-2 bg-gray-900 border-b border-gray-800
                      flex-shrink-0 landscape:flex-col landscape:border-b-0 landscape:border-r
                      landscape:py-4 landscape:px-2 landscape:gap-3 landscape:w-12 landscape:justify-start">
        <button
          onClick={handleBack}
          className="text-xl p-1 rounded-lg active:bg-gray-700 flex-shrink-0"
        >
          ◄
        </button>
        <span className="text-lg font-bold truncate landscape:hidden">
          {song.coverEmoji} {song.title}
        </span>
        <span className="hidden landscape:block text-xl">{song.coverEmoji}</span>
      </div>

      {/* Main area — portrait: full width column | landscape: row */}
      <div className="flex flex-col flex-1 min-h-0 min-w-0
                      landscape:flex-row landscape:flex-1">

        {/* Waterfall — portrait: takes remaining height | landscape: left column */}
        <div className="flex-1 min-h-0 min-w-0 landscape:flex-1">
          <NoteWaterfall
            song={song}
            currentNoteIndex={currentNoteIndex}
            feedback={feedback}
            keyRange={keyRange}
          />
        </div>

        {/* Right column in landscape: keyboard + mic + progress */}
        <div className="flex flex-col flex-shrink-0
                        landscape:w-2/5 landscape:border-l landscape:border-gray-800">

          {/* Mic bar */}
          <MicFeedbackBar detectedPitch={detectedPitch} isListening={isListening} />

          {/* Piano keyboard */}
          <div className="h-32 sm:h-40 landscape:h-full landscape:flex-1 px-1 pb-1 flex-shrink-0">
            <PianoKeyboard
              expectedNote={expectedNote}
              detectedNote={detectedPitch?.noteName ?? null}
              feedback={feedback}
              keyRange={keyRange}
            />
          </div>

          {/* Progress */}
          <ProgressDots current={completedCount} total={nonRestCount} />
        </div>
      </div>

      {/* Start overlay */}
      {!gameStarted && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center p-8 max-w-xs">
            <div className="text-7xl mb-4">{song.coverEmoji}</div>
            <h2 className="text-3xl font-bold mb-1">{song.title}</h2>
            {song.subtitle && (
              <p className="text-gray-400 mb-6 text-sm">{song.subtitle}</p>
            )}
            {permissionDenied ? (
              <>
                <p className="text-red-400 mb-4 text-sm">
                  🎤 Mikrofon nicht erlaubt. Bitte Zugriff in den Browser-Einstellungen gewähren.
                </p>
                <button
                  onClick={handleStart}
                  className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl text-xl font-bold"
                >
                  Nochmal versuchen
                </button>
              </>
            ) : (
              <button
                onClick={handleStart}
                className="bg-green-500 hover:bg-green-400 active:scale-95 px-10 py-5 rounded-3xl text-2xl font-bold transition-transform"
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
