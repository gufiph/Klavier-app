import { PIANO_KEYS, WHITE_KEY_COUNT } from '../../constants/keyboard';
import { getNoteColor } from '../../constants/boomwhacker';
import type { Song } from '../../types/music';
import type { FeedbackState } from '../../types/game';

interface NoteWaterfallProps {
  song: Song;
  currentNoteIndex: number;
  feedback: FeedbackState;
}

const LOOKAHEAD = 12;
const CURRENT_HEIGHT_PCT = 18;
const UPCOMING_AREA_PCT = 74;
const UPCOMING_COUNT = LOOKAHEAD - 1;

const WK = WHITE_KEY_COUNT;
const WK_PCT = 100 / WK;
const BK_PCT = WK_PCT * 0.58;

function displayLetter(noteName: string): string {
  const letter = noteName.replace(/[#\d]/g, '');
  return letter === 'B' ? 'H' : letter;
}

export function NoteWaterfall({ song, currentNoteIndex, feedback }: NoteWaterfallProps) {
  const upcoming = song.notes.slice(currentNoteIndex, currentNoteIndex + LOOKAHEAD);
  const rowPct = UPCOMING_AREA_PCT / UPCOMING_COUNT;
  const blockHeightPct = rowPct * 0.82;

  const currentEvent = upcoming[0];
  const currentLyric = currentEvent?.lyric;

  return (
    <div className="relative w-full h-full bg-gray-950 overflow-hidden">
      {/* Lane dividers — one per white key */}
      {Array.from({ length: WK + 1 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 w-px bg-gray-800/60"
          style={{ left: `${i * WK_PCT}%` }}
        />
      ))}

      {/* Trigger line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30" />

      {/* Note blocks */}
      {upcoming.map((event, idx) => {
        if (event.rest) return null;
        const key = PIANO_KEYS.find(k => k.note === event.note);
        if (!key) return null;

        const color = getNoteColor(event.note);
        const isCurrent = idx === 0;
        const isCorrect = isCurrent && feedback === 'correct';
        const isWrong = isCurrent && feedback === 'wrong';
        const isBlack = key.type === 'black';

        const leftPct = isBlack
          ? (key.whiteIndex + 1) * WK_PCT - BK_PCT / 2
          : key.whiteIndex * WK_PCT + 0.25;
        const widthPct = isBlack ? BK_PCT : WK_PCT - 0.5;
        const bottomPct = isCurrent ? 0 : CURRENT_HEIGHT_PCT + (idx - 1) * rowPct;
        const heightPct = isCurrent ? CURRENT_HEIGHT_PCT - 0.5 : blockHeightPct;

        const letter = displayLetter(event.note);
        const isSharp = event.note.includes('#');

        // Only show text on the current note block; upcoming blocks are pure color
        const showText = isCurrent;

        return (
          <div
            key={`${currentNoteIndex + idx}-${event.note}`}
            className={`absolute flex flex-col items-center justify-center transition-all duration-150
              ${isCurrent ? 'rounded-t-lg' : 'rounded-md'}`}
            style={{
              left: `${leftPct}%`,
              width: `${widthPct}%`,
              bottom: `${bottomPct}%`,
              height: `${heightPct}%`,
              backgroundColor: isCorrect ? '#22c55e' : color,
              opacity: isCurrent ? 1 : Math.max(0.5, 1 - idx * 0.07),
              boxShadow: isCurrent
                ? isCorrect
                  ? '0 0 28px 10px #22c55e88, 0 0 12px 4px #22c55e'
                  : `0 0 28px 10px ${color}88, 0 0 12px 4px ${color}`
                : `0 0 4px 1px ${color}44`,
              outline: isWrong ? '2px solid #ef4444' : undefined,
              zIndex: isBlack ? 2 : 1,
            }}
          >
            {showText && (
              <>
                <span
                  className="text-white/70 select-none pointer-events-none leading-none"
                  style={{ fontSize: 'clamp(7px, 1.8vw, 14px)', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                >
                  ♪
                </span>
                <span
                  className="font-black text-white select-none pointer-events-none leading-none"
                  style={{ fontSize: 'clamp(11px, 3.5vw, 28px)', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
                >
                  {isSharp ? '♯' : letter}
                </span>
              </>
            )}
          </div>
        );
      })}

      {/* Lyric strip */}
      {currentLyric !== undefined && currentLyric !== '' && (
        <div
          className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
          style={{ bottom: `${CURRENT_HEIGHT_PCT}%`, height: '9%' }}
        >
          <span
            className="text-white font-bold px-3 py-0.5 rounded-full bg-black/50"
            style={{ fontSize: 'clamp(12px, 3vw, 20px)', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
          >
            {currentLyric}
          </span>
        </div>
      )}
    </div>
  );
}
