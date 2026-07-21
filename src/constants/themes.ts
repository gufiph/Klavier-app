export interface Theme {
  id: string;
  name: string;
  emoji: string;
  bg: string;
  surface: string;
  border: string;
  accent: string;
}

export const THEMES: Theme[] = [
  { id: 'dark',       name: 'Dunkel',      emoji: '🌙', bg: '#030712', surface: '#111827', border: '#1f2937', accent: '#7c3aed' },
  { id: 'space',      name: 'Weltall',     emoji: '🚀', bg: '#050010', surface: '#0d0a2e', border: '#1a1560', accent: '#818cf8' },
  { id: 'underwater', name: 'Unterwasser', emoji: '🌊', bg: '#001525', surface: '#002040', border: '#003860', accent: '#06b6d4' },
  { id: 'jungle',     name: 'Dschungel',   emoji: '🌿', bg: '#0a160a', surface: '#112b11', border: '#1a3d1a', accent: '#4ade80' },
];

export const DEFAULT_THEME_ID = 'dark';

export type OscType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface Timbre {
  id: string;
  name: string;
  emoji: string;
  oscType: OscType;
  attack: number;
  release: number;
}

export const TIMBRES: Timbre[] = [
  { id: 'piano',     name: 'Klavier',   emoji: '🎹', oscType: 'triangle', attack: 0.01,  release: 0.4  },
  { id: 'organ',     name: 'Orgel',     emoji: '⛪',  oscType: 'sine',     attack: 0.02,  release: 0.05 },
  { id: 'xylophone', name: 'Xylofon',   emoji: '🪘',  oscType: 'square',   attack: 0.005, release: 0.15 },
  { id: 'strings',   name: 'Streicher', emoji: '🎻',  oscType: 'sawtooth', attack: 0.12,  release: 0.3  },
];

export const DEFAULT_TIMBRE_ID = 'piano';
