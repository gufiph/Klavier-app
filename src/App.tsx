import { useState, useCallback } from 'react';
import type { Screen } from './types/game';
import type { Song } from './types/music';
import { SONG_REGISTRY } from './data/songs';
import { useProgress } from './hooks/useProgress';
import { SongSelector } from './components/screens/SongSelector';
import { PlayScreen } from './components/screens/PlayScreen';
import { CompletionScreen } from './components/screens/CompletionScreen';
import { CalibrationScreen } from './components/screens/CalibrationScreen';

export default function App() {
  const needsCalib = !localStorage.getItem('klavier_calib_done');
  const [screen, setScreen] = useState<Screen>(needsCalib ? 'calibration' : 'song-selector');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [earnedStars, setEarnedStars] = useState<1 | 2 | 3>(1);
  const [previousBest, setPreviousBest] = useState(0);

  const { stars } = useProgress();

  const handleCalibrationDone = useCallback(() => {
    setScreen('song-selector');
  }, []);

  const handleSelectSong = useCallback((song: Song) => {
    setSelectedSong(song);
    setScreen('play');
  }, []);

  const handleComplete = useCallback((es: 1 | 2 | 3) => {
    if (selectedSong) {
      setPreviousBest(stars[selectedSong.id] ?? 0);
    }
    setEarnedStars(es);
    setScreen('completion');
  }, [selectedSong, stars]);

  const handleBackToSelector = useCallback(() => {
    setSelectedSong(null);
    setScreen('song-selector');
  }, []);

  const handlePlayAgain = useCallback(() => {
    setScreen('play');
  }, []);

  if (screen === 'calibration') {
    return <CalibrationScreen onDone={handleCalibrationDone} />;
  }

  if (screen === 'song-selector') {
    return (
      <SongSelector
        songs={SONG_REGISTRY}
        onSelectSong={handleSelectSong}
        onCalibrate={() => setScreen('calibration')}
      />
    );
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
          earnedStars={earnedStars}
          previousBest={previousBest}
          onPlayAgain={handlePlayAgain}
          onBackToSelector={handleBackToSelector}
        />
      );
    }
  }

  return (
    <SongSelector
      songs={SONG_REGISTRY}
      onSelectSong={handleSelectSong}
      onCalibrate={() => setScreen('calibration')}
    />
  );
}
