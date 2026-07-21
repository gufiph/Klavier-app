import { useState, useCallback } from 'react';
import { useActiveProfileId } from '../contexts/ProfileContext';

function getKeys(profileId: string) {
  return {
    completed: `klavier_completed_${profileId}`,
    stars: `klavier_stars_${profileId}`,
  };
}

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function loadStars(key: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function useProgress() {
  const profileId = useActiveProfileId();
  const keys = getKeys(profileId);

  const [completed, setCompleted] = useState<Set<string>>(() => loadSet(keys.completed));
  const [stars, setStars] = useState<Record<string, number>>(() => loadStars(keys.stars));

  // Re-load when profile changes (key changes between renders triggers new init)
  // We use a key trick: reset state when profileId changes
  const [lastProfileId, setLastProfileId] = useState(profileId);
  if (lastProfileId !== profileId) {
    setLastProfileId(profileId);
    const newKeys = getKeys(profileId);
    setCompleted(loadSet(newKeys.completed));
    setStars(loadStars(newKeys.stars));
  }

  const markComplete = useCallback((id: string, earnedStars: number) => {
    const k = getKeys(profileId);
    setCompleted(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(k.completed, JSON.stringify([...next]));
      return next;
    });
    setStars(prev => {
      if ((prev[id] ?? 0) >= earnedStars) return prev;
      const next = { ...prev, [id]: earnedStars };
      localStorage.setItem(k.stars, JSON.stringify(next));
      return next;
    });
  }, [profileId]);

  return { completed, stars, markComplete };
}
