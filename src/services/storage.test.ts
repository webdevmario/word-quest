import {
  LEGACY_KEY,
  STORAGE_KEY,
  loadData,
  normalizeData,
  saveData,
} from '@/services/storage';

describe('storage', () => {
  it('starts empty', () => {
    expect(loadData().profiles).toEqual([]);
  });

  it('round-trips saved data', () => {
    const data = normalizeData({ profiles: [{ id: 'a', name: 'Ava' }] });
    saveData(data);
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').profiles[0].name
    ).toBe('Ava');
    expect(loadData().profiles[0]?.name).toBe('Ava');
  });

  it('brings players over from the prototype', () => {
    localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({
        profiles: [
          {
            id: 'old',
            name: 'Leo',
            avatar: '🐸',
            color: '#3A86FF',
            points: 464,
            stats: { wordsFound: 6, puzzlesCompleted: 1 },
            badges: { first_word: 1 },
            prefs: { difficulty: 'hard', theme: 'ocean' },
          },
        ],
        settings: { muted: true },
      })
    );
    const data = loadData();
    const leo = data.profiles[0];
    expect(leo?.points).toBe(464);
    expect(leo?.stats.wordsFound).toBe(6);
    expect(leo?.stats.wormWords).toBe(0);
    expect(leo?.prefs).toEqual({
      mode: 'search',
      difficulty: 'hard',
      theme: 'ocean',
    });
    expect(data.settings.muted).toBe(true);
  });

  it('survives corrupt data', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadData().profiles).toEqual([]);
    expect(normalizeData({ profiles: 'nope' }).profiles).toEqual([]);
  });
});
