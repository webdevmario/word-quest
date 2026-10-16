// Screens, game flow, and board interaction.
(function (WS) {
  'use strict';

  const app = document.getElementById('app');
  const overlay = document.getElementById('overlay');
  const S = WS.store;
  const MAX_PROFILES = 4;

  let currentId = S.state.lastProfileId || null;
  let editId = null;   // profile being edited (null = creating a new one)
  let draft = null;    // profile editor form state
  let game = null;
  let timerId = null;
  let sel = null;      // drag selection {start, end}
  let tapStart = null; // first cell of a tap-tap selection

  // ---------- helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Number(n).toLocaleString();
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
  const P = () => S.getProfile(currentId);
  const themeInfo = (key) => WS.THEMES[key] || WS.MIX_THEME;

  function colorVars(p) {
    const c = WS.colorFor(p.color);
    return `--pc:${c.bg};--pc-ink:${c.ink}`;
  }

  function leaveGame() {
    clearInterval(timerId);
    timerId = null;
    game = null;
    sel = null;
    tapStart = null;
  }

  function logo() {
    const tiles = (word, cls, offset) => word.split('').map((ch, i) =>
      `<span class="tile ${cls}" style="--r:${[-6, 5, -3, 6, -4][i % 5]}deg;--d:${(i + offset) * 70}ms">${ch}</span>`).join('');
    return `<h1 class="logo" aria-label="Word Quest">${tiles('WORD', '', 0)}<span class="logo-gap"></span>${tiles('QUEST', 'alt', 4)}</h1>`;
  }

  // ---------- Home: who's playing ----------
  function renderHome() {
    leaveGame();
    const ps = S.state.profiles;
    app.innerHTML = `
      <main class="screen home">
        <header class="brand">
          ${logo()}
          <p class="tagline">${ps.length ? "Who's playing today?" : "Let's make your first player!"}</p>
        </header>
        <div class="profile-grid">
          ${ps.map((p) => {
            const t = WS.titleFor(p.points);
            return `<button class="profile-card card themed" data-action="pick" data-id="${p.id}" style="${colorVars(p)}">
              <span class="avatar big">${p.avatar}</span>
              <span class="pname">${esc(p.name)}</span>
              <span class="ptitle">${t.icon} ${t.name}</span>
              <span class="pstats"><span>⭐ ${fmt(p.points)}</span><span>🏅 ${Object.keys(p.badges).length}</span></span>
            </button>`;
          }).join('')}
          ${ps.length < MAX_PROFILES ? `
            <button class="profile-card card add" data-action="new-profile">
              <span class="avatar big">＋</span><span class="pname">Add player</span>
            </button>` : ''}
        </div>
      </main>`;
  }

  // ---------- Profile editor ----------
  function startNewProfile() {
    const usedColors = S.state.profiles.map((p) => p.color);
    const free = WS.COLORS.filter((c) => !usedColors.includes(c.bg));
    draft = {
      name: '',
      avatar: WS.AVATARS[Math.floor(Math.random() * WS.AVATARS.length)],
      color: (free[0] || WS.COLORS[0]).bg,
    };
    editId = null;
    renderEditor(true);
  }

  function renderEditor(focus) {
    leaveGame();
    const c = WS.colorFor(draft.color);
    app.innerHTML = `
      <main class="screen editor">
        <div class="topbar"><button class="btn ghost" data-action="cancel-edit">← Back</button></div>
        <div class="card editor-card themed" style="--pc:${c.bg};--pc-ink:${c.ink}">
          <div class="editor-preview"><span class="avatar huge">${draft.avatar}</span></div>
          <h2>${editId ? 'Edit player' : 'New player'}</h2>
          <label class="field"><span class="field-label">Name</span>
            <input id="pname" maxlength="14" autocomplete="off" value="${esc(draft.name)}" placeholder="Type a name">
          </label>
          <div class="field"><span class="field-label">Pick a buddy</span>
            <div class="avatar-grid">${WS.AVATARS.map((a) =>
              `<button class="avatar-opt ${a === draft.avatar ? 'sel' : ''}" data-action="set-avatar" data-v="${a}">${a}</button>`).join('')}
            </div>
          </div>
          <div class="field"><span class="field-label">Pick a color</span>
            <div class="color-grid">${WS.COLORS.map((col) =>
              `<button class="color-opt ${col.bg === draft.color ? 'sel' : ''}" style="background:${col.bg}" data-action="set-color" data-v="${col.bg}" aria-label="Color ${col.bg}"></button>`).join('')}
            </div>
          </div>
          <button class="btn primary big" data-action="save-profile">${editId ? 'Save changes' : 'Create player'}</button>
          ${editId ? '<button class="btn link danger" data-action="delete-profile">Delete this player</button>' : ''}
        </div>
      </main>`;
    const input = app.querySelector('#pname');
    input.addEventListener('input', () => { draft.name = input.value; });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveProfile(); });
    if (focus) input.focus();
  }

  function saveProfile() {
    const input = app.querySelector('#pname');
    const name = draft.name.trim();
    if (!name) {
      input.classList.remove('shake');
      void input.offsetWidth;
      input.classList.add('shake');
      input.focus();
      return;
    }
    if (editId) {
      const p = S.getProfile(editId);
      Object.assign(p, { name, avatar: draft.avatar, color: draft.color });
      S.save();
    } else {
      currentId = S.addProfile(name, draft.avatar, draft.color).id;
      S.state.lastProfileId = currentId;
      S.save();
    }
    renderSetup();
  }

  // ---------- Setup: level + theme ----------
  function renderSetup() {
    leaveGame();
    const p = P();
    if (!p) return renderHome();
    const t = WS.titleFor(p.points);
    const nt = WS.nextTitle(p.points);
    const pct = nt ? Math.round(((p.points - t.min) / (nt.min - t.min)) * 100) : 100;
    const levels = Object.values(WS.DIFFICULTIES);

    app.innerHTML = `
      <main class="screen setup themed" style="${colorVars(p)}">
        <div class="topbar">
          <button class="btn ghost" data-action="home">← Players</button>
          <button class="btn" data-action="trophies">🏆 Trophies</button>
        </div>

        <section class="card banner">
          <span class="avatar big">${p.avatar}</span>
          <div class="banner-info">
            <div class="banner-name">${esc(p.name)}
              <button class="icon-btn" data-action="edit-profile" aria-label="Edit player">✏️</button></div>
            <div class="banner-title">${t.icon} ${t.name}</div>
            <div class="progress"><div class="progress-fill" style="width:${pct}%"></div></div>
            <div class="progress-label">${nt
              ? `<b>${fmt(nt.min - p.points)}</b> points to ${nt.icon} ${nt.name}`
              : 'You reached the top title!'}</div>
          </div>
          <div class="banner-points"><div class="bp-num">${fmt(p.points)}</div><div class="bp-label">points</div></div>
        </section>

        <section class="card">
          <h2>How tricky?</h2>
          <div class="levels">${levels.map((d, i) => `
            <button class="level ${p.prefs.difficulty === d.key ? 'sel' : ''}" data-action="set-level" data-v="${d.key}">
              <span class="level-icon">${d.icon}</span>
              <span class="level-name">${d.name}</span>
              <span class="level-meter">${'<i class="on"></i>'.repeat(i + 1)}${'<i></i>'.repeat(levels.length - 1 - i)}</span>
              <span class="level-desc">${d.desc}</span>
              <span class="level-mult">×${d.mult} points</span>
            </button>`).join('')}
          </div>
        </section>

        <section class="card">
          <h2>Pick a theme</h2>
          <div class="themes">
            ${Object.entries(WS.THEMES).map(([k, th]) => `
              <button class="theme ${p.prefs.theme === k ? 'sel' : ''}" data-action="set-theme" data-v="${k}">
                <span class="theme-icon">${th.icon}</span><span>${th.name}</span>
                ${p.stats.themesCompleted.includes(k) ? '<span class="theme-done" title="Completed">✓</span>' : ''}
              </button>`).join('')}
            <button class="theme ${p.prefs.theme === 'mix' ? 'sel' : ''}" data-action="set-theme" data-v="mix">
              <span class="theme-icon">${WS.MIX_THEME.icon}</span><span>${WS.MIX_THEME.name}</span>
            </button>
          </div>
        </section>

        <button class="btn primary big go" data-action="start">Let's go! ▶</button>
      </main>`;
  }

  // ---------- Game ----------
  function startGame() {
    const p = P();
    game = WS.generatePuzzle(p.prefs.theme, p.prefs.difficulty);
    Object.assign(game, { score: 0, hintsUsed: 0, combo: 0, lastFindAt: 0, startAt: Date.now(), done: false, colorIdx: 0 });
    renderGame();
  }

  function wordItem(w, i) {
    const val = w.hinted ? Math.ceil(w.value / 2) : w.value;
    return `<li class="word${w.found ? ' found' : ''}${w.golden ? ' golden' : ''}${w.hinted ? ' hinted' : ''}" id="w-${i}">
      <span class="wtext">${w.text}</span>
      <span class="wval">${w.golden ? '★ ' : ''}${w.hinted ? `<s>${w.value}</s> ` : ''}${val}</span></li>`;
  }

  function renderGame() {
    clearInterval(timerId);
    const p = P();
    const g = game;
    const d = WS.DIFFICULTIES[g.difficulty];
    const th = themeInfo(g.theme);
    app.innerHTML = `
      <main class="screen game themed" style="${colorVars(p)}">
        <div class="game-top">
          <button class="btn small" data-action="quit" aria-label="Quit puzzle">✕</button>
          <div class="hud card">
            <span class="hud-player">${p.avatar}</span>
            <span class="hud-item">⏱ <b id="timer">0:00</b></span>
            <span class="hud-item">⭐ <b id="score">0</b></span>
            <span class="hud-item">✅ <b id="count">0/${g.words.length}</b></span>
          </div>
          <button class="btn small" data-action="hint">💡<span class="lbl"> Hint</span></button>
          <button class="btn small" data-action="mute" id="mute" aria-label="Sound on or off">${S.state.settings.muted ? '🔇' : '🔊'}</button>
        </div>
        <div class="game-body">
          <div class="board" id="board" style="--n:${g.size}">
            <svg id="lines" viewBox="0 0 ${g.size} ${g.size}" preserveAspectRatio="none" aria-hidden="true">
              <g id="found-lines"></g><g id="sel-layer"></g>
            </svg>
            <div class="cells">${g.grid.map((row, r) => row.map((ch, c) =>
              `<div class="cell" id="c-${r}-${c}">${ch}</div>`).join('')).join('')}</div>
          </div>
          <aside class="card wordlist">
            <h3>${th.icon} ${th.name} <span class="lvl-chip">${d.icon} ${d.name}</span></h3>
            <ul id="words">${g.words.map(wordItem).join('')}</ul>
            <p class="legend"><span class="gold-dot">★</span> Golden word = double points!</p>
          </aside>
        </div>
      </main>`;
    bindBoard();
    timerId = setInterval(() => {
      if (!game || game.done) return;
      const el = document.getElementById('timer');
      if (el) el.textContent = fmtTime(Math.floor((Date.now() - game.startAt) / 1000));
    }, 500);
  }

  const cellEl = ([r, c]) => document.getElementById(`c-${r}-${c}`);

  function lineCells(a, b) {
    const dr = Math.sign(b[0] - a[0]);
    const dc = Math.sign(b[1] - a[1]);
    const len = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
    const out = [];
    for (let i = 0; i <= len; i++) out.push([a[0] + dr * i, a[1] + dc * i]);
    return out;
  }

  const aligned = (a, b) => {
    const dr = b[0] - a[0];
    const dc = b[1] - a[1];
    return dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
  };

  // Snap a free drag to the nearest of the 8 directions, kept inside the grid.
  function snapEnd(start, raw) {
    const n = game.size;
    const dr = raw[0] - start[0];
    const dc = raw[1] - start[1];
    if (!dr && !dc) return start.slice();
    const step = Math.round(Math.atan2(dr, dc) / (Math.PI / 4));
    const ur = Math.round(Math.sin((step * Math.PI) / 4));
    const uc = Math.round(Math.cos((step * Math.PI) / 4));
    let len = ur && uc ? Math.round((Math.abs(dr) + Math.abs(dc)) / 2) : Math.max(Math.abs(dr), Math.abs(dc));
    while (len > 0) {
      const r = start[0] + ur * len;
      const c = start[1] + uc * len;
      if (r >= 0 && r < n && c >= 0 && c < n) break;
      len--;
    }
    return [start[0] + ur * len, start[1] + uc * len];
  }

  function bindBoard() {
    const board = document.getElementById('board');

    const cellAt = (e, clamp) => {
      const rect = board.getBoundingClientRect();
      const n = game.size;
      let c = Math.floor(((e.clientX - rect.left) / rect.width) * n);
      let r = Math.floor(((e.clientY - rect.top) / rect.height) * n);
      if (!clamp && (r < 0 || r >= n || c < 0 || c >= n)) return null;
      r = Math.max(0, Math.min(n - 1, r));
      c = Math.max(0, Math.min(n - 1, c));
      return [r, c];
    };

    board.addEventListener('pointerdown', (e) => {
      if (!game || game.done) return;
      const cell = cellAt(e, false);
      if (!cell) return;
      e.preventDefault();
      board.setPointerCapture(e.pointerId);
      sel = { start: cell, end: cell };
      drawSelection();
    });

    board.addEventListener('pointermove', (e) => {
      if (!sel) return;
      const end = snapEnd(sel.start, cellAt(e, true));
      if (!same(end, sel.end)) {
        sel.end = end;
        drawSelection();
      }
    });

    board.addEventListener('pointerup', () => {
      if (!sel) return;
      const { start, end } = sel;
      sel = null;
      if (!same(start, end)) {
        tapStart = null;
        tryWord(start, end);
      } else if (tapStart && !same(tapStart, start) && aligned(tapStart, start)) {
        const a = tapStart;
        tapStart = null;
        tryWord(a, start);
      } else {
        // Tap-tap mode for little fingers: tap the first letter, then the last.
        tapStart = same(tapStart, start) ? null : start;
      }
      drawSelection();
    });

    board.addEventListener('pointercancel', () => { sel = null; drawSelection(); });
  }

  let hotCells = [];
  function drawSelection() {
    const layer = document.getElementById('sel-layer');
    if (!layer) return;
    hotCells.forEach((el) => el.classList.remove('hot'));
    hotCells = [];
    let html = '';
    if (tapStart) {
      html += `<circle class="tap-mark" cx="${tapStart[1] + 0.5}" cy="${tapStart[0] + 0.5}" r="0.42"/>`;
      hotCells.push(cellEl(tapStart));
    }
    if (sel) {
      const { start: a, end: b } = sel;
      html += same(a, b)
        ? `<circle class="sel-line" cx="${a[1] + 0.5}" cy="${a[0] + 0.5}" r="0.4"/>`
        : `<line class="sel-line" x1="${a[1] + 0.5}" y1="${a[0] + 0.5}" x2="${b[1] + 0.5}" y2="${b[0] + 0.5}"/>`;
      hotCells.push(...lineCells(a, b).map(cellEl));
    }
    hotCells.forEach((el) => el.classList.add('hot'));
    layer.innerHTML = html;
  }

  function tryWord(a, b) {
    const cells = lineCells(a, b);
    const str = cells.map(([r, c]) => game.grid[r][c]).join('');
    const rev = [...str].reverse().join('');
    const w = game.words.find((x) => !x.found && (x.text === str || x.text === rev));
    if (w) return onFound(w, cells);
    if (cells.length > 1) {
      const g = document.getElementById('sel-layer');
      g.insertAdjacentHTML('beforeend',
        `<line class="miss-line" x1="${a[1] + 0.5}" y1="${a[0] + 0.5}" x2="${b[1] + 0.5}" y2="${b[0] + 0.5}"/>`);
      WS.fx.sound('miss');
    }
  }

  function onFound(w, cells) {
    const p = P();
    const s = p.stats;
    const now = Date.now();
    const g = game;

    g.combo = now - g.lastFindAt < WS.SCORING.comboWindowMs ? g.combo + 1 : 1;
    g.lastFindAt = now;
    const base = w.hinted ? Math.ceil(w.value / 2) : w.value;
    const comboBonus = g.combo >= 2 ? Math.round(WS.SCORING.comboStep * (g.combo - 1) * g.mult) : 0;
    const gained = base + comboBonus;
    const titleBefore = WS.titleFor(p.points);

    w.found = true;
    g.score += gained;
    p.points += gained;
    s.wordsFound++;
    if (w.golden) s.goldenFound++;
    const [dr, dc] = w.dir;
    if (dc < 0 || (dc === 0 && dr < 0)) s.backwardsFound++;
    if (dr && dc) s.diagonalFound++;
    s.longestWord = Math.max(s.longestWord, w.text.length);
    s.bestCombo = Math.max(s.bestCombo, g.combo);
    const newBadges = WS.awardBadges(p);
    S.save();

    // Capsule over the word, drawn in.
    const color = w.golden ? '#FFC93C' : WS.FOUND_PALETTE[g.colorIdx++ % WS.FOUND_PALETTE.length];
    const a = cells[0];
    const b = cells[cells.length - 1];
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    Object.entries({ x1: a[1] + 0.5, y1: a[0] + 0.5, x2: b[1] + 0.5, y2: b[0] + 0.5, pathLength: 1 })
      .forEach(([k, v]) => line.setAttribute(k, v));
    line.setAttribute('class', 'found-line' + (w.golden ? ' golden' : ''));
    line.style.stroke = color;
    document.getElementById('found-lines').appendChild(line);

    // Letters flip around one after another.
    cells.forEach((rc, i) => {
      const el = cellEl(rc);
      el.classList.remove('spin');
      void el.offsetWidth;
      el.style.setProperty('--i', i);
      el.style.setProperty('--wc', color);
      el.classList.add('spin', 'got');
    });

    const idx = g.words.indexOf(w);
    document.getElementById(`w-${idx}`).outerHTML = wordItem(w, idx);
    document.getElementById(`w-${idx}`).classList.add('just');
    document.getElementById('score').textContent = fmt(g.score);
    const foundCount = g.words.filter((x) => x.found).length;
    document.getElementById('count').textContent = `${foundCount}/${g.words.length}`;

    const boardRect = document.getElementById('board').getBoundingClientRect();
    WS.fx.celebrateWord({
      text: w.text, points: gained, golden: w.golden, combo: g.combo, color,
      x: boardRect.left + boardRect.width / 2, y: boardRect.top + boardRect.height / 2,
    });
    newBadges.forEach((badge, i) => setTimeout(() => WS.fx.badgeToast(badge), 800 + i * 700));

    const titleAfter = WS.titleFor(p.points);
    const titleChanged = titleAfter !== titleBefore;
    if (titleChanged) setTimeout(() => WS.fx.titleUp(titleAfter, WS.colorFor(p.color).bg), 1800);

    if (foundCount === g.words.length) {
      g.done = true;
      g.finishedAt = now;
      setTimeout(() => { if (game === g) completePuzzle(); }, titleChanged ? 5200 : 1900);
    }
  }

  function useHint() {
    if (!game || game.done) return;
    const left = game.words.filter((w) => !w.found);
    const fresh = left.filter((w) => !w.hinted);
    const pool = fresh.length ? fresh : left;
    const w = pool[Math.floor(Math.random() * pool.length)];
    if (!w.hinted) {
      w.hinted = true;
      game.hintsUsed++;
      const idx = game.words.indexOf(w);
      document.getElementById(`w-${idx}`).outerHTML = wordItem(w, idx);
    }
    const el = cellEl(w.cells[0]);
    el.classList.remove('hint-glow');
    void el.offsetWidth;
    el.classList.add('hint-glow');
    WS.fx.sound('hint');
  }

  function completePuzzle() {
    const g = game;
    const p = P();
    const s = p.stats;
    const d = WS.DIFFICULTIES[g.difficulty];
    const time = Math.floor((g.finishedAt - g.startAt) / 1000);
    const wordPoints = g.score;

    const clear = Math.round(WS.SCORING.clearBonus * g.mult);
    const speed = Math.max(0, Math.round((g.words.length * d.par - time) * g.mult));
    const noHint = g.hintsUsed === 0 ? Math.round(WS.SCORING.noHintBonus * g.mult) : 0;
    const bonus = clear + speed + noHint;
    const titleBefore = WS.titleFor(p.points);

    p.points += bonus;
    g.score += bonus;
    s.puzzlesCompleted++;
    s.levelsCompleted[g.difficulty] = (s.levelsCompleted[g.difficulty] || 0) + 1;
    if (g.theme !== 'mix' && !s.themesCompleted.includes(g.theme)) s.themesCompleted.push(g.theme);
    const prevBest = s.bestTimes[g.difficulty];
    const record = prevBest != null && time < prevBest;
    if (prevBest == null || time < prevBest) s.bestTimes[g.difficulty] = time;
    s.fastest = s.fastest == null ? time : Math.min(s.fastest, time);
    if (g.hintsUsed === 0 && g.difficulty !== 'easy') s.noHintClears++;
    s.bestPuzzleScore = Math.max(s.bestPuzzleScore, g.score);
    const newBadges = WS.awardBadges(p);
    S.save();
    const titleAfter = WS.titleFor(p.points);

    overlay.insertAdjacentHTML('beforeend', `
      <div class="modal-back" id="results">
        <div class="modal card themed" style="${colorVars(p)}">
          <div class="trophy-spin">🏆</div>
          <h2>Puzzle complete!</h2>
          <p class="sub">${esc(p.name)} found all ${g.words.length} words in <b>${fmtTime(time)}</b>${record ? ' — <span class="record">new record!</span>' : ''}</p>
          <ul class="breakdown">
            <li><span>Words found</span><b>+${fmt(wordPoints)}</b></li>
            <li><span>Puzzle cleared</span><b>+${fmt(clear)}</b></li>
            <li><span>Speed bonus</span><b>+${fmt(speed)}</b></li>
            <li><span>No-hint bonus</span><b>+${fmt(noHint)}</b></li>
            <li class="total"><span>Total</span><b>${fmt(g.score)}</b></li>
          </ul>
          ${titleAfter !== titleBefore ? `<div class="new-title">${titleAfter.icon} New title: <b>${titleAfter.name}</b></div>` : ''}
          ${newBadges.length ? `<div class="new-badges"><div class="nb-label">New badges!</div>
            ${newBadges.map((b) => `<div class="nb"><span class="nb-icon">${b.icon}</span>${b.name}</div>`).join('')}</div>` : ''}
          <div class="modal-actions">
            <button class="btn" data-action="results-setup">Change level</button>
            <button class="btn primary" data-action="again">Play again ▶</button>
          </div>
        </div>
      </div>`);
    WS.fx.rain([WS.colorFor(p.color).bg, '#FFC93C', '#ffffff', '#4CC9F0', '#FF5DA2', '#06D6A0']);
    WS.fx.sound('complete');
  }

  const closeResults = () => document.getElementById('results')?.remove();

  // ---------- Trophy room ----------
  function renderTrophies() {
    leaveGame();
    const p = P();
    const s = p.stats;
    const t = WS.titleFor(p.points);
    const earned = Object.keys(p.badges).length;
    const tiles = [
      ['⭐', fmt(p.points), 'points'],
      ['🔤', fmt(s.wordsFound), 'words found'],
      ['🧩', fmt(s.puzzlesCompleted), 'puzzles'],
      ['✨', fmt(s.goldenFound), 'golden words'],
      ['⚡', `x${s.bestCombo}`, 'best combo'],
      ['⏱', s.fastest == null ? '—' : fmtTime(s.fastest), 'fastest'],
    ];
    app.innerHTML = `
      <main class="screen trophies themed" style="${colorVars(p)}">
        <div class="topbar"><button class="btn ghost" data-action="back-setup">← Back</button></div>
        <h1 class="page-title"><span class="avatar">${p.avatar}</span> ${esc(p.name)}'s Trophy Room</h1>
        <section class="stat-tiles">${tiles.map(([i, v, l]) =>
          `<div class="stat card"><span class="stat-icon">${i}</span><b>${v}</b><small>${l}</small></div>`).join('')}
        </section>
        <section class="card">
          <h2>Titles</h2>
          <ol class="titles">${WS.TITLES.map((x) => `
            <li class="${p.points >= x.min ? 'got' : ''} ${x === t ? 'current' : ''}">
              <span class="t-icon">${x.icon}</span><span class="t-name">${x.name}</span>
              <span class="t-min">${x === t ? 'You are here!' : `${fmt(x.min)} pts`}</span>
            </li>`).join('')}
          </ol>
        </section>
        <section class="card">
          <h2>Badges <span class="count">${earned} / ${WS.BADGES.length}</span></h2>
          <div class="badge-grid">${WS.BADGES.map((b) => {
            const got = p.badges[b.id];
            return `<div class="badge ${got ? 'got' : 'locked'}">
              <span class="b-icon">${b.icon}</span>
              <span class="b-name">${b.name}</span>
              <span class="b-desc">${b.desc}</span>
              ${got ? `<span class="b-date">${new Date(got).toLocaleDateString()}</span>` : ''}
            </div>`;
          }).join('')}</div>
        </section>
      </main>`;
  }

  // ---------- Actions ----------
  const actions = {
    pick(el) {
      currentId = el.dataset.id;
      S.state.lastProfileId = currentId;
      S.save();
      renderSetup();
    },
    'new-profile': startNewProfile,
    'edit-profile'() {
      const p = P();
      draft = { name: p.name, avatar: p.avatar, color: p.color };
      editId = p.id;
      renderEditor(false);
    },
    'set-avatar'(el) { draft.avatar = el.dataset.v; renderEditor(false); },
    'set-color'(el) { draft.color = el.dataset.v; renderEditor(false); },
    'save-profile': saveProfile,
    'cancel-edit'() { editId ? renderSetup() : renderHome(); },
    'delete-profile'() {
      const p = S.getProfile(editId);
      if (!confirm(`Delete ${p.name}? This erases all their points and badges.`)) return;
      S.deleteProfile(editId);
      currentId = null;
      editId = null;
      renderHome();
    },
    home: renderHome,
    trophies: renderTrophies,
    'back-setup': renderSetup,
    'set-level'(el) { P().prefs.difficulty = el.dataset.v; S.save(); renderSetup(); },
    'set-theme'(el) { P().prefs.theme = el.dataset.v; S.save(); renderSetup(); },
    start: startGame,
    quit() {
      if (game && !game.done && game.words.some((w) => w.found) &&
        !confirm('Leave this puzzle? You keep the points you already earned.')) return;
      renderSetup();
    },
    hint: useHint,
    mute(el) {
      S.state.settings.muted = !S.state.settings.muted;
      S.save();
      el.textContent = S.state.settings.muted ? '🔇' : '🔊';
    },
    again() { closeResults(); startGame(); },
    'results-setup'() { closeResults(); renderSetup(); },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (el && actions[el.dataset.action]) actions[el.dataset.action](el, e);
  });

  // Always start on "Who's playing?" since the device is shared.
  renderHome();
})(window.WS);
