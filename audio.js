// ============================================================
// MEGAMANIA 2.0 — AudioManager
// Procedural sound effects via Web Audio API
// ============================================================

class AudioManager {
  constructor() {
    this.ctx = null;
    this.ready = false;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.ready = true;
  }

  _osc(type, freq, freqEnd, dur, vol) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur);
  }

  _noise(dur, vol, filterFreq) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const sr = this.ctx.sampleRate;
    const len = sr * dur;
    const buf = this.ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = filterFreq || 800;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filt);
    filt.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t);
    src.stop(t + dur);
  }

  laser()     { this._osc('square', 1200, 400, 0.07, 0.25); }
  spreadLaser(){ this._osc('square', 1400, 500, 0.06, 0.2); }
  explosion() { this._noise(0.18, 0.4, 800); }
  playerHit() { this._osc('sawtooth', 300, 40, 0.35, 0.35); this._noise(0.25, 0.35, 600); }
  powerup()   { this._osc('sine', 600, 1200, 0.12, 0.25); setTimeout(() => this._osc('sine', 900, 1500, 0.1, 0.2), 120); }
  bossHit()   { this._noise(0.1, 0.3, 1200); this._osc('square', 200, 80, 0.1, 0.2); }
  bossDie()   { this._noise(0.5, 0.5, 400); this._osc('sawtooth', 200, 20, 0.5, 0.3); }

  levelUp() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this._osc('square', f, f, 0.09, 0.2), i * 100);
    });
  }
}

// Global singleton
const Audio = new AudioManager();
