import { useState } from 'react';
import type { Song } from '../../types/music';
import { SongCard } from '../ui/SongCard';

interface SongSelectorProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
}

type Filter = 0 | 1 | 2 | 3;

const FILTER_LABELS: Record<Filter, string> = {
  0: 'Alle',
  1: '⭐ Anfänger',
  2: '⭐⭐ Mittel',
  3: '⭐⭐⭐ Profi',
};

export function SongSelector({ songs, onSelectSong }: SongSelectorProps) {
  const [filter, setFilter] = useState<Filter>(0);

  const filtered =
    filter === 0 ? songs : songs.filter(s => s.difficulty === (filter as 1 | 2 | 3));

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <div className="px-4 pt-safe-top py-4 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <h1 className="text-2xl font-bold mb-3">🎹 Klavier lernen</h1>
        <div className="flex gap-2 flex-wrap">
          {([0, 1, 2, 3] as Filter[]).map(d => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                filter === d
                  ? 'bg-white text-gray-900'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {FILTER_LABELS[d]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(song => (
            <SongCard key={song.id} song={song} onSelect={onSelectSong} />
          ))}
        </div>
        <p className="text-center text-gray-600 text-sm mt-6 pb-4">
          {filtered.length} Lieder
        </p>
      </div>
    </div>
  );
}
