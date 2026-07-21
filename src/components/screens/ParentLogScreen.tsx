import type { LogEntry } from '../../hooks/usePracticeLog';

interface ParentLogScreenProps {
  log: LogEntry[];
  onBack: () => void;
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function groupByDay(log: LogEntry[]): Map<string, LogEntry[]> {
  const map = new Map<string, LogEntry[]>();
  for (const entry of log) {
    const day = entry.date.slice(0, 10);
    const existing = map.get(day) ?? [];
    map.set(day, [...existing, entry]);
  }
  return map;
}

const STAR_DISPLAY = ['', '⭐', '⭐⭐', '⭐⭐⭐'];

export function ParentLogScreen({ log, onBack }: ParentLogScreenProps) {
  const grouped = groupByDay(log);
  const totalSongs = log.length;
  const totalDays = grouped.size;
  const avgStars = log.length > 0
    ? (log.reduce((s, e) => s + e.stars, 0) / log.length).toFixed(1)
    : '–';

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-950 text-white">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800 flex-shrink-0">
        <button onClick={onBack} className="text-xl p-1.5 rounded-xl hover:bg-gray-800 transition-colors">◄</button>
        <div>
          <h1 className="text-lg font-black leading-tight">Übungsprotokoll</h1>
          <p className="text-gray-500 text-xs">Für Eltern</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex gap-3 px-4 py-3 border-b border-gray-800/60 flex-shrink-0">
        <div className="flex-1 bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <div className="text-2xl font-black">{totalSongs}</div>
          <div className="text-gray-500 text-xs">Lieder gespielt</div>
        </div>
        <div className="flex-1 bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <div className="text-2xl font-black">{totalDays}</div>
          <div className="text-gray-500 text-xs">Übungstage</div>
        </div>
        <div className="flex-1 bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <div className="text-2xl font-black">{avgStars}</div>
          <div className="text-gray-500 text-xs">Ø Sterne</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {log.length === 0 ? (
          <div className="flex flex-col items-center text-gray-600 py-16 gap-3">
            <span className="text-4xl">📋</span>
            <p className="text-sm">Noch kein Eintrag vorhanden</p>
            <p className="text-xs text-gray-700">Spiele ein Lied, um den ersten Eintrag zu sehen.</p>
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-4">
            {[...grouped.entries()].map(([day, entries]) => (
              <div key={day}>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  {formatDate(entries[0].date)}
                </div>
                <div className="flex flex-col gap-2">
                  {entries.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-gray-900 rounded-xl p-3 border border-gray-800"
                    >
                      <span className="text-2xl flex-shrink-0">{entry.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{entry.title}</div>
                        <div className="text-gray-500 text-xs">{formatTime(entry.date)}</div>
                      </div>
                      <div className="text-sm flex-shrink-0">{STAR_DISPLAY[entry.stars] ?? ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
