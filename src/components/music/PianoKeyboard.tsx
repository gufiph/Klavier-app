import { PIANO_KEYS, WHITE_KEY_COUNT } from '../../constants/keyboard';
import { getNoteColor } from '../../constants/boomwhacker';
import type { FeedbackState } from '../../types/game';

interface PianoKeyboardProps {
  expectedNote: string | null;
  detectedNote: string | null;
  feedback: FeedbackState;
  showFingerHints?: boolean;
  hintLevel?: 0 | 1 | 2;
}

const ALL_WHITE = PIANO_KEYS.filter(k => k.type === 'white');
const ALL_BLACK = PIANO_KEYS.filter(k => k.type === 'black');
const WK = WHITE_KEY_COUNT;
const WK_PCT = 100 / WK;
const BK_PCT = WK_PCT * 0.58;

const FINGER_MAP: Record<string, number> = {
  C: 1, D: 2, E: 3, F: 4, G: 5, A: 5, B: 4,
};
const FINGER_MAP_SHARP: Record<string, number> = {
  'C#': 1, 'D#': 2, 'F#': 4, 'G#': 5, 'A#': 5,
};

function getFingerHint(note: string): number {
  const letter = note.replace(/\d/g, '');
  return FINGER_MAP_SHARP[letter] ?? FINGER_MAP[letter.replace('#', '')] ?? 1;
}

function displayLetter(note: string): string {
  const raw = note.replace(/[#\d]/g, '');
  return raw === 'B' ? 'H' : raw;
}

export function PianoKeyboard({
  expectedNote,
  detectedNote,
  showFingerHints = false,
  hintLevel = 0,
}: PianoKeyboardProps) {
  const expectedKey = expectedNote ? PIANO_KEYS.find(k => k.note === expectedNote) : null;

  const indicatorLeft = expectedKey
    ? expectedKey.type === 'black'
      ? (expectedKey.whiteIndex + 1) * WK_PCT
      : expectedKey.whiteIndex * WK_PCT + WK_PCT / 2
    : null;

  const indicatorColor = expectedKey ? getNoteColor(expectedKey.note) : '#fff';
  const indicatorLetter = expectedKey ? displayLetter(expectedKey.note) : '';
  const fingerNum = expectedNote && showFingerHints ? getFingerHint(expectedNote) : null;

  // hintLevel 1: faster bounce + brighter glow; hintLevel 2: also show text banner
  const bounceClass = hintLevel >= 1 ? 'animate-[bounce_0.5s_infinite]' : 'animate-bounce';
  const glowMultiplier = hintLevel >= 1 ? 2.5 : 1;

  return (
    <div className="relative w-full h-full flex flex-col select-none overflow-hidden">

      {/* Hint banner (level 2) */}
      {hintLevel >= 2 && expectedNote && (
        <div
          className="flex-none flex items-center justify-center gap-2 py-1 text-xs font-black animate-pulse"
          style={{ color: indicatorColor, textShadow: `0 0 8px ${indicatorColor}` }}
        >
          👇 Spiel diese Taste!
        </div>
      )}

      {/* Bouncing indicator above the expected key */}
      <div className="relative flex-none" style={{ height: hintLevel >= 2 ? '22%' : '30%' }}>
        {indicatorLeft !== null && (
          <div
            className={`absolute bottom-1 ${bounceClass} flex flex-col items-center gap-0`}
            style={{ left: `${indicatorLeft}%`, transform: 'translateX(-50%)' }}
          >
            <div
              className="rounded-full flex items-center justify-center font-black text-white"
              style={{
                width: 'clamp(20px, 4.5vw, 38px)',
                height: 'clamp(20px, 4.5vw, 38px)',
                fontSize: 'clamp(10px, 2.2vw, 19px)',
                backgroundColor: indicatorColor,
                boxShadow: `0 0 ${14 * glowMultiplier}px ${5 * glowMultiplier}px ${indicatorColor}${hintLevel >= 1 ? 'aa' : '55'}`,
              }}
            >
              {indicatorLetter}
            </div>
            {fingerNum !== null && (
              <div
                className="font-black text-center leading-none mt-0.5"
                style={{
                  color: indicatorColor,
                  fontSize: 'clamp(8px, 1.8vw, 14px)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}
              >
                {fingerNum}
              </div>
            )}
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
                boxShadow: isExpected
                  ? `0 0 ${12 * glowMultiplier}px ${4 * glowMultiplier}px ${color}${hintLevel >= 1 ? 'cc' : '88'}`
                  : undefined,
                transition: 'background-color 0.1s',
                zIndex: 1,
              }}
            >
              {isExpected && (
                <div
                  className="absolute inset-0 rounded-b-sm animate-pulse"
                  style={{ backgroundColor: color, opacity: hintLevel >= 1 ? 0.5 : 0.35 }}
                />
              )}
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
                boxShadow: isExpected
                  ? `0 0 ${10 * glowMultiplier}px ${3 * glowMultiplier}px ${color}${hintLevel >= 1 ? 'ff' : 'cc'}`
                  : undefined,
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
