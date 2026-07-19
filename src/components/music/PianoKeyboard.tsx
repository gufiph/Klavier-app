import { PIANO_KEYS, WHITE_KEY_COUNT } from '../../constants/keyboard';
import { getNoteColor } from '../../constants/boomwhacker';
import type { FeedbackState } from '../../types/game';

interface PianoKeyboardProps {
  expectedNote: string | null;
  detectedNote: string | null;
  feedback: FeedbackState;
}

export function PianoKeyboard({ expectedNote, detectedNote }: PianoKeyboardProps) {
  const whiteKeys = PIANO_KEYS.filter(k => k.type === 'white');
  const blackKeys = PIANO_KEYS.filter(k => k.type === 'black');
  const wkPct = 100 / WHITE_KEY_COUNT;
  const bkPct = wkPct * 0.58;

  return (
    <div className="relative w-full h-full select-none">
      {whiteKeys.map(key => {
        const isExpected = key.note === expectedNote;
        const isDetected = key.note === detectedNote;
        const color = getNoteColor(key.note);
        const isActive = isExpected || isDetected;
        return (
          <div
            key={key.note}
            className="absolute bottom-0 border border-gray-300 rounded-b-md"
            style={{
              left: `${key.whiteIndex * wkPct}%`,
              width: `${wkPct - 0.15}%`,
              height: '100%',
              backgroundColor: isActive ? color : '#f9fafb',
              boxShadow: isExpected ? `0 0 10px 3px ${color}88` : undefined,
              transition: 'background-color 0.1s',
              zIndex: 1,
            }}
          >
            {isExpected && (
              <div
                className="absolute inset-0 rounded-b-md animate-pulse"
                style={{ backgroundColor: color, opacity: 0.3 }}
              />
            )}
          </div>
        );
      })}
      {blackKeys.map(key => {
        const isExpected = key.note === expectedNote;
        const isDetected = key.note === detectedNote;
        const color = getNoteColor(key.note);
        const isActive = isExpected || isDetected;
        return (
          <div
            key={key.note}
            className="absolute top-0 rounded-b-sm"
            style={{
              left: `${(key.whiteIndex + 1) * wkPct - bkPct / 2}%`,
              width: `${bkPct}%`,
              height: '62%',
              backgroundColor: isActive ? color : '#1c1c1e',
              boxShadow: isExpected ? `0 0 8px 2px ${color}aa` : undefined,
              transition: 'background-color 0.1s',
              zIndex: 2,
            }}
          />
        );
      })}
    </div>
  );
}
