// Procedural Web Audio API synthesizer for STARSHIP 2.0 soundscape

class StarshipAudio {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private musicOsc1: OscillatorNode | null = null;
  private musicOsc2: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;
  private musicEnabled = false;
  private muted = false;
  private initialized = false;

  init() {
    if (this.initialized) {
      if (this.ctx?.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.engineOsc = this.ctx.createOscillator();
      this.subOsc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 52;
      this.subOsc.type = 'sine';
      this.subOsc.frequency.value = 34;

      filter.type = 'lowpass';
      filter.frequency.value = 140;

      this.engineGain.gain.value = 0.0;

      this.engineOsc.connect(filter);
      this.subOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.subOsc.start();

      // Ambient deep-space synth pad (toggleable Space Radio)
      this.musicOsc1 = this.ctx.createOscillator();
      this.musicOsc2 = this.ctx.createOscillator();
      const musicFilter = this.ctx.createBiquadFilter();
      this.musicGain = this.ctx.createGain();
      this.musicOsc1.type = 'sine';
      this.musicOsc1.frequency.value = 110;
      this.musicOsc2.type = 'triangle';
      this.musicOsc2.frequency.value = 164.81;
      musicFilter.type = 'lowpass';
      musicFilter.frequency.value = 280;
      this.musicGain.gain.value = 0;
      this.musicOsc1.connect(musicFilter);
      this.musicOsc2.connect(musicFilter);
      musicFilter.connect(this.musicGain);
      this.musicGain.connect(this.ctx.destination);
      this.musicOsc1.start();
      this.musicOsc2.start();

      this.initialized = true;
    } catch {
      // Ignore if audio context is blocked
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(muted ? 0 : 0.025, this.ctx.currentTime, 0.1);
    }
  }

  isMuted() {
    return this.muted;
  }

  updateEngine(speedRatio: number, boost: boolean, enginesOnline: boolean, mutedMode = false) {
    if (!this.initialized || !this.ctx || !this.engineOsc || !this.subOsc || !this.engineGain) return;
    if (this.muted || !enginesOnline || mutedMode) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
      return;
    }
    const targetFreq = 48 + speedRatio * 68 + (boost ? 35 : 0);
    const targetGain = 0.016 + speedRatio * 0.024 + (boost ? 0.018 : 0);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
    this.subOsc.frequency.setTargetAtTime(targetFreq * 0.5, this.ctx.currentTime, 0.08);
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
  }

  playClick(pitch = 680) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, this.ctx.currentTime + 0.045);
    gain.gain.setValueAtTime(0.055, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.055);
  }

  playDoor() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.22);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playRadio() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [980, 1240].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.04, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.08);
    });
  }

  playWeld() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240 + Math.random() * 140, now);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playScan() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.45);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.52);
  }

  playWarp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 1.2);
    osc.frequency.exponentialRampToValueAtTime(120, now + 2.2);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 1.2);
    filter.frequency.exponentialRampToValueAtTime(150, now + 2.2);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 1.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.3);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 2.35);
  }

  playAlert(severity: 'LOW' | 'MODERATE' | 'CRITICAL' = 'MODERATE') {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = severity === 'CRITICAL' ? 'sawtooth' : 'square';

    if (severity === 'CRITICAL') {
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.linearRampToValueAtTime(340, now + 0.25);
      osc.frequency.setValueAtTime(720, now + 0.28);
      osc.frequency.linearRampToValueAtTime(340, now + 0.52);
      gain.gain.setValueAtTime(0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.56);
    } else {
      osc.frequency.setValueAtTime(severity === 'LOW' ? 440 : 540, now);
      osc.frequency.setValueAtTime(severity === 'LOW' ? 360 : 410, now + 0.09);
      gain.gain.setValueAtTime(0.032, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }

  toggleSpaceRadio(): boolean {
    this.init();
    this.musicEnabled = !this.musicEnabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicEnabled && !this.muted ? 0.028 : 0, this.ctx.currentTime, 0.35);
    }
    return this.musicEnabled;
  }

  playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.45);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  playTorpedo() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.3);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  playSuccess() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.05, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.24);
    });
  }
}

export const starshipAudio = new StarshipAudio();
