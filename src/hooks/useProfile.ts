import { useState, useCallback } from 'react';

export interface Profile {
  id: string;
  name: string;
  avatar: string;
}

export const PROFILE_AVATARS = ['🐱','🐶','🐸','🦊','🦋','🐼','🦄','🐙','🦁','🐯','🐮','🐷'];
export const GUEST_PROFILE: Profile = { id: 'guest', name: 'Gast', avatar: '🎹' };

const PROFILES_KEY = 'klavier_profiles';
const ACTIVE_KEY = 'klavier_active_profile';

function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function useProfile() {
  const [profiles, setProfilesState] = useState<Profile[]>(loadProfiles);
  const [activeId, setActiveIdState] = useState<string>(
    () => localStorage.getItem(ACTIVE_KEY) ?? 'guest'
  );

  const activeProfile = profiles.find(p => p.id === activeId) ?? GUEST_PROFILE;

  const setActive = useCallback((id: string) => {
    localStorage.setItem(ACTIVE_KEY, id);
    setActiveIdState(id);
  }, []);

  const createProfile = useCallback((name: string, avatar: string): Profile => {
    const id = `p_${Date.now()}`;
    const profile: Profile = { id, name: name.trim() || 'Kind', avatar };
    setProfilesState(prev => {
      const next = [...prev, profile];
      localStorage.setItem(PROFILES_KEY, JSON.stringify(next));
      return next;
    });
    return profile;
  }, []);

  const deleteProfile = useCallback((id: string) => {
    // Remove all profile-specific data
    Object.keys(localStorage)
      .filter(k => k.endsWith(`_${id}`))
      .forEach(k => localStorage.removeItem(k));

    setProfilesState(prev => {
      const next = prev.filter(p => p.id !== id);
      localStorage.setItem(PROFILES_KEY, JSON.stringify(next));
      return next;
    });

    setActiveIdState(prev => {
      if (prev === id) {
        localStorage.setItem(ACTIVE_KEY, 'guest');
        return 'guest';
      }
      return prev;
    });
  }, []);

  return { profiles, activeId, activeProfile, setActive, createProfile, deleteProfile };
}
