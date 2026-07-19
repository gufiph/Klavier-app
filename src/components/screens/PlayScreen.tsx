import { useState, useRef, useEffect, useCallback } from 'react';
import type { Song } from '../../types/music';
import { usePitchDetection } from '../../hooks/usePitchDetection';
import { useGameLogic } from '../../hooks/useGameLogic';
import { useAudioFeedback } from '../../hooks/useAudioFeedback';
import { NoteWaterfall } from '../music/NoteWaterfall';
import { PianoKeyboard } from '../music/PianoKeyboard';
import { MicFeedbackBar } from '../feedback/MicFeedbackBar';
import { CorrectFlash } from '../feedback/CorrectFlash';
import { ProgressDots } from '../feedback/ProgressDots';

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
  const { playCorrect } = useAudioFeedback();
  const { currentNoteIndex, feedback, isComplete, start, reset } = useGameLogic(
    song,
    gameStarted ? detectedPitch : null,
    playCorrect
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

  return (
    <div className="relative flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <button onClick={handleBack} className="mr-3 text-2xl p-1 rounded-lg active:bg-gray-700">
          ◄
        </button>
        <span className="text-xl font-bold truncate">
          {song.coverEmoji} {song.title}
        </span>
      </div>

      {/* Waterfall */}
      <div className="flex-1 min-h-0">
        <NoteWaterfall song={song} currentNoteIndex={currentNoteIndex} feedback={feedback} />
      </div>

      {/* Mic bar */}
      <MicFeedbackBar detectedPitch={detectedPitch} isListening={isListening} />

      {/* Piano keyboard */}
      <div className="h-36 sm:h-44 px-1 pb-1 flex-shrink-0">
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
