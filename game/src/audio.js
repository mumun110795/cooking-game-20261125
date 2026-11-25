// audio.js — a tiny WebAudio synth: no audio files, just short blips.
// The context is created lazily on the first user gesture (browser policy).

let ctx = null;

function ensureContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(freq, at, dur, type, gain) {
  const ac = ensureContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type || 'square';
  osc.frequency.value = freq;
  const t0 = ac.currentTime + at;
  amp.gain.setValueAtTime(gain || 0.05, t0);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  add()    { blip(520, 0, 0.07, 'triangle', 0.06); },
  cook()   { blip(220, 0, 0.12, 'sawtooth', 0.04); blip(330, 0.06, 0.12, 'sawtooth', 0.04); },
  ready()  { blip(880, 0, 0.09, 'sine', 0.07); blip(1174, 0.09, 0.14, 'sine', 0.07); },
  serve()  { blip(659, 0, 0.08, 'triangle', 0.07); blip(784, 0.07, 0.08, 'triangle', 0.07); blip(1046, 0.14, 0.16, 'triangle', 0.07); },
  coin()   { blip(1568, 0, 0.06, 'square', 0.04); blip(2093, 0.05, 0.12, 'square', 0.04); },
  fail()   { blip(196, 0, 0.16, 'sawtooth', 0.05); blip(147, 0.1, 0.2, 'sawtooth', 0.05); },
  trash()  { blip(300, 0, 0.06, 'square', 0.04); blip(180, 0.05, 0.09, 'square', 0.04); },
};
