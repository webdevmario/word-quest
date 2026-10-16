// Puzzle generator: places theme words in a grid and fills the gaps.
(function (WS) {
  'use strict';

  const FILLER = 'EEEEEEAAAARRRIIIOOOTTTNNNSSSLLCCUUDDPPMMHHGBFYWKV';

  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rand(arr.length)];
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function wordValue(text, mult) {
    let sum = 0;
    for (const ch of text) sum += WS.LETTER_VALUES[ch] || 1;
    return Math.round(sum * WS.SCORING.perLetterPoint * mult);
  }

  // Words that contain each other (CAKE / PANCAKE) would be confusing in one puzzle.
  const conflicts = (a, b) => a.includes(b) || b.includes(a);

  function tryPlace(grid, text, dirs) {
    const n = grid.length;
    const L = text.length;
    const options = [];
    for (const key of dirs) {
      const [dr, dc] = WS.DIRS[key];
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const er = r + dr * (L - 1);
          const ec = c + dc * (L - 1);
          if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
          let ok = true;
          let overlap = 0;
          for (let i = 0; i < L; i++) {
            const cell = grid[r + dr * i][c + dc * i];
            if (cell === null) continue;
            if (cell !== text[i]) { ok = false; break; }
            overlap++;
          }
          if (ok && overlap < L) options.push({ r, c, dr, dc, overlap });
        }
      }
    }
    if (!options.length) return null;
    const crossing = options.filter((o) => o.overlap > 0);
    const o = crossing.length && Math.random() < 0.35 ? pick(crossing) : pick(options);
    const cells = [];
    for (let i = 0; i < L; i++) {
      const r = o.r + o.dr * i;
      const c = o.c + o.dc * i;
      grid[r][c] = text[i];
      cells.push([r, c]);
    }
    return { text, cells, dir: [o.dr, o.dc] };
  }

  function build(pool, d) {
    const n = d.size;
    const grid = Array.from({ length: n }, () => Array(n).fill(null));
    const candidates = shuffle(
      pool.filter((w) => w.length >= d.minLen && w.length <= Math.min(d.maxLen, n))
    );

    // Pick the target set first so the mix of word lengths stays random...
    const chosen = [];
    const rest = [];
    for (const w of candidates) {
      if (chosen.length < d.count && !chosen.some((c) => conflicts(c, w))) chosen.push(w);
      else rest.push(w);
    }
    // ...then place longest first, swapping in spares if one won't fit.
    chosen.sort((a, b) => b.length - a.length);
    const placed = [];
    const used = () => placed.map((p) => p.text);
    for (const w of chosen) {
      let spot = tryPlace(grid, w, d.dirs);
      while (!spot && rest.length) {
        const i = rest.findIndex((x) => !used().some((u) => conflicts(u, x)) && !chosen.includes(x));
        if (i < 0) break;
        spot = tryPlace(grid, rest.splice(i, 1)[0], d.dirs);
      }
      if (spot) placed.push(spot);
    }
    return { grid, placed };
  }

  WS.generatePuzzle = function (themeKey, diffKey) {
    const d = WS.DIFFICULTIES[diffKey] || WS.DIFFICULTIES.easy;
    const pool = themeKey === 'mix' || !WS.THEMES[themeKey]
      ? [...new Set(Object.values(WS.THEMES).flatMap((t) => t.words))]
      : WS.THEMES[themeKey].words;

    let best = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      const res = build(pool, d);
      if (!best || res.placed.length > best.placed.length) best = res;
      if (best.placed.length >= d.count) break;
    }

    // Expert mixes in letters from the hidden words to create near-miss decoys.
    const wordLetters = best.placed.map((p) => p.text).join('');
    const grid = best.grid.map((row) => row.map((ch) => {
      if (ch) return ch;
      return d.decoys && Math.random() < 0.55 ? pick(wordLetters) : pick(FILLER);
    }));

    const words = best.placed.map((p) => ({
      ...p, found: false, hinted: false, golden: false, value: wordValue(p.text, d.mult),
    }));
    const golden = pick(words);
    golden.golden = true;
    golden.value *= WS.SCORING.goldenMultiplier;
    words.sort((a, b) => a.text.localeCompare(b.text));

    return {
      size: d.size, grid, words, difficulty: d.key,
      theme: WS.THEMES[themeKey] ? themeKey : 'mix', mult: d.mult,
    };
  };
})(window.WS);
