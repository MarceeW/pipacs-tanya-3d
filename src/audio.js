// Tiny WebAudio synth: sound effects, cartoon animal voices and a gentle generative tune.
let ac = null, master = null, musicGain = null, sfxGain = null;
const settings = { sfx: true, music: true };

function ensure() {
  if (ac) return true;
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
    sfxGain = ac.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(master);
    musicGain = ac.createGain(); musicGain.gain.value = settings.music ? 0.1 : 0; musicGain.connect(master);
    startMusic();
    return true;
  } catch { return false; }
}
export function unlockAudio() { if (ensure() && ac.state === 'suspended') ac.resume(); }
export function setAudio(s) {
  settings.sfx = s.sfx; settings.music = s.music;
  if (musicGain) musicGain.gain.setTargetAtTime(s.music ? 0.1 : 0, ac.currentTime, 0.3);
}

function tone(freq, dur, { type = 'sine', vol = 0.3, at = 0, slide = 0, out = sfxGain, attack = 0.005, vib = 0 } = {}) {
  const t = ac.currentTime + at;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  if (vib) {
    const l = ac.createOscillator(), lg = ac.createGain();
    l.frequency.value = 18; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05);
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, { vol = 0.2, at = 0, freq = 1200, q = 1 } = {}) {
  const t = ac.currentTime + at;
  const len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ac.createBufferSource(); s.buffer = buf;
  const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = ac.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t);
}

const SFX = {
  click: () => tone(660, 0.06, { type: 'triangle', vol: 0.15 }),
  open: () => tone(520, 0.08, { type: 'sine', vol: 0.12, slide: 260 }),
  close: () => tone(620, 0.07, { type: 'sine', vol: 0.08, slide: -220 }),
  plow: () => { noise(0.18, { vol: 0.35, freq: 400, q: 0.8 }); tone(110, 0.12, { type: 'triangle', vol: 0.2, slide: -40 }); },
  plant: () => { tone(520, 0.08, { type: 'triangle', vol: 0.18 }); tone(780, 0.08, { type: 'triangle', vol: 0.12, at: 0.05 }); },
  water: () => { noise(0.3, { vol: 0.25, freq: 2500, q: 0.6 }); tone(900, 0.15, { vol: 0.06, slide: 400 }); },
  harvest: () => { tone(660, 0.1, { type: 'triangle', vol: 0.2 }); tone(990, 0.14, { type: 'triangle', vol: 0.16, at: 0.06 }); noise(0.08, { vol: 0.15, freq: 3000 }); },
  collect: () => { tone(880, 0.1, { vol: 0.2 }); tone(1320, 0.18, { vol: 0.15, at: 0.07 }); },
  feed: () => { noise(0.25, { vol: 0.2, freq: 1800, q: 2 }); tone(420, 0.1, { type: 'triangle', vol: 0.15, at: 0.1 }); },
  coin: () => { tone(1318, 0.08, { type: 'square', vol: 0.07 }); tone(1975, 0.22, { type: 'square', vol: 0.06, at: 0.07 }); },
  build: () => { noise(0.12, { vol: 0.3, freq: 300 }); tone(196, 0.12, { type: 'triangle', vol: 0.2, at: 0.08 }); tone(262, 0.18, { type: 'triangle', vol: 0.2, at: 0.18 }); tone(392, 0.25, { type: 'triangle', vol: 0.18, at: 0.3 }); },
  place: () => { tone(330, 0.08, { type: 'triangle', vol: 0.2 }); tone(440, 0.1, { type: 'triangle', vol: 0.15, at: 0.06 }); },
  remove: () => tone(400, 0.15, { type: 'triangle', vol: 0.18, slide: -250 }),
  craft: () => { tone(392, 0.08, { type: 'triangle', vol: 0.16 }); tone(523, 0.12, { type: 'triangle', vol: 0.16, at: 0.08 }); },
  error: () => { tone(220, 0.12, { type: 'square', vol: 0.06 }); tone(180, 0.18, { type: 'square', vol: 0.06, at: 0.1 }); },
  magic: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.2, { vol: 0.1, at: i * 0.05 })),
  quest: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.16, at: i * 0.08 })),
  levelup: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.25, { type: 'triangle', vol: 0.18, at: i * 0.09 })),
  chop: () => { noise(0.08, { vol: 0.45, freq: 700, q: 3 }); noise(0.08, { vol: 0.4, freq: 600, q: 3, at: 0.18 }); tone(140, 0.2, { type: 'triangle', vol: 0.15, at: 0.3, slide: -60 }); },
  pick: () => { noise(0.05, { vol: 0.4, freq: 3500, q: 4 }); noise(0.05, { vol: 0.35, freq: 3000, q: 4, at: 0.15 }); noise(0.3, { vol: 0.25, freq: 500, at: 0.25 }); },
  truck: () => { tone(90, 0.6, { type: 'sawtooth', vol: 0.05, slide: 40 }); tone(660, 0.12, { type: 'square', vol: 0.05, at: 0.05 }); tone(550, 0.16, { type: 'square', vol: 0.05, at: 0.18 }); },
  bell: () => { tone(1568, 0.6, { vol: 0.12 }); tone(2093, 0.5, { vol: 0.06, at: 0.02 }); tone(1568, 0.5, { vol: 0.1, at: 0.3 }); },
  splash: () => { noise(0.35, { vol: 0.35, freq: 1500, q: 0.5 }); tone(300, 0.2, { vol: 0.08, slide: -150 }); },
  cast: () => { noise(0.2, { vol: 0.12, freq: 4000, q: 1 }); tone(1200, 0.25, { vol: 0.05, slide: -900 }); noise(0.2, { vol: 0.25, freq: 1300, at: 0.35 }); },
  animal_chicken: () => { tone(900, 0.07, { type: 'square', vol: 0.06, slide: 300 }); tone(950, 0.07, { type: 'square', vol: 0.06, at: 0.11, slide: 300 }); tone(1100, 0.12, { type: 'square', vol: 0.05, at: 0.22, slide: -400 }); },
  animal_cow: () => tone(140, 0.9, { type: 'sawtooth', vol: 0.08, slide: -30, attack: 0.15, vib: 4 }),
  animal_sheep: () => tone(420, 0.6, { type: 'sawtooth', vol: 0.06, vib: 30, attack: 0.05 }),
  animal_pig: () => { tone(260, 0.12, { type: 'square', vol: 0.06, slide: -80, vib: 40 }); tone(240, 0.14, { type: 'square', vol: 0.06, at: 0.16, slide: -80, vib: 40 }); },
  animal_goat: () => tone(560, 0.5, { type: 'sawtooth', vol: 0.05, vib: 45, attack: 0.04 }),
  animal_duck: () => { tone(520, 0.1, { type: 'square', vol: 0.06, slide: -200 }); tone(500, 0.1, { type: 'square', vol: 0.06, at: 0.14, slide: -200 }); },
  animal_bee: () => tone(220, 0.6, { type: 'sawtooth', vol: 0.04, vib: 25 }),
  animal_dog: () => { tone(330, 0.09, { type: 'square', vol: 0.08, slide: -120 }); tone(320, 0.09, { type: 'square', vol: 0.08, at: 0.16, slide: -120 }); },
  animal_cat: () => tone(700, 0.45, { type: 'triangle', vol: 0.1, slide: 300, vib: 8 }),
};
const lastPlay = {};
export function sfx(name) {
  if (!settings.sfx || !ensure() || ac.state !== 'running') return;
  const n = performance.now();
  if (lastPlay[name] && n - lastPlay[name] < 45) return; // avoid stacking during drag actions
  lastPlay[name] = n;
  SFX[name]?.();
}

// --- music: soft pad + pentatonic melody + bass, slowly changing chords
const SCALE = [0, 2, 4, 7, 9];
const CHORDS = [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14], [0, 4, 7], [-5, -1, 2], [-3, 0, 4], [5, 9, 12]];
function startMusic() {
  const base = 261.63;
  const hz = (semi) => base * Math.pow(2, semi / 12);
  let step = 0;
  const beat = 0.42;
  setInterval(() => {
    if (!ac || ac.state !== 'running' || !settings.music) return;
    const chord = CHORDS[Math.floor(step / 8) % CHORDS.length];
    if (step % 8 === 0) chord.forEach((s) => tone(hz(s - 12), beat * 7.6, { type: 'sine', vol: 0.11, out: musicGain, attack: 0.5 }));
    if (step % 2 === 0 && Math.random() < 0.85) {
      const deg = SCALE[Math.floor(Math.random() * SCALE.length)] + (Math.random() < 0.3 ? 12 : 0);
      tone(hz(deg), beat * 1.7, { type: 'triangle', vol: 0.16, out: musicGain, attack: 0.02 });
    }
    if (step % 4 === 0) tone(hz(chord[0] - 24), beat * 1.5, { type: 'sine', vol: 0.14, out: musicGain });
    if (step % 8 === 6 && Math.random() < 0.5) tone(hz(chord[2] + 12), beat * 0.6, { type: 'sine', vol: 0.06, out: musicGain });
    step++;
  }, beat * 1000);
}
