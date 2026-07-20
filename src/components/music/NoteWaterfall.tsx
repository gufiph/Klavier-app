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
const CURRENT_HEIGHT_PCT = 16;
const UPCOMING_AREA_PCT = 76;
const UPCOMING_COUNT = LOOKAHEAD - 1;

// German piano uses H instead of B
function displayLetter(noteName: string): string {
  const letter = noteName.replace(/[#\d]/g, '');
  return letter === 'B' ? 'H' : letter;
}

export function NoteWaterfall({ song, currentNoteIndex, feedback, keyRange }: NoteWaterfallProps) {
  const { minWi, visibleCount } = keyRange;
  const wkPct = 100 / visibleCount;
  const bkPct = wkPct * 0.58;
  const upcoming = song.notes.slice(currentNoteIndex, currentNoteIndex + LOOKAHEAD);
  const rowPct = UPCOMING_AREA_PCT / UPCOMING_COUNT;
  const blockHeightPct = rowPct * 0.85;
  const fontSizeVw = Math.min(wkPct * 0.5, 5);
  const currentFontVw = Math.min(wkPct * 0.85, 9);

  const currentEvent = upcoming[0];
  const currentLyric = currentEvent?.lyric;

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
        const isCorrect = isCurrent && feedback === 'correct';
        const isWrong = isCurrent && feedback === 'wrong';
        const isBlack = key.type === 'black';
        const relativeWi = key.whiteIndex - minWi;

        const leftPct = isBlack
          ? (relativeWi + 1) * wkPct - bkPct / 2
          : relativeWi * wkPct + 0.3;
        const widthPct = isBlack ? bkPct : wkPct - 0.6;
        const bottomPct = isCurrent ? 0 : CURRENT_HEIGHT_PCT + (idx - 1) * rowPct;
        const heightPct = isCurrent ? CURRENT_HEIGHT_PCT - 1 : blockHeightPct;

        const letter = displayLetter(event.note);
        const isSharp = event.note.includes('#');

        return (
          <div
            key={`${currentNoteIndex + idx}-${event.note}`}
            className={`absolute flex flex-col items-center justify-center gap-0 transition-all duration-150 ${isCurrent ? 'rounded-t-xl' : 'rounded-xl'}`}
            style={{
              left: `${leftPct}%`,
              width: `${widthPct}%`,
              bottom: `${bottomPct}%`,
              height: `${heightPct}%`,
              backgroundColor: isCorrect ? '#22c55e' : color,
              opacity: isCurrent ? 1 : Math.max(0.6, 1 - idx * 0.06),
              boxShadow: isCurrent
                ? isCorrect
                  ? '0 0 32px 12px #22c55e99, 0 0 16px 6px #22c55e'
                  : `0 0 32px 12px ${color}aa, 0 0 16px 6px ${color}`
                : `0 0 6px 2px ${color}55`,
              outline: isWrong ? '3px solid #ef4444' : undefined,
              zIndex: isBlack ? 2 : 1,
            }}
          >
            {/* ♪ symbol */}
            <span
              className="text-white/80 select-none pointer-events-none leading-none"
              style={{
                fontSize: isCurrent ? `${currentFontVw * 0.5}vw` : `${fontSizeVw * 0.7}vw`,
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              }}
            >
              ♪
            </span>
            {/* Note letter */}
            <span
              className="font-black text-white select-none pointer-events-none leading-none"
              style={{
                fontSize: isCurrent ? `${currentFontVw}vw` : `${fontSizeVw}vw`,
                textShadow: '0 1px 6px rgba(0,0,0,0.9)',
              }}
            >
              {isSharp ? '♯' : letter}
            </span>
          </div>
        );
      })}

      {/* Lyric strip at top of current note zone */}
      {currentLyric !== undefined && currentLyric !== '' && (
        <div
          className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
          style={{ bottom: `${CURRENT_HEIGHT_PCT}%`, height: '8%' }}
        >
          <span
            className="text-white font-bold px-3 py-0.5 rounded-full bg-black/40"
            style={{ fontSize: 'clamp(13px, 3.5vw, 22px)', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
          >
            {currentLyric}
          </span>
        </div>
      )}
    </div>
  );
}
