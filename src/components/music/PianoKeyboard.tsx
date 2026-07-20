import { PIANO_KEYS } from '../../constants/keyboard';
import { getNoteColor } from '../../constants/boomwhacker';
import type { FeedbackState } from '../../types/game';
import type { KeyRange } from '../../utils/songRange';

interface PianoKeyboardProps {
  expectedNote: string | null;
  detectedNote: string | null;
  feedback: FeedbackState;
  keyRange: KeyRange;
}

export function PianoKeyboard({ expectedNote, detectedNote, keyRange }: PianoKeyboardProps) {
  const { minWi, maxWi, visibleCount } = keyRange;

  const visibleWhiteKeys = PIANO_KEYS.filter(
    k => k.type === 'white' && k.whiteIndex >= minWi && k.whiteIndex <= maxWi
  );
  const visibleBlackKeys = PIANO_KEYS.filter(
    k => k.type === 'black' && k.whiteIndex >= minWi && k.whiteIndex <= maxWi
  );

  const wkPct = 100 / visibleCount;
  const bkPct = wkPct * 0.58;

  return (
    <div className="relative w-full h-full select-none">
      {/* White keys */}
      {visibleWhiteKeys.map(key => {
        const isExpected = key.note === expectedNote;
        const isDetected = key.note === detectedNote;
        const color = getNoteColor(key.note);
        const isActive = isExpected || isDetected;
        const relativeWi = key.whiteIndex - minWi;
        const raw = key.note.replace(/\d/g, '');
        const noteLetter = raw === 'B' ? 'H' : raw;

        return (
          <div
            key={key.note}
            className="absolute bottom-0 border border-gray-300 rounded-b-md flex items-end justify-center pb-1"
            style={{
              left: `${relativeWi * wkPct}%`,
              width: `${wkPct - 0.2}%`,
              height: '100%',
              backgroundColor: isActive ? color : '#f9fafb',
              boxShadow: isExpected ? `0 0 14px 5px ${color}99` : undefined,
              transition: 'background-color 0.1s',
              zIndex: 1,
            }}
          >
            {isExpected && (
              <div
                className="absolute inset-0 rounded-b-md animate-pulse"
                style={{ backgroundColor: color, opacity: 0.35 }}
              />
            )}
            <span
              className="font-bold text-gray-400 select-none pointer-events-none relative z-10"
              style={{ fontSize: `${Math.min(wkPct * 0.5, 4)}vw` }}
            >
              {noteLetter}
            </span>
          </div>
        );
      })}

      {/* Black keys */}
      {visibleBlackKeys.map(key => {
        const isExpected = key.note === expectedNote;
        const isDetected = key.note === detectedNote;
        const color = getNoteColor(key.note);
        const isActive = isExpected || isDetected;
        const relativeWi = key.whiteIndex - minWi;

        return (
          <div
            key={key.note}
            className="absolute top-0 rounded-b-sm"
            style={{
              left: `${(relativeWi + 1) * wkPct - bkPct / 2}%`,
              width: `${bkPct}%`,
              height: '62%',
              backgroundColor: isActive ? color : '#1c1c1e',
              boxShadow: isExpected ? `0 0 10px 3px ${color}cc` : undefined,
              transition: 'background-color 0.1s',
              zIndex: 2,
            }}
          />
        );
      })}
    </div>
  );
}
