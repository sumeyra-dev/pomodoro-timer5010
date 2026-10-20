/**
 * FocusFlow Pomodoro - Sound Engine
 * Features:
 *  - Real Ambient Sound Player (Rain, Fireplace, Cafe Jazz) with HTML5 Audio & smooth fading
 *  - Organic Notification Chimes & Mechanical Click (Web Audio API)
 *  - Multiple Chime Styles (Crystal Bell, Modern Marimba, Tibetan Bowl, Digital)
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterChimeVolume = 0.8;
    this.selectedChimeStyle = 'bell'; // 'bell', 'marimba', 'tibetan', 'digital'

    // Ambient Tracks System
    this.masterAmbienceVolume = 0.65;
    this.isMuted = false;
    this.previousVolume = 0.65;

    this.tracks = {
      natureRain: {
        id: 'natureRain',
        name: 'Doğa Yağmuru',
        icon: '🌧️',
        file: 'sounds/nature_rain.wav',
        audio: null,
        isPlaying: false,
        fadeInterval: null
      },
      rain: {
        id: 'rain',
        name: 'Sağanak',
        icon: '⛈️',
        file: 'sounds/rain.mp3',
        audio: null,
        isPlaying: false,
        fadeInterval: null
      },
      fire: {
        id: 'fire',
        name: 'Şömine',
        icon: '🔥',
        file: 'sounds/fireplace.mp3',
        audio: null,
        isPlaying: false,
        fadeInterval: null
      },
      jazz: {
        id: 'jazz',
        name: 'Kafe Caz',
        icon: '☕',
        file: 'sounds/jazz.mp3',
        audio: null,
        isPlaying: false,
        fadeInterval: null
      }
    };

    this.initAudioElements();
    this.initMediaSession();
  }

  // Media Session API for Lock Screen & Background Playback on iOS / Android
  initMediaSession() {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        const active = Object.values(this.tracks).filter(t => t.isPlaying);
        if (active.length === 0) {
          this.startTrack('rain');
        } else {
          active.forEach(t => {
            if (t.audio && t.audio.paused) {
              t.audio.play().catch(() => {});
            }
          });
        }
        navigator.mediaSession.playbackState = 'playing';
        if (typeof window.syncAmbienceUI === 'function') {
          window.syncAmbienceUI();
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        Object.values(this.tracks).forEach(t => {
          if (t.audio && t.isPlaying) {
            t.audio.pause();
          }
        });
        navigator.mediaSession.playbackState = 'paused';
        if (typeof window.syncAmbienceUI === 'function') {
          window.syncAmbienceUI();
        }
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        this.stopAllTracks();
        navigator.mediaSession.playbackState = 'none';
        if (typeof window.syncAmbienceUI === 'function') {
          window.syncAmbienceUI();
        }
      });
    } catch (e) {
      console.warn('MediaSession handler setup notice:', e);
    }
  }

  // Update Lock Screen & Dynamic Island metadata
  updateMediaSession() {
    if (!('mediaSession' in navigator)) return;

    const activeTracks = Object.values(this.tracks).filter(t => t.isPlaying);

    if (activeTracks.length === 0) {
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    navigator.mediaSession.playbackState = 'playing';
    const trackNames = activeTracks.map(t => `${t.icon} ${t.name}`).join(' + ');

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${trackNames} Ambiyansı`,
        artist: 'FocusFlow 🌱 Pomodoro',
        album: '50/10 Derin Odaklanma',
        artwork: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });
    } catch (e) {
      console.warn('MediaSession metadata notice:', e);
    }
  }

  // Ensure AudioContext is initialized upon user interaction
  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Pre-load audio elements attached to DOM for guaranteed mobile background playback
  initAudioElements() {
    let pool = document.getElementById('audio-pool');
    if (!pool && typeof document !== 'undefined' && document.body) {
      pool = document.createElement('div');
      pool.id = 'audio-pool';
      pool.style.cssText = 'position:fixed;bottom:0;left:0;width:0;height:0;opacity:0;pointer-events:none;z-index:-999;';
      pool.setAttribute('aria-hidden', 'true');
      document.body.appendChild(pool);
    }

    Object.values(this.tracks).forEach(track => {
      try {
        let audio = pool ? pool.querySelector(`#audio-track-${track.id}`) : null;
        if (!audio) {
          audio = document.createElement('audio');
          audio.id = `audio-track-${track.id}`;
          audio.src = track.file;
          audio.loop = true;
          audio.preload = 'auto';
          audio.volume = 0;

          // Critical mobile background attributes (iOS Safari & Android Chrome)
          audio.setAttribute('playsinline', '');
          audio.setAttribute('webkit-playsinline', '');
          audio.setAttribute('crossorigin', 'anonymous');
          audio.playsInline = true;

          // Fallback loop guardian if background tab loop event is delayed by OS
          audio.addEventListener('ended', () => {
            if (track.isPlaying) {
              audio.currentTime = 0;
              audio.play().catch(e => console.warn('Background loop restart:', e));
            }
          });

          if (pool) {
            pool.appendChild(audio);
          }
        }
        track.audio = audio;
      } catch (e) {
        console.warn('Audio initialization error for', track.id, e);
      }
    });
  }

  /* ================= AMBIENT TRACK CONTROLS ================= */

  /**
   * Start an ambient track with smooth fade-in
   */
  startTrack(id) {
    const track = this.tracks[id];
    if (!track) return false;

    this.initContext();

    if (!track.audio) {
      track.audio = new Audio(track.file);
      track.audio.loop = true;
    }

    if (track.fadeInterval) {
      clearInterval(track.fadeInterval);
      track.fadeInterval = null;
    }

    const targetVolume = this.isMuted ? 0 : this.masterAmbienceVolume;
    track.audio.volume = Math.max(0, Math.min(1, track.audio.volume || 0));

    const playPromise = track.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn(`Playback prevented for ${id}:`, err);
      });
    }

    track.isPlaying = true;
    this.updateMediaSession();

    // Smooth fade-in over 350ms
    const step = 0.05;
    track.fadeInterval = setInterval(() => {
      if (!track.isPlaying || !track.audio) {
        clearInterval(track.fadeInterval);
        return;
      }
      if (track.audio.volume + step >= targetVolume) {
        track.audio.volume = targetVolume;
        clearInterval(track.fadeInterval);
        track.fadeInterval = null;
      } else {
        track.audio.volume = Math.min(targetVolume, track.audio.volume + step);
      }
    }, 25);

    return true;
  }

  /**
   * Stop an ambient track with smooth fade-out
   */
  stopTrack(id) {
    const track = this.tracks[id];
    if (!track || !track.audio) return false;

    if (track.fadeInterval) {
      clearInterval(track.fadeInterval);
      track.fadeInterval = null;
    }

    track.isPlaying = false;
    this.updateMediaSession();

    // Smooth fade-out over 300ms
    const step = 0.08;
    track.fadeInterval = setInterval(() => {
      if (!track.audio) {
        clearInterval(track.fadeInterval);
        return;
      }
      if (track.audio.volume - step <= 0.01) {
        track.audio.volume = 0;
        track.audio.pause();
        clearInterval(track.fadeInterval);
        track.fadeInterval = null;
      } else {
        track.audio.volume = Math.max(0, track.audio.volume - step);
      }
    }, 25);

    return false;
  }

  /**
   * Toggle an ambient track (play / stop)
   */
  toggleTrack(id) {
    const track = this.tracks[id];
    if (!track) return false;

    if (track.isPlaying) {
      this.stopTrack(id);
      return false;
    } else {
      this.startTrack(id);
      return true;
    }
  }

  /**
   * Stop all ambient tracks
   */
  stopAllTracks() {
    Object.keys(this.tracks).forEach(id => {
      if (this.tracks[id].isPlaying) {
        this.stopTrack(id);
      }
    });
    this.updateMediaSession();
  }

  /**
   * Check if a specific track is currently playing
   */
  isTrackPlaying(id) {
    return !!(this.tracks[id] && this.tracks[id].isPlaying);
  }

  /**
   * Check if any ambient track is currently playing
   */
  hasActiveTracks() {
    return Object.values(this.tracks).some(t => t.isPlaying);
  }

  /**
   * Set master volume for all ambient tracks (0 to 1)
   */
  setAmbienceVolume(val0to1) {
    this.masterAmbienceVolume = Math.max(0, Math.min(1, val0to1));
    if (this.masterAmbienceVolume > 0 && this.isMuted) {
      this.isMuted = false;
    }
    if (!this.isMuted) {
      Object.values(this.tracks).forEach(track => {
        if (track.isPlaying && track.audio) {
          track.audio.volume = this.masterAmbienceVolume;
        }
      });
    }
  }

  /**
   * Toggle mute / unmute for all ambient tracks
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    const targetVolume = this.isMuted ? 0 : this.masterAmbienceVolume;

    Object.values(this.tracks).forEach(track => {
      if (track.audio) {
        track.audio.volume = track.isPlaying ? targetVolume : 0;
      }
    });

    return this.isMuted;
  }

  /* ================= NOTIFICATION & CLICK SOUNDS ================= */

  /**
   * Play an organic mechanical click (tactile button feedback)
   */
  playClick() {
    try {
      this.initContext();
      if (!this.ctx) return;
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
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

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
      if (!this.ctx) return;
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
      if (!this.ctx) return;
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
      if (!this.ctx) return;
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

  setChimeVolume(val0to1) {
    this.masterChimeVolume = Math.max(0, Math.min(1, val0to1));
  }

  setChimeStyle(style) {
    this.selectedChimeStyle = style;
  }
}

// Global singleton instance
window.soundEngine = new SoundEngine();
