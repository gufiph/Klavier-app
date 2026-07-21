import { useState, useMemo, useRef, useCallback } from 'react';
import type { Song } from '../../types/music';
import { SongCard } from '../ui/SongCard';
import { useProgress } from '../../hooks/useProgress';
import { noteToFrequency } from '../../utils/noteUtils';

interface SongSelectorProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
  onCalibrate?: () => void;
}

type FilterValue = 0 | 1 | 2 | 3 | string;

const DIFF_FILTERS = [
  { value: 0 as FilterValue, label: 'Alle',     icon: '' },
  { value: 1 as FilterValue, label: 'Anfänger', icon: '⭐' },
  { value: 2 as FilterValue, label: 'Mittel',   icon: '⭐⭐' },
  { value: 3 as FilterValue, label: 'Profi',    icon: '⭐⭐⭐' },
];

const GENRE_META: Record<string, { emoji: string; label: string }> = {
  Disney:      { emoji: '🏰', label: 'Disney' },
  Pop:         { emoji: '🎵', label: 'Pop' },
  Film:        { emoji: '🎬', label: 'Film' },
  Kinder:      { emoji: '🌈', label: 'Kinder' },
  Weihnachten: { emoji: '🎄', label: 'Weihnachten' },
};

const GENRE_ORDER = ['Disney', 'Pop', 'Film', 'Kinder', 'Weihnachten'];

function playPreviewAudio(song: Song): AudioContext | null {
  try {
    const ctx = new AudioContext();
    const nonRestNotes = song.notes.filter(n => !n.rest).slice(0, 8);
    const beatSec = 60 / (song.tempo * 1.5);
    let t = ctx.currentTime + 0.05;
    for (const note of nonRestNotes) {
      const freq = noteToFrequency(note.note);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const dur = beatSec * (note.duration === 'whole' ? 4 : note.duration === 'half' ? 2 : note.duration === 'eighth' ? 0.5 : 1);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur * 0.85);
      t += dur;
    }
    // Auto-close after preview ends
    setTimeout(() => ctx.close(), (t - ctx.currentTime + 0.3) * 1000);
    return ctx;
  } catch {
    return null;
  }
}

export function SongSelector({ songs, onSelectSong, onCalibrate }: SongSelectorProps) {
  const [filter, setFilter] = useState<FilterValue>(0);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const previewCtxRef = useRef<AudioContext | null>(null);
  const { completed, stars } = useProgress();

  const stopPreview = useCallback(() => {
    previewCtxRef.current?.close();
    previewCtxRef.current = null;
    setPreviewingId(null);
  }, []);

  const handlePreview = useCallback((song: Song) => {
    if (previewingId === song.id) {
      stopPreview();
      return;
    }
    stopPreview();
    const ctx = playPreviewAudio(song);
    previewCtxRef.current = ctx;
    setPreviewingId(song.id);
  }, [previewingId, stopPreview]);

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
    return GENRE_ORDER.filter(g => seen.has(g));
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
    <div className="flex flex-col h-[100dvh] bg-gray-950 text-white">

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
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black tracking-tight leading-tight">Klavier Lernen</h1>
            <p className="text-gray-500 text-xs">
              {songs.length} Lieder
              {completedCount > 0 && (
                <span className="text-emerald-500"> · {completedCount} ✓ geschafft</span>
              )}
            </p>
          </div>
          {onCalibrate && (
            <button
              onClick={onCalibrate}
              title="Klang kalibrieren"
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
            >
              ⚙️
            </button>
          )}
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

          {availableGenres.length > 0 && (
            <div className="w-px bg-gray-700 mx-1 rounded-full flex-shrink-0" />
          )}

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
              onSelect={song => { stopPreview(); onSelectSong(song); }}
              isCompleted={completed.has(song.id)}
              earnedStars={stars[song.id] ?? 0}
              onPreview={handlePreview}
              isPreviewing={previewingId === song.id}
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
