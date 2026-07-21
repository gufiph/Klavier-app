import { useState, useMemo, useRef, useCallback } from 'react';
import type { Song } from '../../types/music';
import { SongCard } from '../ui/SongCard';
import { useProgress } from '../../hooks/useProgress';
import { noteToFrequency } from '../../utils/noteUtils';

interface SongSelectorProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
  onCalibrate?: () => void;
  onProfiles?: () => void;
  onQuiz?: () => void;
  onRecord?: () => void;
  onParentLog?: () => void;
  activeProfile?: { name: string; avatar: string };
  streak?: number;
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

interface Badge { id: string; emoji: string; label: string }

function computeBadges(completed: Set<string>, stars: Record<string,number>, streak: number, songs: Song[]): Badge[] {
  const badges: Badge[] = [];
  if (completed.size >= 1) badges.push({ id: 'first', emoji: '🌟', label: 'Erstes Lied' });
  if (completed.size >= 5) badges.push({ id: 'five', emoji: '🎵', label: '5 Lieder' });
  if (completed.size >= 10) badges.push({ id: 'ten', emoji: '🎼', label: '10 Lieder' });
  if (completed.size >= 25) badges.push({ id: 'twenty-five', emoji: '🏆', label: '25 Lieder' });
  if (streak >= 3) badges.push({ id: 'streak3', emoji: '🔥', label: '3 Tage' });
  if (streak >= 7) badges.push({ id: 'streak7', emoji: '💎', label: '7 Tage' });
  if (Object.values(stars).some(s => s === 3)) badges.push({ id: 'perfect', emoji: '⭐', label: 'Perfekt' });
  const beginnerIds = songs.filter(s => s.difficulty === 1).map(s => s.id);
  if (beginnerIds.length > 0 && beginnerIds.every(id => (stars[id] ?? 0) >= 3))
    badges.push({ id: 'all-beginner', emoji: '🥇', label: 'Alle Anfänger' });
  return badges;
}

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
    setTimeout(() => ctx.close(), (t - ctx.currentTime + 0.3) * 1000);
    return ctx;
  } catch {
    return null;
  }
}

export function SongSelector({
  songs, onSelectSong, onCalibrate, onProfiles, onQuiz, onRecord, onParentLog,
  activeProfile, streak = 0,
}: SongSelectorProps) {
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
    if (previewingId === song.id) { stopPreview(); return; }
    stopPreview();
    previewCtxRef.current = playPreviewAudio(song);
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

  const completedCount = useMemo(() => songs.filter(s => completed.has(s.id)).length, [songs, completed]);
  const badges = useMemo(() => computeBadges(completed, stars, streak, songs), [completed, stars, streak, songs]);

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-950 text-white">

      {/* Header */}
      <div
        className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-800/60"
        style={{ background: 'linear-gradient(to bottom, #111827, #030712)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          {/* Profile button */}
          <button
            onClick={onProfiles}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-lg flex-shrink-0 transition-transform active:scale-95 border border-purple-800/60"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
          >
            {activeProfile?.avatar ?? '🎹'}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight leading-tight">
                {activeProfile?.name ?? 'Klavier Lernen'}
              </h1>
              {streak > 0 && (
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                  🔥 {streak}
                </div>
              )}
            </div>
            <p className="text-gray-500 text-xs">
              {songs.length} Lieder
              {completedCount > 0 && <span className="text-emerald-500"> · {completedCount} ✓</span>}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1.5 flex-shrink-0">
            {onQuiz && (
              <button onClick={onQuiz} title="Noten-Quiz"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors">
                🎓
              </button>
            )}
            {onRecord && (
              <button onClick={onRecord} title="Lied aufnehmen"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors">
                🎤
              </button>
            )}
            {onParentLog && (
              <button onClick={onParentLog} title="Übungsprotokoll"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors">
                📋
              </button>
            )}
            {onCalibrate && (
              <button onClick={onCalibrate} title="Kalibrierung"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors">
                ⚙️
              </button>
            )}
          </div>
        </div>

        {/* Badges row */}
        {badges.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none mb-2">
            {badges.map(b => (
              <div key={b.id}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
                style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa' }}>
                <span>{b.emoji}</span>
                {b.label}
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {DIFF_FILTERS.map(({ value, label, icon }) => (
            <button
              key={String(value)}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all active:scale-95 ${
                filter === value ? 'bg-white text-gray-900 shadow-md' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {icon && <span className="text-xs">{icon}</span>}
              {label}
              <span className={`font-normal ${filter === value ? 'text-gray-500' : 'text-gray-600'}`}>
                {counts[value] ?? 0}
              </span>
            </button>
          ))}

          {availableGenres.length > 0 && <div className="w-px bg-gray-700 mx-1 rounded-full flex-shrink-0" />}

          {availableGenres.map(genre => {
            const meta = GENRE_META[genre] ?? { emoji: '🎵', label: genre };
            return (
              <button
                key={genre}
                onClick={() => setFilter(genre)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all active:scale-95 ${
                  filter === genre ? 'bg-white text-gray-900 shadow-md' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
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
              onSelect={s => { stopPreview(); onSelectSong(s); }}
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
        <p className="text-center text-gray-700 text-xs py-4 pb-6">{filtered.length} Lieder</p>
      </div>
    </div>
  );
}
