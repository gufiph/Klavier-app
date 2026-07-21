import { createContext, useContext } from 'react';
import type { Profile } from '../hooks/useProfile';
import { GUEST_PROFILE } from '../hooks/useProfile';

interface ProfileContextValue {
  activeId: string;
  activeProfile: Profile;
  profiles: Profile[];
  setActive: (id: string) => void;
  createProfile: (name: string, avatar: string) => Profile;
  deleteProfile: (id: string) => void;
}

const noop = () => { throw new Error('ProfileContext not provided'); };

export const ProfileContext = createContext<ProfileContextValue>({
  activeId: 'guest',
  activeProfile: GUEST_PROFILE,
  profiles: [],
  setActive: noop,
  createProfile: noop as unknown as ProfileContextValue['createProfile'],
  deleteProfile: noop,
});

export const useActiveProfileId = () => useContext(ProfileContext).activeId;
export const useProfileContext = () => useContext(ProfileContext);
