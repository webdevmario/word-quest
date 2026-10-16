/**
 * Canvas particles: gold sparks that streak and fade, plus paper confetti.
 * One full-screen canvas is shared by the whole app.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  kind: 'spark' | 'paper' | 'star';
  life: number;
  max: number;
  gravity: number;
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let frame = 0;
let dpr = 1;

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function attachCanvas(el: HTMLCanvasElement | null) {
  canvas = el;
  ctx = el?.getContext('2d') ?? null;
  resize();
}

export function resize() {
  if (!canvas) {
    return;
  }
  dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
}

export const GOLD = ['#f7e3a6', '#f0cf72', '#e2b04a', '#fff6d6'];
export const JEWELS = ['#2eb872', '#3a7bd5', '#d6455b', '#9b5de5', '#f0a830'];

function spawn(p: Omit<Particle, 'life'>) {
  particles.push({ ...p, life: 0 });
  if (!frame) {
    frame = requestAnimationFrame(tick);
  }
}

/** Sparks shooting out of a point, e.g. a tile that was just used. */
export function sparks(
  x: number,
  y: number,
  count: number,
  colors = GOLD,
  power = 1
) {
  const n = reduceMotion() ? Math.ceil(count / 4) : count;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = (2 + Math.random() * 6) * power;
    spawn({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 2 * power,
      rot: 0,
      vr: 0,
      size: 1.5 + Math.random() * 2.5,
      color: colors[i % colors.length] as string,
      kind: Math.random() < 0.15 ? 'star' : 'spark',
      max: 30 + Math.random() * 30,
      gravity: 0.12,
    });
  }
}

/** A burst of paper confetti. */
export function burst(
  x: number,
  y: number,
  count: number,
  colors = [...GOLD, ...JEWELS],
  power = 1
) {
  const n = reduceMotion() ? Math.ceil(count / 4) : count;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = (4 + Math.random() * 9) * power;
    spawn({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 6 * power,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      size: 6 + Math.random() * 6,
      color: colors[i % colors.length] as string,
      kind: 'paper',
      max: 80 + Math.random() * 60,
      gravity: 0.3,
    });
  }
}

/** Confetti falling from the top of the screen. */
export function rain(colors = [...GOLD, ...JEWELS]) {
  for (let i = 0; i < 8; i++) {
    setTimeout(
      () => burst(Math.random() * window.innerWidth, -20, 20, colors, 0.55),
      i * 120
    );
  }
}

function drawStar(c: CanvasRenderingContext2D, r: number) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? r * 0.45 : r;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    c.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  c.closePath();
  c.fill();
}

function tick() {
  frame = 0;
  if (!ctx || !canvas) {
    particles = [];
    return;
  }
  const c = ctx;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, window.innerWidth, window.innerHeight);
  particles = particles.filter(
    (p) => p.life < p.max && p.y < window.innerHeight + 40
  );
  for (const p of particles) {
    p.vy += p.gravity;
    p.vx *= 0.98;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life++;
    const alpha = 1 - Math.max(0, (p.life - p.max * 0.6) / (p.max * 0.4));
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = p.color;
    if (p.kind === 'spark') {
      // Draw sparks as short streaks along their motion.
      c.strokeStyle = p.color;
      c.lineWidth = p.size;
      c.lineCap = 'round';
      c.shadowColor = p.color;
      c.shadowBlur = 8;
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2);
      c.stroke();
    } else {
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      if (p.kind === 'star') {
        c.shadowColor = p.color;
        c.shadowBlur = 10;
        drawStar(c, p.size * 2);
      } else {
        c.fillRect(
          -p.size / 2,
          -p.size / 3,
          p.size,
          (p.size / 1.5) * Math.abs(Math.cos(p.life * 0.15))
        );
      }
    }
    c.restore();
  }
  if (particles.length) {
    frame = requestAnimationFrame(tick);
  } else {
    c.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}
