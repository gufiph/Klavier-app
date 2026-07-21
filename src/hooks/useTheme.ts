import { useState, useLayoutEffect } from 'react';
import { THEMES, TIMBRES, DEFAULT_THEME_ID, DEFAULT_TIMBRE_ID, type Theme, type Timbre } from '../constants/themes';

const THEME_KEY = 'klavier_theme';
const TIMBRE_KEY = 'klavier_timbre';

export function useTheme() {
  const [themeId, setThemeIdState] = useState<string>(() => localStorage.getItem(THEME_KEY) ?? DEFAULT_THEME_ID);
  const [timbreId, setTimbreIdState] = useState<string>(() => localStorage.getItem(TIMBRE_KEY) ?? DEFAULT_TIMBRE_ID);

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId);
  }, [themeId]);

  const setTheme = (id: string) => {
    localStorage.setItem(THEME_KEY, id);
    setThemeIdState(id);
  };

  const setTimbre = (id: string) => {
    localStorage.setItem(TIMBRE_KEY, id);
    setTimbreIdState(id);
  };

  const theme: Theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];
  const timbre: Timbre = TIMBRES.find(t => t.id === timbreId) ?? TIMBRES[0];

  return { theme, themeId, timbre, timbreId, setTheme, setTimbre };
}
