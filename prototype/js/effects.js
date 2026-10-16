// Celebrations: confetti, the spinning word-found burst, badge toasts, title-up, sounds.
(function (WS) {
  'use strict';

  const canvas = document.getElementById('fx');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const toasts = document.getElementById('toasts');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Confetti ----------
  let parts = [];
  let raf = null;
  let dpr = 1;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
  }
  addEventListener('resize', resize);
  resize();

  function confetti(x, y, count, colors, power = 1) {
    if (reduceMotion) count = Math.round(count / 4);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (4 + Math.random() * 9) * power;
      parts.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5 * power,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.4,
        w: 7 + Math.random() * 7,
        h: 5 + Math.random() * 5,
        color: colors[i % colors.length],
        star: Math.random() < 0.3,
        life: 0,
        max: 70 + Math.random() * 60,
      });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function rain(colors) {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => confetti(Math.random() * innerWidth, -20, 22, colors, 0.6), i * 140);
    }
  }

  function drawStar(r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r * 0.45 : r;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
  }

  function tick() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.life < p.max && p.y < innerHeight + 40);
    for (const p of parts) {
      p.vy += 0.32;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life++;
      const fade = Math.max(0, (p.life - p.max * 0.7) / (p.max * 0.3));
      ctx.save();
      ctx.globalAlpha = 1 - fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.star) drawStar(p.w * 0.8);
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.life * 0.18)));
      ctx.restore();
    }
    raf = parts.length ? requestAnimationFrame(tick) : null;
    if (!raf) ctx.clearRect(0, 0, innerWidth, innerHeight);
  }

  // ---------- Sounds (generated, no files needed) ----------
  let actx = null;
  function audio() {
    if (WS.store.state.settings.muted) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!actx) actx = new AC();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(a, freq, at, dur, type = 'triangle', vol = 0.18) {
    const o = a.createOscillator();
    const g = a.createGain();
    const t = a.currentTime + at;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  const SONGS = {
    find: [[523, 0], [659, 0.08], [784, 0.16], [1047, 0.24]],
    golden: [[523, 0], [659, 0.07], [784, 0.14], [1047, 0.21], [1319, 0.28], [1568, 0.35]],
    badge: [[784, 0], [988, 0.1], [1175, 0.2], [1568, 0.32]],
    title: [[392, 0], [523, 0.12], [659, 0.24], [784, 0.36], [1047, 0.52]],
    complete: [[523, 0], [523, 0.12], [523, 0.24], [659, 0.4], [784, 0.56], [659, 0.72], [784, 0.84], [1047, 1.0]],
    hint: [[880, 0], [660, 0.1]],
  };
  function sound(name) {
    const a = audio();
    if (!a) return;
    if (name === 'miss') return tone(a, 160, 0, 0.18, 'sawtooth', 0.06);
    for (const [f, at] of SONGS[name] || []) tone(a, f, at, name === 'complete' ? 0.3 : 0.22);
  }

  // ---------- Word found: spinning medal + rotating sunburst ----------
  const CHEERS = ['Awesome!', 'Great find!', 'Super!', 'Wow!', 'Brilliant!', 'Nice one!', 'Amazing!', 'You got it!'];
  let activeBurst = null;

  function celebrateWord({ text, points, golden, combo, color, x, y }) {
    if (activeBurst) activeBurst.remove();
    const bc = golden ? '#FFC93C' : color;
    const el = document.createElement('div');
    el.className = 'burst' + (golden ? ' golden' : '');
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--bc', bc);
    el.innerHTML = `
      <div class="burst-rays"></div>
      <div class="burst-ring"></div>
      <div class="burst-medal"><div class="medal-face"><span>${golden ? '👑' : '★'}</span></div></div>
      <div class="burst-text">
        <div class="burst-cheer">${golden ? 'GOLDEN WORD!' : CHEERS[Math.floor(Math.random() * CHEERS.length)]}</div>
        <div class="burst-word">${text}</div>
        <div class="burst-points">+${points}</div>
        ${combo >= 2 ? `<div class="burst-combo">Combo x${combo}!</div>` : ''}
      </div>`;
    overlay.appendChild(el);
    activeBurst = el;
    setTimeout(() => { el.remove(); if (activeBurst === el) activeBurst = null; }, 2000);

    const colors = golden ? ['#FFC93C', '#FFE58A', '#FF9F1C', '#ffffff'] : [color, '#FFC93C', '#ffffff', '#4CC9F0', '#FF5DA2'];
    confetti(x, y, golden ? 120 : 70, colors, golden ? 1.3 : 1);
    sound(golden ? 'golden' : 'find');
  }

  // ---------- Badge toast ----------
  function badgeToast(badge) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="toast-icon">${badge.icon}</span>
      <span><small>Badge unlocked!</small><b>${badge.name}</b></span>`;
    toasts.appendChild(el);
    const r = el.getBoundingClientRect();
    confetti(r.left + 30, r.top + r.height / 2, 30, ['#FFC93C', '#ffffff', '#FF5DA2']);
    sound('badge');
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 4200);
  }

  // ---------- New title: full-screen spin ----------
  function titleUp(title, color) {
    const el = document.createElement('div');
    el.className = 'titleup';
    el.style.setProperty('--bc', color);
    el.innerHTML = `
      <div class="tu-rays"></div>
      <div class="tu-inner">
        <div class="tu-label">New title unlocked!</div>
        <div class="tu-icon">${title.icon}</div>
        <div class="tu-name">${title.name}</div>
        <div class="tu-tap">tap to keep playing</div>
      </div>`;
    overlay.appendChild(el);
    rain([color, '#FFC93C', '#ffffff', '#4CC9F0', '#FF5DA2']);
    sound('title');
    const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 350); };
    el.addEventListener('click', close);
    setTimeout(close, 3200);
  }

  WS.fx = { confetti, rain, sound, celebrateWord, badgeToast, titleUp };
})(window.WS);
