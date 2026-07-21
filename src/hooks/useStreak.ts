import { useState, useCallback } from 'react';
import { useActiveProfileId } from '../contexts/ProfileContext';

interface StreakData {
  count: number;
  lastDate: string;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function loadStreak(key: string): StreakData {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : { count: 0, lastDate: '' };
  } catch { return { count: 0, lastDate: '' }; }
}

export function useStreak() {
  const profileId = useActiveProfileId();
  const key = `klavier_streak_${profileId}`;

  const [streak, setStreak] = useState<StreakData>(() => loadStreak(key));

  const incrementStreak = useCallback(() => {
    const today = todayStr();
    setStreak(prev => {
      if (prev.lastDate === today) return prev; // Already incremented today
      const newCount = prev.lastDate === yesterdayStr() ? prev.count + 1 : 1;
      const next: StreakData = { count: newCount, lastDate: today };
      localStorage.setItem(`klavier_streak_${profileId}`, JSON.stringify(next));
      return next;
    });
  }, [profileId]);

  // Current effective streak (0 if last play was before yesterday)
  const today = todayStr();
  const yesterday = yesterdayStr();
  const effectiveStreak =
    streak.lastDate === today || streak.lastDate === yesterday ? streak.count : 0;

  return { streak: effectiveStreak, rawStreak: streak, incrementStreak };
}
