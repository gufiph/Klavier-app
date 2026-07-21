import { useState, useRef, useCallback, useEffect } from 'react';
import { usePitchDetection } from '../../hooks/usePitchDetection';
import { BOOMWHACKER_COLORS } from '../../constants/boomwhacker';
import { noteToFrequency } from '../../utils/noteUtils';

const WHITE_KEYS: { note: string; label: string }[] = [
  { note: 'C3', label: 'C' }, { note: 'D3', label: 'D' }, { note: 'E3', label: 'E' },
  { note: 'F3', label: 'F' }, { note: 'G3', label: 'G' }, { note: 'A3', label: 'A' }, { note: 'B3', label: 'H' },
  { note: 'C4', label: 'C' }, { note: 'D4', label: 'D' }, { note: 'E4', label: 'E' },
  { note: 'F4', label: 'F' }, { note: 'G4', label: 'G' }, { note: 'A4', label: 'A' }, { note: 'B4', label: 'H' },
  { note: 'C5', label: 'C' }, { note: 'D5', label: 'D' }, { note: 'E5', label: 'E' },
  { note: 'F5', label: 'F' }, { note: 'G5', label: 'G' }, { note: 'A5', label: 'A' }, { note: 'B5', label: 'H' },
  { note: 'C6', label: 'C' },
];

const BLACK_KEYS: { note: string; pos: number }[] = [
  { note: 'C#3', pos: 1 }, { note: 'D#3', pos: 2 }, { note: 'F#3', pos: 4 }, { note: 'G#3', pos: 5 }, { note: 'A#3', pos: 6 },
  { note: 'C#4', pos: 8 }, { note: 'D#4', pos: 9 }, { note: 'F#4', pos: 11 }, { note: 'G#4', pos: 12 }, { note: 'A#4', pos: 13 },
  { note: 'C#5', pos: 15 }, { note: 'D#5', pos: 16 }, { note: 'F#5', pos: 18 }, { note: 'G#5', pos: 19 }, { note: 'A#5', pos: 20 },
];

function getNoteClass(noteName: string): string {
  return noteName.replace(/\d+$/, '');
}

function toGerman(noteName: string): string {
  return noteName.replace('B', 'H').replace('#', '♯');
}

function playTone(freq: number, audioCtx: AudioContext) {
  const timbreId = localStorage.getItem('klavier_timbre') ?? 'piano';
  const oscTypeMap: Record<string, OscillatorType> = {
    piano: 'triangle', organ: 'sine', xylophone: 'square', strings: 'sawtooth',
  };
  const oscType: OscillatorType = oscTypeMap[timbreId] ?? 'triangle';

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = oscType;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.22, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.9);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.9);
}

export function FreePlayScreen({ onBack }: { onBack: () => void }) {
  const [started, setStarted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { detectedPitch, isListening, permissionDenied, startListening, stopListening } = usePitchDetection();

  const handleStart = useCallback(async () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
    await startListening(audioCtxRef.current);
    setStarted(true);
  }, [startListening]);

  const handleBack = useCallback(() => {
    stopListening();
    onBack();
  }, [stopListening, onBack]);

  const handleKeyTap = useCallback((noteName: string) => {
    if (!audioCtxRef.current) return;
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    const freq = noteToFrequency(noteName);
    if (freq > 0) playTone(freq, audioCtxRef.current);
  }, []);

  const detectedNote = started ? (detectedPitch?.noteName ?? null) : null;
  const noteClass = detectedNote ? getNoteClass(detectedNote) : null;
  const bwColor = noteClass ? (BOOMWHACKER_COLORS[noteClass] ?? '#6b7280') : null;

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-950 text-white overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <button
          onClick={handleBack}
          className="text-xl p-1.5 rounded-xl hover:bg-gray-800 active:bg-gray-700 flex-shrink-0"
        >
          ◄
        </button>
        <span className="text-base font-black">🎹 Freies Spielen</span>
        {isListening && (
          <span className="ml-auto text-xs text-emerald-400 font-semibold">🎤 aktiv</span>
        )}
      </div>

      {/* Detected note display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        {!started ? (
          <div className="text-center">
            <div className="text-6xl mb-6">🎹</div>
            <p className="text-gray-400 text-sm mb-6">Spiel beliebige Töne auf deinem Klavier.<br />Die App zeigt dir, welche Note du spielst!</p>
            {permissionDenied ? (
              <div className="bg-red-950/80 border border-red-800 rounded-2xl p-4 mb-4 text-sm text-red-300">
                🎤 Mikrofon nicht erlaubt. Bitte in den Browser-Einstellungen freigeben.
              </div>
            ) : null}
            <button
              onClick={handleStart}
              className="px-10 py-4 rounded-2xl text-xl font-black text-white transition-transform active:scale-95"
              style={{ background: 'linear-gradient(to bottom, #4ade80, #16a34a)', boxShadow: '0 0 24px rgba(34,197,94,0.3)' }}
            >
              🎤 Mikrofon starten
            </button>
          </div>
        ) : (
          <>
            {/* Big note display */}
            <div
              className="w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-150 shadow-2xl"
              style={{
                background: bwColor
                  ? `radial-gradient(circle at 35% 35%, ${bwColor}cc, ${bwColor})`
                  : 'rgba(31,41,55,0.8)',
                boxShadow: bwColor ? `0 0 60px ${bwColor}66` : undefined,
              }}
            >
              <div className="text-6xl font-black leading-none" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                {detectedNote ? toGerman(noteClass ?? '') : '?'}
              </div>
              {detectedNote && (
                <div className="text-lg font-semibold opacity-80 mt-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                  {detectedNote.replace(/([A-Z#]+)(\d)/, '$1$2').replace('B', 'H').replace('#', '♯')}
                </div>
              )}
            </div>

            {detectedPitch && detectedPitch.noteName && (
              <div className="text-center text-xs text-gray-500">
                {detectedPitch.frequency.toFixed(1)} Hz · {Math.round(detectedPitch.clarity * 100)}% klar
              </div>
            )}

            <p className="text-gray-600 text-xs text-center mt-2">
              Tippe auf eine Taste unten, um sie zu hören!
            </p>
          </>
        )}
      </div>

      {/* Touch keyboard */}
      <div className="flex-shrink-0 pb-2 px-1 bg-gray-900 border-t border-gray-800">
        <div className="relative h-24 overflow-x-auto">
          <div className="relative flex" style={{ minWidth: `${WHITE_KEYS.length * 40}px`, height: '96px' }}>
            {/* White keys */}
            {WHITE_KEYS.map((k, i) => {
              const keyClass = getNoteClass(k.note);
              const color = BOOMWHACKER_COLORS[keyClass] ?? '#ffffff';
              const isDetected = detectedNote && getNoteClass(detectedNote) === keyClass
                && detectedNote.replace(/\D/g,'') === k.note.replace(/\D/g,'');
              return (
                <button
                  key={k.note}
                  onPointerDown={() => handleKeyTap(k.note)}
                  className="relative flex-shrink-0 border border-gray-600 rounded-b-lg active:opacity-70 transition-opacity"
                  style={{
                    width: 39, height: 90, marginRight: 1,
                    background: isDetected
                      ? color
                      : `linear-gradient(to bottom, #f5f5f0, #e8e8e0)`,
                    boxShadow: isDetected ? `0 0 12px ${color}` : '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  <span className="absolute bottom-1 left-0 right-0 text-center text-xs font-bold text-gray-600"
                    style={{ fontSize: 9 }}>
                    {k.label}
                  </span>
                </button>
              );
            })}

            {/* Black keys */}
            {BLACK_KEYS.map(k => {
              const keyClass = getNoteClass(k.note);
              const isDetected = detectedNote === k.note;
              const color = BOOMWHACKER_COLORS[keyClass] ?? '#B0B0B0';
              return (
                <button
                  key={k.note}
                  onPointerDown={() => handleKeyTap(k.note)}
                  className="absolute top-0 rounded-b-md z-10 active:opacity-60 transition-opacity"
                  style={{
                    left: k.pos * 40 - 12,
                    width: 26, height: 58,
                    background: isDetected ? color : '#1a1a2e',
                    boxShadow: isDetected ? `0 0 10px ${color}` : '0 2px 4px rgba(0,0,0,0.6)',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
