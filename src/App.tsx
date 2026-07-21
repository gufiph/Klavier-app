import { useState, useCallback } from 'react';
import type { Screen } from './types/game';
import type { Song } from './types/music';
import { SONG_REGISTRY } from './data/songs';
import { ProfileContext, useProfileContext } from './contexts/ProfileContext';
import { useProfile } from './hooks/useProfile';
import { useProgress } from './hooks/useProgress';
import { useStreak } from './hooks/useStreak';
import { usePracticeLog } from './hooks/usePracticeLog';
import { useTheme } from './hooks/useTheme';
import { SongSelector } from './components/screens/SongSelector';
import { PlayScreen } from './components/screens/PlayScreen';
import { CompletionScreen } from './components/screens/CompletionScreen';
import { CalibrationScreen } from './components/screens/CalibrationScreen';
import { OnboardingScreen } from './components/screens/OnboardingScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { NoteQuizScreen } from './components/screens/NoteQuizScreen';
import { RecordScreen } from './components/screens/RecordScreen';
import { ParentLogScreen } from './components/screens/ParentLogScreen';
import { FreePlayScreen } from './components/screens/FreePlayScreen';
import { RhythmScreen } from './components/screens/RhythmScreen';

function AppInner() {
  const needsOnboarding = !localStorage.getItem('klavier_onboarding_done');
  const needsCalib = !localStorage.getItem('klavier_calib_done');
  const initialScreen: Screen = needsOnboarding ? 'onboarding' : needsCalib ? 'calibration' : 'song-selector';

  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [earnedStars, setEarnedStars] = useState<1 | 2 | 3>(1);
  const [previousBest, setPreviousBest] = useState(0);

  const { profiles, activeId, activeProfile, setActive, createProfile, deleteProfile } = useProfileContext();
  const { stars } = useProgress();
  const { streak, incrementStreak } = useStreak();
  const { log, addEntry } = usePracticeLog();
  const { theme, timbre, setTheme, setTimbre } = useTheme();

  const handleOnboardingDone = useCallback(() => {
    localStorage.setItem('klavier_onboarding_done', '1');
    setScreen('calibration');
  }, []);

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
      addEntry({ songId: selectedSong.id, title: selectedSong.title, emoji: selectedSong.coverEmoji, stars: es });
    }
    incrementStreak();
    setEarnedStars(es);
    setScreen('completion');
  }, [selectedSong, stars, addEntry, incrementStreak]);

  const handleBackToSelector = useCallback(() => {
    setSelectedSong(null);
    setScreen('song-selector');
  }, []);

  const handlePlayAgain = useCallback(() => {
    setScreen('play');
  }, []);

  const selectorProps = {
    songs: SONG_REGISTRY,
    onSelectSong: handleSelectSong,
    onCalibrate: () => setScreen('calibration'),
    onProfiles: () => setScreen('profiles'),
    onQuiz: () => setScreen('quiz'),
    onRecord: () => setScreen('record'),
    onParentLog: () => setScreen('parent-log'),
    onFreePlay: () => setScreen('free-play'),
    onRhythm: () => setScreen('rhythm'),
    activeProfile,
    streak,
    theme,
    timbre,
    onSetTheme: setTheme,
    onSetTimbre: setTimbre,
  };

  if (screen === 'onboarding') return <OnboardingScreen onDone={handleOnboardingDone} />;
  if (screen === 'calibration') return <CalibrationScreen onDone={handleCalibrationDone} />;

  if (screen === 'profiles') {
    return (
      <ProfileScreen
        profiles={profiles}
        activeId={activeId}
        onSelect={id => { setActive(id); setScreen('song-selector'); }}
        onCreate={createProfile}
        onDelete={deleteProfile}
        onDone={() => setScreen('song-selector')}
      />
    );
  }

  if (screen === 'quiz') return <NoteQuizScreen onBack={() => setScreen('song-selector')} />;
  if (screen === 'record') return <RecordScreen onBack={() => setScreen('song-selector')} />;
  if (screen === 'parent-log') return <ParentLogScreen log={log} onBack={() => setScreen('song-selector')} />;
  if (screen === 'free-play') return <FreePlayScreen onBack={() => setScreen('song-selector')} />;
  if (screen === 'rhythm') return <RhythmScreen onBack={() => setScreen('song-selector')} />;
  if (screen === 'song-selector') return <SongSelector {...selectorProps} />;

  if (selectedSong) {
    if (screen === 'play') {
      return <PlayScreen song={selectedSong} onBack={handleBackToSelector} onComplete={handleComplete} />;
    }
    if (screen === 'completion') {
      return (
        <CompletionScreen
          song={selectedSong}
          earnedStars={earnedStars}
          previousBest={previousBest}
          streak={streak}
          onPlayAgain={handlePlayAgain}
          onBackToSelector={handleBackToSelector}
        />
      );
    }
  }

  return <SongSelector {...selectorProps} />;
}

export default function App() {
  const profileData = useProfile();
  return (
    <ProfileContext.Provider value={profileData}>
      <AppInner />
    </ProfileContext.Provider>
  );
}
