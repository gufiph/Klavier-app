import type { Song } from '../../types/music';

interface SongCardProps {
  song: Song;
  onSelect: (song: Song) => void;
  isCompleted?: boolean;
}

const DIFF_STYLE = [
  '',
  'border-emerald-800 hover:border-emerald-600',
  'border-amber-800 hover:border-amber-600',
  'border-rose-800 hover:border-rose-600',
];

const DIFF_BG = [
  '',
  'linear-gradient(160deg, #064e3b 0%, #022c22 100%)',
  'linear-gradient(160deg, #451a03 0%, #292524 100%)',
  'linear-gradient(160deg, #4c0519 0%, #1c1917 100%)',
];

const DIFF_BADGE_COLOR = ['', '#34d399', '#fbbf24', '#fb7185'];
const DIFF_STARS = ['', '⭐', '⭐⭐', '⭐⭐⭐'];
const DIFF_LABEL = ['', 'Anfänger', 'Mittel', 'Profi'];

export function SongCard({ song, onSelect, isCompleted = false }: SongCardProps) {
  const badgeColor = DIFF_BADGE_COLOR[song.difficulty] ?? '#9ca3af';

  return (
    <button
      onClick={() => onSelect(song)}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border active:scale-95 transition-all w-full text-left shadow-lg ${DIFF_STYLE[song.difficulty]}`}
      style={{ background: DIFF_BG[song.difficulty] }}
    >
      {/* Completion checkmark */}
      {isCompleted && (
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
          style={{ background: '#22c55e', boxShadow: '0 0 8px #22c55e88' }}
        >
          ✓
        </div>
      )}

      <span
        className="text-4xl mt-1 leading-none"
        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}
      >
        {song.coverEmoji}
      </span>

      <span className="font-bold text-white text-xs text-center leading-tight line-clamp-2 w-full">
        {song.title}
      </span>

      {song.subtitle && (
        <span className="text-gray-400 text-xs text-center line-clamp-1 w-full hidden sm:block">
          {song.subtitle}
        </span>
      )}

      <div
        className="mt-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ color: badgeColor, background: `${badgeColor}20`, border: `1px solid ${badgeColor}40` }}
      >
        <span style={{ fontSize: '9px' }}>{DIFF_STARS[song.difficulty]}</span>
        {DIFF_LABEL[song.difficulty]}
      </div>
    </button>
  );
}
