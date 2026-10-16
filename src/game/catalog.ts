import { BUILT_IN_THEMES, MIX_THEME, MIX_THEME_ID } from '@/game/themes';
import type { Theme } from '@/game/types';

/** Built-in themes followed by the family's own lists. */
export function allThemes(custom: Theme[]): Theme[] {
  return [...BUILT_IN_THEMES, ...custom.filter((t) => t.words.length >= 2)];
}

export function themeInfo(id: string, custom: Theme[]) {
  if (id === MIX_THEME_ID) {
    return MIX_THEME;
  }
  return (
    allThemes(custom).find((t) => t.id === id) ?? (BUILT_IN_THEMES[0] as Theme)
  );
}

/** Words for a theme. The mix draws from every built-in theme. */
export function themeWords(id: string, custom: Theme[]): string[] {
  if (id === MIX_THEME_ID) {
    return [...new Set(BUILT_IN_THEMES.flatMap((t) => t.words))];
  }
  return (
    (allThemes(custom).find((t) => t.id === id) ?? BUILT_IN_THEMES[0])?.words ??
    []
  );
}
