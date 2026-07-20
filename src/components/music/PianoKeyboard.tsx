import { PIANO_KEYS, WHITE_KEY_COUNT } from '../../constants/keyboard';
import { getNoteColor } from '../../constants/boomwhacker';
import type { FeedbackState } from '../../types/game';

interface PianoKeyboardProps {
  expectedNote: string | null;
  detectedNote: string | null;
  feedback: FeedbackState;
}

const ALL_WHITE = PIANO_KEYS.filter(k => k.type === 'white');
const ALL_BLACK = PIANO_KEYS.filter(k => k.type === 'black');
const WK = WHITE_KEY_COUNT;
const WK_PCT = 100 / WK;
const BK_PCT = WK_PCT * 0.58;

function displayLetter(note: string): string {
  const raw = note.replace(/[#\d]/g, '');
  return raw === 'B' ? 'H' : raw;
}

export function PianoKeyboard({ expectedNote, detectedNote }: PianoKeyboardProps) {
  const expectedKey = expectedNote ? PIANO_KEYS.find(k => k.note === expectedNote) : null;

  // Center X of the expected key in percent
  const indicatorLeft = expectedKey
    ? expectedKey.type === 'black'
      ? (expectedKey.whiteIndex + 1) * WK_PCT
      : expectedKey.whiteIndex * WK_PCT + WK_PCT / 2
    : null;

  const indicatorColor = expectedKey ? getNoteColor(expectedKey.note) : '#fff';
  const indicatorLetter = expectedKey ? displayLetter(expectedKey.note) : '';

  return (
    <div className="relative w-full h-full flex flex-col select-none overflow-hidden">

      {/* Bouncing indicator above the expected key */}
      <div className="relative flex-none" style={{ height: '30%' }}>
        {indicatorLeft !== null && (
          <div
            className="absolute bottom-1 animate-bounce flex flex-col items-center gap-0"
            style={{ left: `${indicatorLeft}%`, transform: 'translateX(-50%)' }}
          >
            <div
              className="rounded-full flex items-center justify-center font-black text-white"
              style={{
                width: 'clamp(20px, 4.5vw, 38px)',
                height: 'clamp(20px, 4.5vw, 38px)',
                fontSize: 'clamp(10px, 2.2vw, 19px)',
                backgroundColor: indicatorColor,
                boxShadow: `0 0 14px 5px ${indicatorColor}55`,
              }}
            >
              {indicatorLetter}
            </div>
            <span style={{ color: indicatorColor, fontSize: '9px', lineHeight: 1 }}>▼</span>
          </div>
        )}
      </div>

      {/* Keys */}
      <div className="relative flex-1">
        {/* White keys */}
        {ALL_WHITE.map(key => {
          const isExpected = key.note === expectedNote;
          const isDetected = key.note === detectedNote;
          const color = getNoteColor(key.note);
          const isActive = isExpected || isDetected;
          const isC = key.note[0] === 'C' && !key.note.includes('#');

          return (
            <div
              key={key.note}
              className="absolute bottom-0 border border-gray-300 rounded-b-sm flex items-end justify-center pb-0.5"
              style={{
                left: `${key.whiteIndex * WK_PCT}%`,
                width: `${WK_PCT - 0.15}%`,
                height: '100%',
                backgroundColor: isActive ? color : '#f8fafc',
                boxShadow: isExpected ? `0 0 12px 4px ${color}88` : undefined,
                transition: 'background-color 0.1s',
                zIndex: 1,
              }}
            >
              {isExpected && (
                <div
                  className="absolute inset-0 rounded-b-sm animate-pulse"
                  style={{ backgroundColor: color, opacity: 0.35 }}
                />
              )}
              {/* Octave label on C keys for orientation */}
              {isC && !isActive && (
                <span
                  className="text-gray-300 select-none pointer-events-none relative z-10"
                  style={{ fontSize: 'clamp(5px, 1vw, 8px)' }}
                >
                  {key.note.slice(1)}
                </span>
              )}
            </div>
          );
        })}

        {/* Black keys */}
        {ALL_BLACK.map(key => {
          const isExpected = key.note === expectedNote;
          const isDetected = key.note === detectedNote;
          const color = getNoteColor(key.note);
          const isActive = isExpected || isDetected;

          return (
            <div
              key={key.note}
              className="absolute top-0 rounded-b-sm"
              style={{
                left: `${(key.whiteIndex + 1) * WK_PCT - BK_PCT / 2}%`,
                width: `${BK_PCT}%`,
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
    </div>
  );
}
