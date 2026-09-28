class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.8;
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  getMasterGain() {
    if (!this.ctx) this.init();
    if (!this.ctx) return null;
    const gain = this.ctx.createGain();
    gain.gain.value = this.enabled ? this.volume : 0;
    gain.connect(this.ctx.destination);
    return gain;
  }

  playDiceRoll() {
    const master = this.getMasterGain();
    if (!master) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.05 + Math.random() * 0.02;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(140 + Math.random() * 200, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.04);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.045);
    }
  }

  playDiceBounce() {
    const master = this.getMasterGain();
    if (!master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playPawnHop() {
    const master = this.getMasterGain();
    if (!master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playCoin() {
    const master = this.getMasterGain();
    if (!master) return;
    const now = this.ctx.currentTime;
    [987.77, 1318.51, 1975.53].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.04;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  playCashRegister() {
    const master = this.getMasterGain();
    if (!master) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1567.98, now);
    g1.gain.setValueAtTime(0.4, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(g1);
    g1.connect(master);
    osc1.start(now);
    osc1.stop(now + 0.52);

    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(2093.00, now + 0.12);
    g2.gain.setValueAtTime(0.45, now + 0.12);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(g2);
    g2.connect(master);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.62);
  }

  playWheelTick() {
    const master = this.getMasterGain();
    if (!master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.02);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  playFanfare() {
    const master = this.getMasterGain();
    if (!master) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = this.ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.1;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (i === 3 ? 0.8 : 0.25));
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + (i === 3 ? 0.85 : 0.26));
    });
  }

  playJail() {
    const master = this.getMasterGain();
    if (!master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.4);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  playHammer() {
    const master = this.getMasterGain();
    if (!master) return;
    const now = this.ctx.currentTime;
    [0, 0.12].forEach((offset) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + offset;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(500, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.05);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.06);
    });
  }

  playMortgage() {
    const master = this.getMasterGain();
    if (!master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  playButton() {
    const master = this.getMasterGain();
    if (!master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}

const sounds = new SoundEngine();
if (typeof module !== "undefined" && module.exports) {
  module.exports = { SoundEngine, sounds };
}
