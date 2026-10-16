import { parseWordList, parseWordSet } from '@/features/parent/parseWordList';

describe('parseWordList', () => {
  it('reads words with optional meanings', () => {
    const { entries, problems } = parseWordList(
      'planet - a big ball that goes around a star\nComet: an icy space rock\n\nmoon\nmoon'
    );
    expect(entries).toEqual([
      { word: 'PLANET', definition: 'a big ball that goes around a star' },
      { word: 'COMET', definition: 'an icy space rock' },
      { word: 'MOON', definition: null },
    ]);
    expect(problems).toEqual([]);
  });

  it('explains lines it cannot use', () => {
    const { problems } = parseWordList('ice cream\nab\nsupercalifragilistic');
    expect(problems.map((p) => p.reason)).toEqual([
      'Use letters only, one word per line',
      'Words need 3 to 12 letters',
      'Words need 3 to 12 letters',
    ]);
  });
});

describe('parseWordSet', () => {
  it('splits on commas, spaces and lines', () => {
    expect(parseWordSet('grandma, Nana\npopo  nana')).toEqual([
      'GRANDMA',
      'NANA',
      'POPO',
    ]);
  });
});
