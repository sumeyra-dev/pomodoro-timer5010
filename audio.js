/**
 * FocusFlow Pomodoro - Web Audio API Sound Engine
 * Features:
 *  - Procedural Rain Audio Synthesizer (Zero external dependencies)
 *  - Organic Click Sounds & Notification Chimes (Break Start & Break End)
 *  - Multiple Chime Styles (Crystal Bell, Modern Marimba, Tibetan Bowl, Digital)
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isRainPlaying = false;
    this.rainGainNode = null;
    this.rainSource = null;
    this.rainLFO = null;
    this.rainDropInterval = null;
    this.masterChimeVolume = 0.8;
    this.masterRainVolume = 0.45;
    this.selectedChimeStyle = 'bell'; // 'bell', 'marimba', 'tibetan', 'digital'
    this.selectedRainStyle = 'gentle'; // 'gentle', 'heavy', 'cozy'
  }

  // Ensure AudioContext is initialized upon user interaction
  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /* ================= NOTIFICATION & CLICK SOUNDS ================= */

  /**
   * Play an organic mechanical click (tactile button feedback)
   */
  playClick() {
    try {
      this.initContext();
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.setValueAtTime(3, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      gain.gain.setValueAtTime(0.3 * this.masterChimeVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn('Audio click error:', e);
    }
  }

  /**
   * Sound played when Focus session ends and Break starts
   * Pleasant, relaxing, warm chime
   */
  playBreakStart() {
    this.playClick();
    setTimeout(() => {
      switch (this.selectedChimeStyle) {
        case 'marimba':
          this.playMarimbaChime([523.25, 659.25, 783.99]); // C5, E5, G5
          break;
        case 'tibetan':
          this.playTibetanBowl(440, 2.5);
          break;
        case 'digital':
          this.playDigitalBeep([659.25, 880]);
          break;
        case 'bell':
        default:
          this.playCrystalBell([659.25, 830.61, 987.77]); // E5, G#5, B5 peaceful major triad
          break;
      }
    }, 60);
  }

  /**
   * Sound played when Break ends and Work begins
   * Uplifting, refocusing two-tone chime
   */
  playBreakEnd() {
    this.playClick();
    setTimeout(() => {
      switch (this.selectedChimeStyle) {
        case 'marimba':
          this.playMarimbaChime([440, 554.37, 659.25, 880]); // A4, C#5, E5, A5
          break;
        case 'tibetan':
          this.playTibetanBowl(523.25, 2.8);
          break;
        case 'digital':
          this.playDigitalBeep([587.33, 880, 1174.66]);
          break;
        case 'bell':
        default:
          this.playCrystalBell([523.25, 659.25, 1046.5]); // C5, E5, C6 uplifting bright
          break;
      }
    }, 60);
  }

  /**
   * Crystal Bell synthesizer with realistic natural overtone decay
   */
  playCrystalBell(freqs = [659.25, 830.61, 987.77]) {
    try {
      this.initContext();
      const now = this.ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        // Gentle metallic harmonic overtone
        const overtoneOsc = this.ctx.createOscillator();
        const overtoneGain = this.ctx.createGain();
        overtoneOsc.type = 'sine';
        overtoneOsc.frequency.setValueAtTime(freq * 2.76, now + delay);

        const baseVol = (0.28 / (idx + 1)) * this.masterChimeVolume;
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(baseVol, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 2.2);

        overtoneGain.gain.setValueAtTime(0, now + delay);
        overtoneGain.gain.linearRampToValueAtTime(baseVol * 0.35, now + delay + 0.015);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        overtoneOsc.connect(overtoneGain);
        overtoneGain.connect(this.ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 2.3);

        overtoneOsc.start(now + delay);
        overtoneOsc.stop(now + delay + 1.3);
      });
    } catch (e) {
      console.warn('Bell audio error:', e);
    }
  }

  /**
   * Warm wooden Marimba tone synthesizer
   */
  playMarimbaChime(freqs = [523.25, 659.25, 783.99]) {
    try {
      this.initContext();
      const now = this.ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = idx * 0.09;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        const vol = 0.35 * this.masterChimeVolume;
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(vol, now + delay + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.85);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.9);
      });
    } catch (e) {
      console.warn('Marimba error:', e);
    }
  }

  /**
   * Tibetan Singing Bowl (Zen harmonic drone)
   */
  playTibetanBowl(fundamental = 440, duration = 3.0) {
    try {
      this.initContext();
      const now = this.ctx.currentTime;

      const harmonics = [1, 2.76, 5.4, 8.9];
      const weights = [0.4, 0.22, 0.08, 0.03];

      harmonics.forEach((h, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamental * h, now);

        const vol = weights[i] * this.masterChimeVolume;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });
    } catch (e) {
      console.warn('Tibetan bowl error:', e);
    }
  }

  /**
   * Crisp Digital Beep
   */
  playDigitalBeep(freqs = [659.25, 880]) {
    try {
      this.initContext();
      const now = this.ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = idx * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.25 * this.masterChimeVolume, now + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.14);
      });
    } catch (e) {
      console.warn('Digital beep error:', e);
    }
  }

  /* ================= PROCEDURAL RAIN AUDIO GENERATOR ================= */

  /**
   * Creates a multi-layer realistic rainfall sound using procedural noise
   * and dual resonant filters modulated by a gentle organic breeze LFO.
   */
  startRain() {
    if (this.isRainPlaying) return;
    try {
      this.initContext();
      const now = this.ctx.currentTime;

      // Create 5 seconds looping pink/brownian noise buffer
      const bufferSize = this.ctx.sampleRate * 5;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Pink noise filtering algorithm
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }

      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = noiseBuffer;
      this.rainSource.loop = true;

      // Low-pass filter for rain depth
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      let cutoff = 850;
      if (this.selectedRainStyle === 'heavy') cutoff = 1300;
      if (this.selectedRainStyle === 'cozy') cutoff = 650;
      lowpass.frequency.setValueAtTime(cutoff, now);

      // High-pass filter to clean muddy rumble
      const highpass = this.ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(140, now);

      // LFO for subtle natural undulating rain intensity
      this.rainLFO = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      this.rainLFO.frequency.setValueAtTime(0.2, now); // slow 0.2 Hz cycle
      lfoGain.gain.setValueAtTime(120, now);
      this.rainLFO.connect(lfoGain);
      lfoGain.connect(lowpass.frequency);
      this.rainLFO.start(now);

      // Rain Master Gain with smooth fade-in
      this.rainGainNode = this.ctx.createGain();
      this.rainGainNode.gain.setValueAtTime(0.001, now);
      this.rainGainNode.gain.linearRampToValueAtTime(this.masterRainVolume, now + 1.2);

      this.rainSource.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(this.rainGainNode);
      this.rainGainNode.connect(this.ctx.destination);

      this.rainSource.start(now);
      this.isRainPlaying = true;

      // Trigger subtle droplet splatters
      this.startRainDroplets();
    } catch (e) {
      console.warn('Start rain error:', e);
    }
  }

  /**
   * Procedural tiny water droplet clicks for realism
   */
  startRainDroplets() {
    this.rainDropInterval = setInterval(() => {
      if (!this.isRainPlaying || !this.ctx) return;
      if (Math.random() > 0.45) return;

      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const dropGain = this.ctx.createGain();
        const dropFilter = this.ctx.createBiquadFilter();

        const dropFreq = 1800 + Math.random() * 2200;
        dropFilter.type = 'bandpass';
        dropFilter.frequency.setValueAtTime(dropFreq, now);
        dropFilter.Q.setValueAtTime(8, now);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(dropFreq, now);
        osc.frequency.exponentialRampToValueAtTime(dropFreq * 0.4, now + 0.03);

        const dropVol = (0.02 + Math.random() * 0.04) * this.masterRainVolume;
        dropGain.gain.setValueAtTime(dropVol, now);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

        osc.connect(dropFilter);
        dropFilter.connect(dropGain);
        dropGain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.045);
      } catch (err) {
        // ignore droplet glitch
      }
    }, 180);
  }

  /**
   * Stop rain with smooth fade-out
   */
  stopRain() {
    if (!this.isRainPlaying) return;
    try {
      if (this.rainDropInterval) {
        clearInterval(this.rainDropInterval);
        this.rainDropInterval = null;
      }

      if (this.rainGainNode && this.ctx) {
        const now = this.ctx.currentTime;
        this.rainGainNode.gain.linearRampToValueAtTime(0.001, now + 0.8);
        setTimeout(() => {
          if (this.rainSource) {
            try { this.rainSource.stop(); } catch(e){}
            this.rainSource.disconnect();
            this.rainSource = null;
          }
          if (this.rainLFO) {
            try { this.rainLFO.stop(); } catch(e){}
            this.rainLFO.disconnect();
            this.rainLFO = null;
          }
          this.isRainPlaying = false;
        }, 850);
      } else {
        this.isRainPlaying = false;
      }
    } catch (e) {
      this.isRainPlaying = false;
    }
  }

  setRainVolume(val0to1) {
    this.masterRainVolume = Math.max(0, Math.min(1, val0to1));
    if (this.rainGainNode && this.ctx && this.isRainPlaying) {
      this.rainGainNode.gain.setValueAtTime(this.masterRainVolume, this.ctx.currentTime);
    }
  }

  setChimeVolume(val0to1) {
    this.masterChimeVolume = Math.max(0, Math.min(1, val0to1));
  }

  setChimeStyle(style) {
    this.selectedChimeStyle = style;
  }

  setRainStyle(style) {
    this.selectedRainStyle = style;
    // Restart rain if already active to apply filter change
    if (this.isRainPlaying) {
      this.stopRain();
      setTimeout(() => this.startRain(), 900);
    }
  }
}

// Global singleton instance
window.soundEngine = new SoundEngine();
