import { useState, useCallback } from 'react';

const COMPLETED_KEY = 'klavier_completed';
const STARS_KEY = 'klavier_stars';

function loadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function loadStars(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STARS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function useProgress() {
  const [completed, setCompleted] = useState<Set<string>>(loadSet);
  const [stars, setStars] = useState<Record<string, number>>(loadStars);

  const markComplete = useCallback((id: string, earnedStars: number) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(COMPLETED_KEY, JSON.stringify([...next]));
      return next;
    });
    setStars(prev => {
      if ((prev[id] ?? 0) >= earnedStars) return prev;
      const next = { ...prev, [id]: earnedStars };
      localStorage.setItem(STARS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { completed, stars, markComplete };
}
