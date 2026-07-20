import { useState, useMemo } from 'react';
import type { Song } from '../../types/music';
import { SongCard } from '../ui/SongCard';

interface SongSelectorProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
}

type Filter = 0 | 1 | 2 | 3;

const FILTERS: { value: Filter; label: string; stars: string }[] = [
  { value: 0, label: 'Alle',      stars: '' },
  { value: 1, label: 'Anfänger',  stars: '⭐' },
  { value: 2, label: 'Mittel',    stars: '⭐⭐' },
  { value: 3, label: 'Profi',     stars: '⭐⭐⭐' },
];

export function SongSelector({ songs, onSelectSong }: SongSelectorProps) {
  const [filter, setFilter] = useState<Filter>(0);

  const counts = useMemo(() => ({
    0: songs.length,
    1: songs.filter(s => s.difficulty === 1).length,
    2: songs.filter(s => s.difficulty === 2).length,
    3: songs.filter(s => s.difficulty === 3).length,
  }), [songs]);

  const filtered = useMemo(
    () => filter === 0 ? songs : songs.filter(s => s.difficulty === filter),
    [songs, filter]
  );

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-5 pb-3 border-b border-gray-800/60"
        style={{ background: 'linear-gradient(to bottom, #111827, #030712)' }}>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
          >
            🎹
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-tight">Klavier Lernen</h1>
            <p className="text-gray-500 text-xs">Für Kinder · {songs.length} Lieder</p>
          </div>
        </div>

        {/* Difficulty filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTERS.map(({ value, label, stars }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all active:scale-95 ${
                filter === value
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {stars && <span className="text-xs">{stars}</span>}
              {label}
              <span className={`text-xs font-normal ${filter === value ? 'text-gray-500' : 'text-gray-600'}`}>
                {counts[value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Song grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(song => (
            <SongCard key={song.id} song={song} onSelect={onSelectSong} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center text-gray-600 py-16 gap-3">
            <span className="text-4xl">🎵</span>
            <p className="text-sm">Keine Lieder gefunden</p>
          </div>
        )}
        <p className="text-center text-gray-700 text-xs py-4 pb-6">
          {filtered.length} Lieder
        </p>
      </div>
    </div>
  );
}
