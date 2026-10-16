/** Buddies a player can pick for their book cover. */
export const AVATARS = [
  '🦊', '🐼', '🐯', '🦄', '🐸', '🐙', '🦖', '🐶', '🐱', '🐵',
  '🦁', '🐧', '🐨', '🦉', '🐬', '🐲', '🚀', '⚽', '🌈', '🎸',
]; // prettier-ignore

/** Book-cover colors. All are dark enough for parchment and gilt text. */
export const COVERS = [
  { id: 'emerald', name: 'Emerald', color: '#1F7A55' },
  { id: 'ruby', name: 'Ruby', color: '#A8323E' },
  { id: 'sapphire', name: 'Sapphire', color: '#2B5A9E' },
  { id: 'amethyst', name: 'Amethyst', color: '#6B3FA0' },
  { id: 'amber', name: 'Amber', color: '#A8661A' },
  { id: 'teal', name: 'Teal', color: '#1C7C83' },
  { id: 'plum', name: 'Plum', color: '#8A2F6B' },
  { id: 'slate', name: 'Slate', color: '#3E5566' },
] as const;

/** Bright jewel tints for words found in Word Search. */
export const FOUND_COLORS = [
  '#2eb872', '#3a7bd5', '#d6455b', '#9b5de5', '#e0902a', '#1fa5a5', '#c2507f', '#5c8a3a',
]; // prettier-ignore

export const GOLDEN_COLOR = '#e2b04a';

export const GEM_COLORS = {
  emerald: '#2eb872',
  amber: '#f0a830',
  sapphire: '#3a7bd5',
  diamond: '#bfe6ff',
  crystal: '#e6d4ff',
} as const;
