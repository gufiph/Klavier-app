import { useState } from 'react';
import type { Profile } from '../../hooks/useProfile';
import { PROFILE_AVATARS, GUEST_PROFILE } from '../../hooks/useProfile';

interface ProfileScreenProps {
  profiles: Profile[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string, avatar: string) => Profile;
  onDelete: (id: string) => void;
  onDone: () => void;
}

const MAX_PROFILES = 4;

export function ProfileScreen({ profiles, activeId, onSelect, onCreate, onDelete, onDone }: ProfileScreenProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(PROFILE_AVATARS[0]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const allProfiles = [GUEST_PROFILE, ...profiles];

  const handleCreate = () => {
    const profile = onCreate(name, avatar);
    onSelect(profile.id);
    setCreating(false);
    setName('');
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800 flex-shrink-0">
        <button
          onClick={onDone}
          className="text-xl p-1.5 rounded-xl hover:bg-gray-800 transition-colors"
        >
          ◄
        </button>
        <h1 className="text-lg font-black">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-gray-500 text-xs mb-4">Wähle ein Profil oder erstelle eines für jedes Kind.</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {allProfiles.map(profile => {
            const isActive = profile.id === activeId;
            return (
              <button
                key={profile.id}
                onClick={() => { onSelect(profile.id); onDone(); }}
                onContextMenu={e => { e.preventDefault(); if (profile.id !== 'guest') setDeleteTarget(profile.id); }}
                className="relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95"
                style={{
                  borderColor: isActive ? '#7c3aed' : '#374151',
                  background: isActive ? 'rgba(124,58,237,0.15)' : 'rgba(17,24,39,0.8)',
                }}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-xs">✓</div>
                )}
                <span className="text-4xl">{profile.avatar}</span>
                <span className="font-bold text-sm">{profile.name}</span>
                {profile.id !== 'guest' && (
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteTarget(profile.id); }}
                    className="absolute top-2 left-2 w-5 h-5 rounded-full bg-gray-700 text-gray-400 text-xs flex items-center justify-center hover:bg-red-800 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                )}
              </button>
            );
          })}

          {profiles.length < MAX_PROFILES && !creating && (
            <button
              onClick={() => setCreating(true)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-dashed border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors active:scale-95"
            >
              <span className="text-4xl">➕</span>
              <span className="font-bold text-sm">Neues Profil</span>
            </button>
          )}
        </div>

        {/* Create form */}
        {creating && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700 flex flex-col gap-4">
            <h2 className="font-black text-base">Neues Profil</h2>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name eingeben…"
              maxLength={16}
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-purple-500"
              autoFocus
            />
            <div>
              <p className="text-gray-500 text-xs mb-2">Avatar wählen:</p>
              <div className="flex flex-wrap gap-2">
                {PROFILE_AVATARS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className="text-2xl rounded-xl p-1.5 transition-all"
                    style={{
                      background: avatar === a ? 'rgba(124,58,237,0.4)' : 'transparent',
                      outline: avatar === a ? '2px solid #7c3aed' : 'none',
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="flex-1 py-2.5 rounded-xl font-black text-sm text-white disabled:opacity-40 transition-all"
                style={{ background: 'linear-gradient(to bottom, #7c3aed, #4f27a8)' }}
              >
                Erstellen
              </button>
              <button
                onClick={() => { setCreating(false); setName(''); }}
                className="flex-1 py-2.5 rounded-xl font-black text-sm bg-gray-800 border border-gray-700"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="absolute inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-gray-900 rounded-2xl p-6 mx-6 border border-gray-700 flex flex-col gap-4">
            <h2 className="font-black text-lg text-center">Profil löschen?</h2>
            <p className="text-gray-400 text-sm text-center">Alle Fortschritte dieses Profils gehen verloren.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { onDelete(deleteTarget); setDeleteTarget(null); }}
                className="flex-1 py-3 rounded-xl font-black text-sm bg-red-900 border border-red-700 text-white"
              >
                Löschen
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-xl font-black text-sm bg-gray-800 border border-gray-700"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
