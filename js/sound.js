// 8-bit style sound synthesis using Web Audio API
export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this._init();
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.enabled = false;
    }
  }

  _resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _beep({ freq = 440, type = 'square', duration = 0.1, vol = 0.3, decay = 0.08, delay = 0 } = {}) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  _noise({ duration = 0.1, vol = 0.2, delay = 0 } = {}) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime + delay;
    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const gain = this.ctx.createGain();
    src.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.start(t);
    src.stop(t + duration + 0.01);
  }

  // Metal clash — sword hit
  clang() {
    this._beep({ freq: 880, type: 'sawtooth', duration: 0.18, vol: 0.4 });
    this._beep({ freq: 660, type: 'square', duration: 0.12, vol: 0.25, delay: 0.02 });
    this._noise({ duration: 0.05, vol: 0.15, delay: 0.01 });
  }

  // Armor piece dropping on floor
  armorDrop() {
    this._beep({ freq: 220, type: 'sawtooth', duration: 0.25, vol: 0.35 });
    this._beep({ freq: 180, type: 'square', duration: 0.15, vol: 0.2, delay: 0.05 });
    this._noise({ duration: 0.12, vol: 0.2, delay: 0.03 });
  }

  // Player attack grunt
  attackGrunt() {
    this._beep({ freq: 200, type: 'square', duration: 0.08, vol: 0.25 });
    this._beep({ freq: 160, type: 'square', duration: 0.06, vol: 0.2, delay: 0.07 });
  }

  // Block success
  blockSuccess() {
    this._beep({ freq: 500, type: 'square', duration: 0.1, vol: 0.3 });
    this._beep({ freq: 700, type: 'square', duration: 0.08, vol: 0.2, delay: 0.06 });
  }

  // Player hit
  playerHit() {
    this._beep({ freq: 150, type: 'sawtooth', duration: 0.3, vol: 0.5 });
    this._noise({ duration: 0.2, vol: 0.3, delay: 0.02 });
  }

  // Enemy death
  enemyDeath() {
    this._beep({ freq: 400, type: 'square', duration: 0.08, vol: 0.35 });
    this._beep({ freq: 300, type: 'square', duration: 0.08, vol: 0.3, delay: 0.08 });
    this._beep({ freq: 200, type: 'square', duration: 0.1, vol: 0.25, delay: 0.16 });
    this._beep({ freq: 150, type: 'sawtooth', duration: 0.15, vol: 0.2, delay: 0.25 });
  }

  // Jump
  jump() {
    const ctx = this.ctx;
    if (!this.enabled || !ctx) return;
    this._resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(500, t + 0.12);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Stage clear fanfare
  stageClear() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      this._beep({ freq: f, type: 'square', duration: 0.15, vol: 0.4, delay: i * 0.14 });
    });
  }

  // Arrow/trap
  arrowShoot() {
    const ctx = this.ctx;
    if (!this.enabled || !ctx) return;
    this._resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(300, t + 0.12);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  // Rock fall
  rockFall() {
    this._noise({ duration: 0.3, vol: 0.4 });
    this._beep({ freq: 80, type: 'sawtooth', duration: 0.25, vol: 0.3, delay: 0.05 });
  }

  // Game over
  gameOver() {
    const notes = [400, 350, 300, 200];
    notes.forEach((f, i) => {
      this._beep({ freq: f, type: 'sawtooth', duration: 0.22, vol: 0.45, delay: i * 0.2 });
    });
  }
}
