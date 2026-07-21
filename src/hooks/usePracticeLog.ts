import { useState, useCallback } from 'react';
import { useActiveProfileId } from '../contexts/ProfileContext';

export interface LogEntry {
  songId: string;
  title: string;
  emoji: string;
  date: string;
  stars: number;
}

const MAX_ENTRIES = 60;

function loadLog(key: string): LogEntry[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function usePracticeLog() {
  const profileId = useActiveProfileId();
  const key = `klavier_log_${profileId}`;

  const [log, setLog] = useState<LogEntry[]>(() => loadLog(key));

  const addEntry = useCallback((entry: Omit<LogEntry, 'date'>) => {
    setLog(prev => {
      const next = [{ ...entry, date: new Date().toISOString() }, ...prev].slice(0, MAX_ENTRIES);
      localStorage.setItem(`klavier_log_${profileId}`, JSON.stringify(next));
      return next;
    });
  }, [profileId]);

  return { log, addEntry };
}
