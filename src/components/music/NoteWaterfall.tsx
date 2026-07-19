import { PIANO_KEYS, WHITE_KEY_COUNT } from '../../constants/keyboard';
import { getNoteColor } from '../../constants/boomwhacker';
import type { Song } from '../../types/music';
import type { FeedbackState } from '../../types/game';

interface NoteWaterfallProps {
  song: Song;
  currentNoteIndex: number;
  feedback: FeedbackState;
}

const LOOKAHEAD = 14;

export function NoteWaterfall({ song, currentNoteIndex, feedback }: NoteWaterfallProps) {
  const wkPct = 100 / WHITE_KEY_COUNT;
  const bkPct = wkPct * 0.58;
  const upcoming = song.notes.slice(currentNoteIndex, currentNoteIndex + LOOKAHEAD);

  return (
    <div className="relative w-full h-full bg-gray-950 overflow-hidden">
      {/* Lane dividers */}
      {Array.from({ length: WHITE_KEY_COUNT + 1 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 w-px bg-gray-800/60"
          style={{ left: `${i * wkPct}%` }}
        />
      ))}

      {/* Trigger line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20" />

      {/* Note blocks */}
      {upcoming.map((event, idx) => {
        if (event.rest) return null;
        const key = PIANO_KEYS.find(k => k.note === event.note);
        if (!key) return null;

        const color = getNoteColor(event.note);
        const isCurrent = idx === 0;

        let leftPct: number;
        let widthPct: number;
        if (key.type === 'white') {
          leftPct = key.whiteIndex * wkPct + 0.2;
          widthPct = wkPct - 0.6;
        } else {
          leftPct = (key.whiteIndex + 1) * wkPct - bkPct / 2;
          widthPct = bkPct;
        }

        const rowPct = 90 / LOOKAHEAD;
        const bottomPct = idx * rowPct;

        return (
          <div
            key={`${currentNoteIndex + idx}-${event.note}`}
            className="absolute rounded-sm transition-all duration-200"
            style={{
              left: `${leftPct}%`,
              width: `${widthPct}%`,
              bottom: `${bottomPct}%`,
              height: `${rowPct * 0.82}%`,
              backgroundColor: color,
              opacity: isCurrent ? 1 : Math.max(0.25, 0.85 - idx * 0.05),
              boxShadow: isCurrent ? `0 0 14px 4px ${color}55` : undefined,
              outline:
                isCurrent && feedback === 'correct'
                  ? '2px solid #22c55e'
                  : isCurrent && feedback === 'wrong'
                  ? '2px solid #ef4444'
                  : undefined,
              zIndex: key.type === 'black' ? 2 : 1,
            }}
          />
        );
      })}

      {/* Current note label */}
      {upcoming[0] && !upcoming[0].rest && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-white/50 text-xs font-mono pointer-events-none">
          {upcoming[0].note}
        </div>
      )}
    </div>
  );
}
