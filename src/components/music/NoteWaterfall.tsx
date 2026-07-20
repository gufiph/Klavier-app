import { PIANO_KEYS } from '../../constants/keyboard';
import { getNoteColor } from '../../constants/boomwhacker';
import type { Song } from '../../types/music';
import type { FeedbackState } from '../../types/game';
import type { KeyRange } from '../../utils/songRange';

interface NoteWaterfallProps {
  song: Song;
  currentNoteIndex: number;
  feedback: FeedbackState;
  keyRange: KeyRange;
}

const LOOKAHEAD = 10;

export function NoteWaterfall({ song, currentNoteIndex, feedback, keyRange }: NoteWaterfallProps) {
  const { minWi, visibleCount } = keyRange;
  const wkPct = 100 / visibleCount;
  const bkPct = wkPct * 0.58;
  const upcoming = song.notes.slice(currentNoteIndex, currentNoteIndex + LOOKAHEAD);
  const rowPct = 88 / LOOKAHEAD;
  const blockHeightPct = rowPct * 0.88;
  const fontSizeVw = Math.min(wkPct * 0.55, 6);

  return (
    <div className="relative w-full h-full bg-gray-950 overflow-hidden">
      {/* Lane dividers */}
      {Array.from({ length: visibleCount + 1 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 w-px bg-gray-700/50"
          style={{ left: `${i * wkPct}%` }}
        />
      ))}

      {/* Trigger line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/40" />

      {/* Note blocks */}
      {upcoming.map((event, idx) => {
        if (event.rest) return null;
        const key = PIANO_KEYS.find(k => k.note === event.note);
        if (!key) return null;

        const color = getNoteColor(event.note);
        const isCurrent = idx === 0;
        const isBlack = key.type === 'black';
        const relativeWi = key.whiteIndex - minWi;

        const leftPct = isBlack
          ? (relativeWi + 1) * wkPct - bkPct / 2
          : relativeWi * wkPct + 0.3;
        const widthPct = isBlack ? bkPct : wkPct - 0.6;
        const bottomPct = idx * rowPct;
        const noteLetter = event.note.replace(/[#\d]/g, '');
        const isSharp = event.note.includes('#');

        return (
          <div
            key={`${currentNoteIndex + idx}-${event.note}`}
            className="absolute rounded-xl flex items-center justify-center transition-all duration-150"
            style={{
              left: `${leftPct}%`,
              width: `${widthPct}%`,
              bottom: `${bottomPct}%`,
              height: `${blockHeightPct}%`,
              backgroundColor: color,
              opacity: isCurrent ? 1 : Math.max(0.65, 1 - idx * 0.04),
              boxShadow: isCurrent
                ? `0 0 28px 10px ${color}99, 0 0 12px 4px ${color}`
                : `0 0 8px 2px ${color}66`,
              outline: isCurrent && feedback === 'correct'
                ? '3px solid #22c55e'
                : isCurrent && feedback === 'wrong'
                ? '3px solid #ef4444'
                : undefined,
              zIndex: isBlack ? 2 : 1,
            }}
          >
            <span
              className="font-black text-white select-none pointer-events-none"
              style={{
                fontSize: `${fontSizeVw}vw`,
                lineHeight: 1,
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              }}
            >
              {isSharp ? '♯' : noteLetter}
            </span>
          </div>
        );
      })}
    </div>
  );
}
