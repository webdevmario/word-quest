import type { Tier } from '@/game/scoring';

/**
 * All sounds are synthesized with Web Audio, so there are no audio files.
 * Selection plays a rising pentatonic scale; success resolves it with a chord.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let reverb: ConvolverNode | null = null;
let muted = false;

export function setMuted(value: boolean) {
  muted = value;
}

function audio(): AudioContext | null {
  if (muted || typeof window === 'undefined') {
    return null;
  }
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) {
    return null;
  }
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx, 1.6);
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    reverb.connect(wet).connect(master);
  }
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  return ctx;
}

/** A short decaying noise burst works as a small-room reverb. */
function impulse(ac: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ac.sampleRate * seconds);
  const buffer = ac.createBuffer(2, length, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    }
  }
  return buffer;
}

interface Voice {
  freq: number;
  at?: number;
  dur?: number;
  vol?: number;
  type?: OscillatorType;
  bright?: number;
}

/** A plucked, slightly woody voice: two oscillators through a closing filter. */
function pluck({
  freq,
  at = 0,
  dur = 0.5,
  vol = 0.22,
  type = 'triangle',
  bright = 6,
}: Voice) {
  const ac = audio();
  if (!ac || !master || !reverb) {
    return;
  }
  const t = ac.currentTime + at;
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * bright, t);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.5, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  filter.connect(gain);
  gain.connect(master);
  gain.connect(reverb);
  for (const [mult, type2, level] of [
    [1, type, 1],
    [2, 'sine', 0.35],
  ] as const) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type2;
    osc.frequency.setValueAtTime(freq * mult, t);
    g.gain.value = level;
    osc.connect(g).connect(filter);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }
}

function noise(at: number, dur: number, vol: number, from: number, to: number) {
  const ac = audio();
  if (!ac || !master) {
    return;
  }
  const t = ac.currentTime + at;
  const src = ac.createBufferSource();
  src.buffer = impulse(ac, dur);
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const gain = ac.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(master);
  src.start(t);
}

// C major pentatonic from C5 upward.
const SCALE = [
  523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760,
  2093,
];
const note = (i: number) => SCALE[Math.min(i, SCALE.length - 1)] as number;

export const sound = {
  /** Plays as each tile joins the selection: the scale climbs with the word. */
  tick(index: number) {
    pluck({ freq: note(index), dur: 0.28, vol: 0.14, bright: 8 });
  },

  tap() {
    pluck({ freq: 880, dur: 0.08, vol: 0.06, type: 'sine' });
  },

  success(tier: Tier, letters: number) {
    const top = Math.min(letters, 8);
    // Quick run up the scale, then a warm chord that grows with the tier.
    for (let i = 0; i < top; i++) {
      pluck({ freq: note(i), at: i * 0.045, dur: 0.35, vol: 0.12 });
    }
    const at = top * 0.045 + 0.02;
    const chord = [523.25, 659.25, 783.99, 1046.5];
    const size = { nice: 2, great: 3, excellent: 4, superb: 4, legendary: 4 }[
      tier
    ];
    chord
      .slice(0, size)
      .forEach((f) => pluck({ freq: f, at, dur: 1.1, vol: 0.12, bright: 4 }));
    if (tier === 'superb' || tier === 'legendary') {
      [2093, 2637, 3136, 4186].forEach((f, i) =>
        pluck({
          freq: f,
          at: at + 0.12 + i * 0.07,
          dur: 0.6,
          vol: 0.05,
          type: 'sine',
        })
      );
      pluck({ freq: 130.81, at, dur: 1.4, vol: 0.18, type: 'sine', bright: 2 });
    }
  },

  shimmer() {
    [1568, 1976, 2349, 2637, 3136].forEach((f, i) =>
      pluck({ freq: f, at: i * 0.05, dur: 0.5, vol: 0.05, type: 'sine' })
    );
  },

  miss() {
    pluck({ freq: 196, dur: 0.22, vol: 0.1, type: 'sine', bright: 2 });
    pluck({
      freq: 185,
      at: 0.09,
      dur: 0.25,
      vol: 0.08,
      type: 'sine',
      bright: 2,
    });
  },

  fire() {
    noise(0, 0.5, 0.35, 900, 300);
  },

  whoosh() {
    noise(0, 0.35, 0.25, 400, 2400);
  },

  badge() {
    [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) =>
      pluck({ freq: f, at: i * 0.09, dur: 0.6, vol: 0.13 })
    );
  },

  fanfare() {
    const run = [392, 523.25, 659.25, 783.99, 1046.5];
    run.forEach((f, i) =>
      pluck({ freq: f, at: i * 0.11, dur: 0.5, vol: 0.14 })
    );
    [523.25, 659.25, 783.99, 1046.5].forEach((f) =>
      pluck({ freq: f, at: 0.6, dur: 1.6, vol: 0.1, bright: 3 })
    );
  },
};
