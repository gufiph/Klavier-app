import { useState, useCallback } from 'react';
import type { Screen } from './types/game';
import type { Song } from './types/music';
import { SONG_REGISTRY } from './data/songs';
import { SongSelector } from './components/screens/SongSelector';
import { PlayScreen } from './components/screens/PlayScreen';
import { CompletionScreen } from './components/screens/CompletionScreen';

export default function App() {
  const [screen, setScreen] = useState<Screen>('song-selector');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const handleSelectSong = useCallback((song: Song) => {
    setSelectedSong(song);
    setScreen('play');
  }, []);

  const handleComplete = useCallback(() => {
    setScreen('completion');
  }, []);

  const handleBackToSelector = useCallback(() => {
    setSelectedSong(null);
    setScreen('song-selector');
  }, []);

  const handlePlayAgain = useCallback(() => {
    setScreen('play');
  }, []);

  if (screen === 'song-selector') {
    return <SongSelector songs={SONG_REGISTRY} onSelectSong={handleSelectSong} />;
  }

  if (selectedSong) {
    if (screen === 'play') {
      return (
        <PlayScreen
          song={selectedSong}
          onBack={handleBackToSelector}
          onComplete={handleComplete}
        />
      );
    }
    if (screen === 'completion') {
      return (
        <CompletionScreen
          song={selectedSong}
          onPlayAgain={handlePlayAgain}
          onBackToSelector={handleBackToSelector}
        />
      );
    }
  }

  return <SongSelector songs={SONG_REGISTRY} onSelectSong={handleSelectSong} />;
}
