// Ember Pact — all sound is synthesized with WebAudio. No audio files,
// no network: every tone is an oscillator shaped here.
let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function ensureCtx() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slideTo = null) {
  const ac = ensureCtx();
  if (!ac || muted) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playSound(name) {
  if (muted) return;
  switch (name) {
    case 'click': tone(660, 0.06, 'triangle', 0.06); break;
    case 'deal': tone(420, 0.09, 'triangle', 0.08, 0, 640); break;
    case 'play': tone(520, 0.12, 'triangle', 0.1, 0, 780); break;
    case 'hit': tone(140, 0.22, 'sawtooth', 0.14, 0, 60); break;
    case 'ward': tone(880, 0.14, 'sine', 0.09, 0, 1180); break;
    case 'heal': tone(520, 0.16, 'sine', 0.09); tone(780, 0.2, 'sine', 0.08, 0.09); break;
    case 'pact': tone(660, 0.1, 'triangle', 0.1); tone(990, 0.16, 'triangle', 0.1, 0.08); break;
    case 'turn': tone(330, 0.1, 'triangle', 0.07, 0, 440); break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.11, i * 0.11));
      break;
    case 'loss':
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.32, 'sine', 0.1, i * 0.14));
      break;
    default: break;
  }
}

// Unlock audio on the first user gesture so later sounds play.
export function unlockAudio() { ensureCtx(); }
