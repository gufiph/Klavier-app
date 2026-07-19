import { beginnerSongs } from './beginner';
import { intermediateSongs } from './intermediate';
import { advancedSongs } from './advanced';
import type { Song } from '../../types/music';

export const SONG_REGISTRY: Song[] = [
  ...beginnerSongs,
  ...intermediateSongs,
  ...advancedSongs,
];

export { beginnerSongs, intermediateSongs, advancedSongs };
