// Profiles and settings, saved in this browser's localStorage.
(function (WS) {
  'use strict';

  const KEY = 'wordquest.v1';

  const defaultStats = () => ({
    wordsFound: 0, puzzlesCompleted: 0, goldenFound: 0, backwardsFound: 0, diagonalFound: 0,
    longestWord: 0, bestCombo: 0, bestPuzzleScore: 0, fastest: null, noHintClears: 0,
    themesCompleted: [], levelsCompleted: {}, bestTimes: {},
  });

  function normalize(p) {
    p.points = p.points || 0;
    p.stats = { ...defaultStats(), ...(p.stats || {}) };
    p.badges = p.badges || {};
    p.prefs = { difficulty: 'easy', theme: 'animals', ...(p.prefs || {}) };
    return p;
  }

  function load() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* storage unavailable */ }
    data = data && typeof data === 'object' ? data : {};
    data.profiles = (data.profiles || []).map(normalize);
    data.settings = { muted: false, ...(data.settings || {}) };
    return data;
  }

  const state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  WS.store = {
    state,
    save,
    getProfile: (id) => state.profiles.find((p) => p.id === id) || null,
    addProfile(name, avatar, color) {
      const p = normalize({
        id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name, avatar, color, createdAt: Date.now(),
      });
      state.profiles.push(p);
      save();
      return p;
    },
    deleteProfile(id) {
      state.profiles = state.profiles.filter((p) => p.id !== id);
      if (state.lastProfileId === id) state.lastProfileId = null;
      save();
    },
  };
})(window.WS);
