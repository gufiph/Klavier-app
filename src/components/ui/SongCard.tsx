import type { Song } from '../../types/music';
import { StarRating } from './StarRating';

interface SongCardProps {
  song: Song;
  onSelect: (song: Song) => void;
}

const DIFF_LABEL = ['', 'Anfänger', 'Mittel', 'Profi'];
const DIFF_COLOR = ['', 'text-green-400', 'text-yellow-400', 'text-red-400'];

export function SongCard({ song, onSelect }: SongCardProps) {
  return (
    <button
      onClick={() => onSelect(song)}
      className="flex flex-col items-center gap-1.5 p-4 bg-gray-800 hover:bg-gray-700 active:scale-95 rounded-2xl transition-all border border-gray-700 hover:border-gray-500 text-left w-full"
    >
      <span className="text-4xl">{song.coverEmoji}</span>
      <span className="font-bold text-white text-sm text-center leading-tight line-clamp-2">
        {song.title}
      </span>
      {song.subtitle && (
        <span className="text-gray-400 text-xs text-center line-clamp-1">{song.subtitle}</span>
      )}
      <StarRating difficulty={song.difficulty} size="sm" />
      <span className={`text-xs ${DIFF_COLOR[song.difficulty]}`}>
        {DIFF_LABEL[song.difficulty]}
      </span>
    </button>
  );
}
