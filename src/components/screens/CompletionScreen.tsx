import type { Song } from '../../types/music';
import { StarRating } from '../ui/StarRating';

interface CompletionScreenProps {
  song: Song;
  onPlayAgain: () => void;
  onBackToSelector: () => void;
}

export function CompletionScreen({ song, onPlayAgain, onBackToSelector }: CompletionScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white p-8 text-center">
      <div className="text-8xl mb-4 animate-bounce">🎉</div>
      <h1 className="text-4xl font-bold mb-2">Super gemacht!</h1>
      <p className="text-gray-400 mb-4">
        Du hast „{song.title}“ gespielt!
      </p>
      <div className="text-6xl mb-3">{song.coverEmoji}</div>
      <StarRating difficulty={song.difficulty} size="lg" />
      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onPlayAgain}
          className="bg-green-500 hover:bg-green-400 active:scale-95 text-white font-bold py-4 rounded-2xl text-xl transition-transform"
        >
          🔄 Nochmal spielen
        </button>
        <button
          onClick={onBackToSelector}
          className="bg-gray-700 hover:bg-gray-600 active:scale-95 text-white font-bold py-4 rounded-2xl text-xl transition-transform"
        >
          🎵 Anderes Lied
        </button>
      </div>
    </div>
  );
}
