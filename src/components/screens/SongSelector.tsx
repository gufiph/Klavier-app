import { useState, useMemo } from 'react';
import type { Song } from '../../types/music';
import { SongCard } from '../ui/SongCard';
import { useProgress } from '../../hooks/useProgress';

interface SongSelectorProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
}

type FilterValue = 0 | 1 | 2 | 3 | string;

const DIFF_FILTERS = [
  { value: 0 as FilterValue, label: 'Alle',     icon: '' },
  { value: 1 as FilterValue, label: 'Anfänger', icon: '⭐' },
  { value: 2 as FilterValue, label: 'Mittel',   icon: '⭐⭐' },
  { value: 3 as FilterValue, label: 'Profi',    icon: '⭐⭐⭐' },
];

const GENRE_META: Record<string, { emoji: string; label: string }> = {
  Disney: { emoji: '🏰', label: 'Disney' },
  Pop:    { emoji: '🎵', label: 'Pop' },
  Film:   { emoji: '🎬', label: 'Film' },
  Kinder: { emoji: '🌈', label: 'Kinder' },
};

export function SongSelector({ songs, onSelectSong }: SongSelectorProps) {
  const [filter, setFilter] = useState<FilterValue>(0);
  const { completed } = useProgress();

  const counts = useMemo(() => {
    const c: Record<string | number, number> = {
      0: songs.length,
      1: songs.filter(s => s.difficulty === 1).length,
      2: songs.filter(s => s.difficulty === 2).length,
      3: songs.filter(s => s.difficulty === 3).length,
    };
    for (const song of songs) {
      if (song.category) c[song.category] = ((c[song.category] as number) ?? 0) + 1;
    }
    return c;
  }, [songs]);

  const availableGenres = useMemo(() => {
    const seen = new Set<string>();
    for (const song of songs) if (song.category) seen.add(song.category);
    const order = ['Disney', 'Pop', 'Film', 'Kinder'];
    return order.filter(g => seen.has(g));
  }, [songs]);

  const filtered = useMemo(() => {
    if (filter === 0) return songs;
    if (typeof filter === 'number') return songs.filter(s => s.difficulty === filter);
    return songs.filter(s => s.category === filter);
  }, [songs, filter]);

  const completedCount = useMemo(
    () => songs.filter(s => completed.has(s.id)).length,
    [songs, completed]
  );

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">

      {/* Header */}
      <div
        className="flex-shrink-0 px-4 pt-5 pb-3 border-b border-gray-800/60"
        style={{ background: 'linear-gradient(to bottom, #111827, #030712)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
          >
            🎹
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-tight">Klavier Lernen</h1>
            <p className="text-gray-500 text-xs">
              {songs.length} Lieder
              {completedCount > 0 && (
                <span className="text-emerald-500"> · {completedCount} ✓ geschafft</span>
              )}
            </p>
          </div>
        </div>

        {/* Combined filter tabs: difficulty + genre */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {DIFF_FILTERS.map(({ value, label, icon }) => (
            <button
              key={String(value)}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all active:scale-95 ${
                filter === value
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {icon && <span className="text-xs">{icon}</span>}
              {label}
              <span className={`font-normal ${filter === value ? 'text-gray-500' : 'text-gray-600'}`}>
                {counts[value] ?? 0}
              </span>
            </button>
          ))}

          {/* Separator */}
          {availableGenres.length > 0 && (
            <div className="w-px bg-gray-700 mx-1 rounded-full flex-shrink-0" />
          )}

          {/* Genre filter tabs */}
          {availableGenres.map(genre => {
            const meta = GENRE_META[genre] ?? { emoji: '🎵', label: genre };
            return (
              <button
                key={genre}
                onClick={() => setFilter(genre)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all active:scale-95 ${
                  filter === genre
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>{meta.emoji}</span>
                {meta.label}
                <span className={`font-normal ${filter === genre ? 'text-gray-500' : 'text-gray-600'}`}>
                  {counts[genre] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Song grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(song => (
            <SongCard
              key={song.id}
              song={song}
              onSelect={onSelectSong}
              isCompleted={completed.has(song.id)}
            />
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
