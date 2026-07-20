import { beginnerSongs } from './beginner';
import { beginner2Songs } from './beginner2';
import { intermediateSongs } from './intermediate';
import { intermediate2Songs } from './intermediate2';
import { advancedSongs } from './advanced';
import { advanced2Songs } from './advanced2';
import { extraSongs } from './extra';
import type { Song } from '../../types/music';

export const SONG_REGISTRY: Song[] = [
  ...beginnerSongs,
  ...beginner2Songs,
  ...intermediateSongs,
  ...intermediate2Songs,
  ...advancedSongs,
  ...advanced2Songs,
  ...extraSongs,
];

export { beginnerSongs, beginner2Songs, intermediateSongs, intermediate2Songs, advancedSongs, advanced2Songs, extraSongs };
