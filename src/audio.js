let actx = null;

function ac() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  return actx;
}

function tone(freq, type, duration, gainVal, freqEnd = null) {
  const ctx = ac();
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.connect(g);
  g.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
  g.gain.setValueAtTime(gainVal, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function noise(duration, gainVal) {
  const ctx     = ac();
  const bufSize = Math.ceil(ctx.sampleRate * duration);
  const buf     = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data    = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  src.connect(g);
  g.connect(ctx.destination);
  g.gain.setValueAtTime(gainVal, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  src.start(ctx.currentTime);
}

function arpeggio(notes, interval, type, gainVal, noteDuration) {
  const ctx = ac();
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = type;
    const t = ctx.currentTime + i * interval;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gainVal, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + noteDuration);
    osc.start(t);
    osc.stop(t + noteDuration);
  });
}

export const audio = {
  shoot() {
    tone(880, 'sawtooth', 0.08, 0.12, 220);
  },

  enemyKill() {
    tone(280, 'sine', 0.12, 0.18, 55);
    noise(0.07, 0.12);
  },

  critHit() {
    tone(600, 'sawtooth', 0.22, 0.22, 80);
    tone(900, 'sine',     0.15, 0.14, 200);
    noise(0.18, 0.22);
  },

  diverLaunch() {
    tone(440, 'sine', 0.35, 0.08, 110);
  },

  playerHit() {
    tone(120, 'sawtooth', 0.45, 0.28, 35);
    noise(0.35, 0.18);
  },

  waveClear() {
    arpeggio([440, 554, 659, 880], 0.12, 'sine', 0.18, 0.2);
  },

  nat20() {
    arpeggio([330, 440, 554, 659, 880], 0.08, 'square', 0.13, 0.15);
  },
};
