/**
 * FocusFlow Pomodoro Timer - Application Logic
 * Default: 50 min work, 10 min break | 4 Sessions Cycle
 * Confetti & Rain Animations, Web Audio API integration,
 * LocalStorage persistence, Theme & Dark Mode controls.
 */

// Application State
const state = {
  // Configurable Durations (seconds)
  workDuration: 50 * 60,      // 50 minutes
  shortBreakDuration: 10 * 60, // 10 minutes
  longBreakDuration: 20 * 60,  // 20 minutes
  totalCycleSessions: 4,

  // Runtime State
  currentMode: 'work',        // 'work' | 'shortBreak' | 'longBreak'
  currentSession: 1,          // 1 to totalCycleSessions
  timeLeft: 50 * 60,
  isRunning: false,
  timerInterval: null,
  endTime: null,

  // Settings & Preferences
  themeColor: 'green',        // 'green' | 'pink'
  themeMode: 'light',         // 'light' | 'dark'
  soundEnabled: true,
  autoStartBreaks: true,
  autoStartFocus: false,

  // Ambience System
  activeSounds: {
    natureRain: false,
    rain: false,
    fire: false,
    jazz: false
  },
  ambienceVolume: 0.65,
  isMuted: false,

  // Stats & Tasks
  completedSessions: 0,
  totalFocusMinutes: 0,
  dailyStreak: 1,
  tasks: []
};

// Quotes Database
const motivationalQuotes = [
  { text: "Büyük hedeflere, tek bir 50 dakikalık odaklanmayla ulaşılır.", author: "Odaklanma Sanatı" },
  { text: "Zaman en adil sermayedir; ona nasıl yön vereceğin senin elinde.", author: "Seneca" },
  { text: "Derin çalışma, yüzeysel dünyanın süper gücüdür.", author: "Cal Newport" },
  { text: "Küçük adımların istikrarı, büyük sıçramalardan daha güçlüdür.", author: "James Clear" },
  { text: "Her 50 dakikalık odak, seni hayallerine bir adım daha yaklaştırır.", author: "FocusFlow" },
  { text: "Dinlenmeyi bilmeyen, üretmeyi de bilemez. Molanın tadını çıkar!", author: "Zihin Dengesi" }
];

/* ================= DOM ELEMENTS ================= */
const timeDisplay = document.getElementById('time-display');
const timerSubtext = document.getElementById('timer-subtext');
const startPauseBtn = document.getElementById('start-pause-btn');
const startBtnLabel = document.getElementById('start-btn-label');
const playIcon = startPauseBtn.querySelector('.play-icon');
const pauseIcon = startPauseBtn.querySelector('.pause-icon');
const resetBtn = document.getElementById('reset-btn');
const skipBtn = document.getElementById('skip-btn');
const progressIndicator = document.getElementById('progress-indicator');
const sessionText = document.getElementById('session-text');
const modeStatusLabel = document.getElementById('mode-status-label');
const sessionDotsContainer = document.getElementById('session-dots-container');
const modeTabs = document.querySelectorAll('.mode-tab');

// Theme DOM
const htmlRoot = document.documentElement;
const themeGreenBtn = document.getElementById('theme-green-btn');
const themePinkBtn = document.getElementById('theme-pink-btn');
const darkModeBtn = document.getElementById('dark-mode-btn');

// Ambience Dock DOM
const soundNatureRainBtn = document.getElementById('sound-natureRain-btn');
const soundRainBtn = document.getElementById('sound-rain-btn');
const soundFireBtn = document.getElementById('sound-fire-btn');
const soundJazzBtn = document.getElementById('sound-jazz-btn');
const ambienceVolumeSlider = document.getElementById('ambience-volume-slider');
const ambienceVolLabel = document.getElementById('ambience-vol-label');
const ambienceMuteBtn = document.getElementById('ambience-mute-btn');
const ambienceVolIcon = document.getElementById('ambience-vol-icon');
const ambientCanvas = document.getElementById('ambient-canvas') || document.getElementById('rain-canvas');

// Celebration DOM
const celebrationOverlay = document.getElementById('celebration-overlay');
const celebrationTitle = document.getElementById('celebration-title');
const celebrationSubtitle = document.getElementById('celebration-subtitle');
const dismissCelebrationBtn = document.getElementById('dismiss-celebration-btn');
const breakMiniTimer = document.getElementById('break-mini-timer');
const confettiCanvas = document.getElementById('confetti-canvas');

// Tasks & Stats DOM
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const taskStatsLabel = document.getElementById('task-stats-label');
const completedSessionsCount = document.getElementById('completed-sessions-count');
const totalFocusMinutesCount = document.getElementById('total-focus-minutes');
const dailyStreakCount = document.getElementById('daily-streak');
const resetStatsBtn = document.getElementById('reset-stats-btn');
const quoteText = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');

// Settings Modal DOM
const settingsModal = document.getElementById('settings-modal');
const settingsOpenBtn = document.getElementById('settings-open-btn');
const settingsCloseBtn = document.getElementById('settings-close-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const resetSettingsBtn = document.getElementById('reset-settings-btn');
const workDurationInput = document.getElementById('work-duration-input');
const shortBreakInput = document.getElementById('short-break-input');
const longBreakInput = document.getElementById('long-break-input');
const cycleCountInput = document.getElementById('cycle-count-input');
const soundAlertsToggle = document.getElementById('sound-alerts-toggle');
const chimeToneSelect = document.getElementById('chime-tone-select');
const chimeVolumeInput = document.getElementById('chime-volume');
const testChimeBtn = document.getElementById('test-chime-btn');
const rainStyleSelect = document.getElementById('rain-style-select');
const autoBreakToggle = document.getElementById('auto-break-toggle');
const autoFocusToggle = document.getElementById('auto-focus-toggle');
const requestNotifyBtn = document.getElementById('request-notify-btn');

/* ================= STORAGE PERSISTENCE ================= */
function loadStorage() {
  try {
    const saved = localStorage.getItem('focusflow_pomodoro_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.workDuration) state.workDuration = parsed.workDuration;
      if (parsed.shortBreakDuration) state.shortBreakDuration = parsed.shortBreakDuration;
      if (parsed.longBreakDuration) state.longBreakDuration = parsed.longBreakDuration;
      if (parsed.totalCycleSessions) state.totalCycleSessions = parsed.totalCycleSessions;
      if (parsed.themeColor) state.themeColor = parsed.themeColor;
      if (parsed.themeMode) state.themeMode = parsed.themeMode;
      if (parsed.soundEnabled !== undefined) state.soundEnabled = parsed.soundEnabled;
      if (parsed.completedSessions) state.completedSessions = parsed.completedSessions;
      if (parsed.totalFocusMinutes) state.totalFocusMinutes = parsed.totalFocusMinutes;
      if (parsed.dailyStreak) state.dailyStreak = parsed.dailyStreak;
      if (parsed.tasks) state.tasks = parsed.tasks;
      if (parsed.autoStartBreaks !== undefined) state.autoStartBreaks = parsed.autoStartBreaks;
      if (parsed.autoStartFocus !== undefined) state.autoStartFocus = parsed.autoStartFocus;
      if (parsed.ambienceVolume !== undefined) state.ambienceVolume = parsed.ambienceVolume;
    }
  } catch (e) {
    console.warn('Storage read error:', e);
  }
}

function saveStorage() {
  try {
    const dataToSave = {
      workDuration: state.workDuration,
      shortBreakDuration: state.shortBreakDuration,
      longBreakDuration: state.longBreakDuration,
      totalCycleSessions: state.totalCycleSessions,
      themeColor: state.themeColor,
      themeMode: state.themeMode,
      soundEnabled: state.soundEnabled,
      completedSessions: state.completedSessions,
      totalFocusMinutes: state.totalFocusMinutes,
      dailyStreak: state.dailyStreak,
      tasks: state.tasks,
      autoStartBreaks: state.autoStartBreaks,
      autoStartFocus: state.autoStartFocus,
      ambienceVolume: state.ambienceVolume
    };
    localStorage.setItem('focusflow_pomodoro_state', JSON.stringify(dataToSave));
  } catch (e) {
    console.warn('Storage write error:', e);
  }
}

/* ================= FORMATTING & UI HELPERS ================= */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getCurrentTotalDuration() {
  if (state.currentMode === 'work') return state.workDuration;
  if (state.currentMode === 'shortBreak') return state.shortBreakDuration;
  return state.longBreakDuration;
}

function updateProgressRing() {
  const total = getCurrentTotalDuration();
  const radius = 142; // Fixed to SVG viewBox (320x320)
  const circumference = 2 * Math.PI * radius; // ~892.21
  progressIndicator.style.strokeDasharray = `${circumference}`;
  
  const fraction = Math.max(0, Math.min(1, state.timeLeft / total));
  // Count down from full to empty
  const offset = circumference * (1 - fraction);
  progressIndicator.style.strokeDashoffset = offset;
}

function renderSessionDots() {
  sessionDotsContainer.innerHTML = '';
  for (let i = 1; i <= state.totalCycleSessions; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.dataset.index = i;
    dot.innerHTML = `<span>${i}</span>`;

    if (i < state.currentSession) {
      dot.classList.add('completed');
    } else if (i === state.currentSession) {
      dot.classList.add('active');
    }
    sessionDotsContainer.appendChild(dot);
  }
}

function updateDisplay() {
  const timeStr = formatTime(state.timeLeft);
  timeDisplay.textContent = timeStr;

  // Title icon & text
  const modeEmoji = state.currentMode === 'work' ? '🎯' : '☕';
  document.title = `(${timeStr}) ${modeEmoji} FocusFlow Pomodoro`;

  // Mini timer in celebration modal if active
  if (breakMiniTimer) {
    breakMiniTimer.textContent = timeStr;
  }

  // Update Progress Circle
  updateProgressRing();

  // Mode status label & subtext
  if (state.currentMode === 'work') {
    sessionText.textContent = `Seans ${state.currentSession} / ${state.totalCycleSessions}`;
    modeStatusLabel.textContent = 'Odaklanma Vakti';
    timerSubtext.textContent = 'Derin odaklanma modu (50 dk)';
  } else if (state.currentMode === 'shortBreak') {
    sessionText.textContent = `Mola Zamanı ☕`;
    modeStatusLabel.textContent = 'Kısa Mola (10 dk)';
    timerSubtext.textContent = 'Gözlerini dinlendir ve su iç';
  } else {
    sessionText.textContent = `Büyük Mola 🌴`;
    modeStatusLabel.textContent = 'Uzun Mola (20 dk)';
    timerSubtext.textContent = 'Tüm döngü bitti! Harika iş!';
  }

  // Active Tab Highlight
  modeTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === state.currentMode);
  });

  renderSessionDots();
}

/* ================= TIMER CONTROLS ================= */
function startTimer() {
  if (state.isRunning) return;

  // Web Audio Context unlock on first user click
  if (window.soundEngine) {
    window.soundEngine.initContext();
  }

  state.isRunning = true;
  state.endTime = Date.now() + state.timeLeft * 1000;

  playIcon.classList.add('hidden');
  pauseIcon.classList.remove('hidden');
  startBtnLabel.textContent = 'Durdur';

  // Tick loop using timestamp diffs to avoid browser tab throttle drift
  state.timerInterval = setInterval(() => {
    const now = Date.now();
    const remainingMs = Math.max(0, state.endTime - now);
    state.timeLeft = Math.round(remainingMs / 1000);

    updateDisplay();

    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      state.isRunning = false;
      handleTimerCompletion();
    }
  }, 250);
}

function pauseTimer() {
  if (!state.isRunning) return;
  clearInterval(state.timerInterval);
  state.isRunning = false;

  playIcon.classList.remove('hidden');
  pauseIcon.classList.add('hidden');
  startBtnLabel.textContent = 'Başlat';
}

function resetTimer() {
  pauseTimer();
  state.timeLeft = getCurrentTotalDuration();
  updateDisplay();
}

function switchMode(newMode, autoStart = false) {
  pauseTimer();
  state.currentMode = newMode;
  state.timeLeft = getCurrentTotalDuration();
  updateDisplay();

  if (autoStart) {
    startTimer();
  }
}

/* ================= COMPLETION & CELEBRATION LOGIC ================= */
function handleTimerCompletion() {
  // If work session finished
  if (state.currentMode === 'work') {
    // Increment completed stats
    state.completedSessions++;
    const addedMinutes = Math.round(state.workDuration / 60);
    state.totalFocusMinutes += addedMinutes;
    saveStorage();
    renderStats();

    // Sound effect: Break start click / bell chime
    if (state.soundEnabled && window.soundEngine) {
      window.soundEngine.playBreakStart();
    }

    // Trigger Desktop Notification if permitted
    sendNotification(
      `🎉 Seans ${state.currentSession} Tamamlandı!`,
      `50 dakikalık odaklanmayı başarıyla bitirdin. 10 dakikalık mola zamanı!`
    );

    // Show Advanced Celebration Animation Modal!
    triggerCelebrationAnimation(state.currentSession);

    // Determine next mode: Long break if cycle finished, otherwise Short break
    const isCycleEnd = state.currentSession >= state.totalCycleSessions;
    const nextMode = isCycleEnd ? 'longBreak' : 'shortBreak';

    switchMode(nextMode, state.autoStartBreaks);

  } else {
    // Break finished!
    // Sound effect: Break end chime
    if (state.soundEnabled && window.soundEngine) {
      window.soundEngine.playBreakEnd();
    }

    // Dismiss celebration modal if still showing
    hideCelebrationAnimation();

    // Trigger Desktop Notification
    sendNotification(
      '☕ Mola Bitti!',
      'Yenilendin! Şimdi yeni bir seansa başlama vakti.'
    );

    // Advance session count
    if (state.currentMode === 'longBreak') {
      state.currentSession = 1;
    } else {
      state.currentSession = (state.currentSession % state.totalCycleSessions) + 1;
    }

    switchMode('work', state.autoStartFocus);
  }
}

/* ================= CELEBRATION ENGINE (CONFETTI & CARDS) ================= */
let confettiParticles = [];
let confettiAnimId = null;

function triggerCelebrationAnimation(sessionNumber) {
  celebrationTitle.textContent = `🎉 Session ${sessionNumber} Complete!`;
  celebrationSubtitle.textContent = `Harika bir odaklanma sergiledin. Şimdi 10 dakikalık hak ettiğin molanın tadını çıkar!`;

  celebrationOverlay.classList.remove('hidden');

  // Start Confetti Fireworks Physics
  startConfettiBurst();
}

function hideCelebrationAnimation() {
  celebrationOverlay.classList.add('hidden');
  stopConfetti();
}

function startConfettiBurst() {
  const canvas = confettiCanvas;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  confettiParticles = [];
  const colors = state.themeColor === 'pink' 
    ? ['#e91e63', '#f06292', '#f48fb1', '#ff4081', '#ffffff', '#ffd54f']
    : ['#2e7d32', '#4caf50', '#81c784', '#66bb6a', '#ffffff', '#ffd54f'];

  // Spawn 140 particles
  for (let i = 0; i < 140; i++) {
    confettiParticles.push({
      x: canvas.width / 2 + (Math.random() * 200 - 100),
      y: canvas.height * 0.45 + (Math.random() * 80 - 40),
      w: Math.random() * 10 + 6,
      h: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -14 - 4,
      gravity: 0.32,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 12,
      opacity: 1
    });
  }

  function renderConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    confettiParticles.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.985;
      p.rotation += p.vRotation;
      p.opacity -= 0.0035;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    confettiParticles = confettiParticles.filter(p => p.opacity > 0 && p.y < canvas.height + 50);

    if (confettiParticles.length > 0) {
      confettiAnimId = requestAnimationFrame(renderConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
  renderConfetti();
}

function stopConfetti() {
  if (confettiAnimId) {
    cancelAnimationFrame(confettiAnimId);
    confettiAnimId = null;
  }
  const ctx = confettiCanvas.getContext('2d');
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

/* ================= AMBIENT EFFECTS & CANVAS ================= */
let ambientAnimId = null;
let rainParticles = [];
let fireEmbers = [];
let jazzNotes = [];
let updateAmbientCanvasState = function() {};

function initAmbientCanvas() {
  const canvas = ambientCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Initialize rain drops
  rainParticles = [];
  for (let i = 0; i < 90; i++) {
    rainParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      length: Math.random() * 22 + 10,
      speed: Math.random() * 8 + 12,
      opacity: Math.random() * 0.4 + 0.15
    });
  }

  // Initialize warm fireplace embers
  fireEmbers = [];
  for (let i = 0; i < 45; i++) {
    fireEmbers.push({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 60,
      radius: Math.random() * 3 + 1.2,
      speedY: Math.random() * 1.8 + 0.8,
      speedX: (Math.random() - 0.5) * 1.2,
      opacity: Math.random() * 0.7 + 0.25,
      color: Math.random() > 0.4 ? '#ff7043' : (Math.random() > 0.5 ? '#ffa726' : '#ffca28')
    });
  }

  // Initialize jazz music symbols & sparkles
  const noteSymbols = ['♪', '♫', '♩', '✨', '☕'];
  jazzNotes = [];
  for (let i = 0; i < 22; i++) {
    jazzNotes.push({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 120,
      symbol: noteSymbols[Math.floor(Math.random() * noteSymbols.length)],
      size: Math.random() * 10 + 14,
      speedY: Math.random() * 1.1 + 0.6,
      sway: Math.random() * 2,
      swaySpeed: Math.random() * 0.03 + 0.015,
      opacity: Math.random() * 0.6 + 0.25
    });
  }

  function renderAmbient() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isRaining = state.activeSounds.natureRain || state.activeSounds.rain;
    const hasAnyActive = isRaining || state.activeSounds.fire || state.activeSounds.jazz;

    // 1. Render Rain Effect
    if (isRaining) {
      const strokeColor = state.themeColor === 'pink' ? '244, 143, 177' : '129, 199, 132';
      rainParticles.forEach(d => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${strokeColor}, ${d.opacity})`;
        ctx.lineWidth = 1.2;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 1.5, d.y + d.length);
        ctx.stroke();

        d.y += d.speed;
        d.x -= 0.6;
        if (d.y > canvas.height) {
          d.y = -20;
          d.x = Math.random() * canvas.width;
        }
      });
    }

    // 2. Render Fireplace Embers
    if (state.activeSounds.fire) {
      fireEmbers.forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fillStyle = e.color;
        ctx.globalAlpha = e.opacity;
        ctx.shadowBlur = 8;
        ctx.shadowColor = e.color;
        ctx.fill();

        e.y -= e.speedY;
        e.x += e.speedX + Math.sin(e.y * 0.02) * 0.6;
        e.opacity -= 0.0016;

        if (e.y < -20 || e.opacity <= 0) {
          e.y = canvas.height + Math.random() * 40;
          e.x = Math.random() * canvas.width;
          e.opacity = Math.random() * 0.7 + 0.3;
        }
      });
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // 3. Render Cafe Jazz Notes & Sparkles
    if (state.activeSounds.jazz) {
      const noteColor = state.themeColor === 'pink' ? '#f48fb1' : '#c8e6c9';
      jazzNotes.forEach(n => {
        ctx.save();
        ctx.font = `${n.size}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillStyle = noteColor;
        ctx.globalAlpha = n.opacity;
        ctx.shadowBlur = 6;
        ctx.shadowColor = noteColor;
        ctx.fillText(n.symbol, n.x + Math.sin(n.y * n.swaySpeed) * 15, n.y);
        ctx.restore();

        n.y -= n.speedY;
        if (n.y < -30) {
          n.y = canvas.height + Math.random() * 50;
          n.x = Math.random() * canvas.width;
        }
      });
      ctx.globalAlpha = 1;
    }

    if (hasAnyActive) {
      ambientAnimId = requestAnimationFrame(renderAmbient);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ambientAnimId = null;
    }
  }

  updateAmbientCanvasState = function() {
    const isRaining = state.activeSounds.natureRain || state.activeSounds.rain;
    const hasAnyActive = isRaining || state.activeSounds.fire || state.activeSounds.jazz;
    if (hasAnyActive) {
      canvas.classList.add('active');
      if (!ambientAnimId) {
        ambientAnimId = requestAnimationFrame(renderAmbient);
      }
    } else {
      canvas.classList.remove('active');
      if (ambientAnimId) {
        cancelAnimationFrame(ambientAnimId);
        ambientAnimId = null;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
}

function toggleAmbientSound(soundId) {
  if (window.soundEngine) {
    window.soundEngine.initContext();
    const isPlaying = window.soundEngine.toggleTrack(soundId);
    state.activeSounds[soundId] = isPlaying;

    const btn = document.getElementById(`sound-${soundId}-btn`);
    if (btn) {
      btn.classList.toggle('active', isPlaying);
    }

    updateAmbientCanvasState();
  }
}

// Synchronize UI if ambient sound playback is controlled via OS Lock Screen or Headphone buttons
window.syncAmbienceUI = function() {
  if (!window.soundEngine) return;
  ['natureRain', 'rain', 'fire', 'jazz'].forEach(soundId => {
    const isPlaying = window.soundEngine.isTrackPlaying(soundId);
    state.activeSounds[soundId] = isPlaying;
    const btn = document.getElementById(`sound-${soundId}-btn`);
    if (btn) {
      btn.classList.toggle('active', isPlaying);
    }
  });
  if (typeof updateAmbientCanvasState === 'function') {
    updateAmbientCanvasState();
  }
};

function updateAmbienceVolume(val) {
  state.ambienceVolume = Math.max(0, Math.min(1, val / 100));
  if (val === 0) {
    state.isMuted = true;
    if (ambienceVolIcon) ambienceVolIcon.textContent = '🔇';
  } else if (state.isMuted && val > 0) {
    state.isMuted = false;
    if (ambienceVolIcon) ambienceVolIcon.textContent = '🔊';
  }
  if (window.soundEngine) {
    window.soundEngine.setAmbienceVolume(state.ambienceVolume);
  }
  if (ambienceVolLabel) {
    ambienceVolLabel.textContent = `${val}%`;
  }
  saveStorage();
}

function toggleAmbienceMute() {
  if (window.soundEngine) {
    state.isMuted = window.soundEngine.toggleMute();
    if (ambienceVolIcon) {
      ambienceVolIcon.textContent = state.isMuted ? '🔇' : '🔊';
    }
  }
}

/* ================= THEMES & DARK MODE ================= */
function applyTheme(color, mode) {
  state.themeColor = color;
  state.themeMode = mode;

  htmlRoot.setAttribute('data-theme', color);
  htmlRoot.setAttribute('data-mode', mode);

  themeGreenBtn.classList.toggle('active', color === 'green');
  themePinkBtn.classList.toggle('active', color === 'pink');

  saveStorage();
  updateProgressRing();
}

function toggleThemeMode() {
  const newMode = state.themeMode === 'light' ? 'dark' : 'light';
  applyTheme(state.themeColor, newMode);
}

/* ================= TASKS MANAGER ================= */
function renderTasks() {
  taskList.innerHTML = '';
  let completedCount = 0;

  state.tasks.forEach((task, index) => {
    if (task.completed) completedCount++;

    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;

    li.innerHTML = `
      <div class="task-left">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-index="${index}">
        <span class="task-text">${escapeHtml(task.title)}</span>
      </div>
      <button class="task-delete-btn" data-index="${index}" title="Görevi Sil">✕</button>
    `;

    taskList.appendChild(li);
  });

  taskStatsLabel.textContent = `${completedCount}/${state.tasks.length} Tamamlandı`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function addTask(title) {
  if (!title.trim()) return;
  state.tasks.push({ title: title.trim(), completed: false });
  saveStorage();
  renderTasks();
}

function toggleTask(index) {
  if (state.tasks[index]) {
    state.tasks[index].completed = !state.tasks[index].completed;
    saveStorage();
    renderTasks();
  }
}

function deleteTask(index) {
  state.tasks.splice(index, 1);
  saveStorage();
  renderTasks();
}

/* ================= STATS & QUOTES ================= */
function renderStats() {
  completedSessionsCount.textContent = state.completedSessions;
  totalFocusMinutesCount.textContent = state.totalFocusMinutes;
  dailyStreakCount.textContent = `${state.dailyStreak} 🔥`;
}

function rotateQuote() {
  const q = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
  quoteText.textContent = `"${q.text}"`;
  quoteAuthor.textContent = `— ${q.author}`;
}

/* ================= DESKTOP NOTIFICATIONS ================= */
function sendNotification(title, body) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body,
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌱</text></svg>'
      });
    } catch (e) {
      console.warn('Notification error:', e);
    }
  }
}

function requestNotificationPermission() {
  if (typeof Notification === 'undefined') {
    alert('Tarayıcınız bildirimleri desteklemiyor veya izin verilmedi.');
    return;
  }
  try {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        requestNotifyBtn.textContent = 'Bildirimler Açık ✓';
        requestNotifyBtn.disabled = true;
      }
    }).catch(() => {});
  } catch (err) {
    console.warn('Notification request error:', err);
  }
}

/* ================= SETTINGS MODAL ================= */
function openSettings() {
  try {
    workDurationInput.value = Math.round(state.workDuration / 60);
    shortBreakInput.value = Math.round(state.shortBreakDuration / 60);
    longBreakInput.value = Math.round(state.longBreakDuration / 60);
    cycleCountInput.value = state.totalCycleSessions;
    soundAlertsToggle.checked = state.soundEnabled;
    autoBreakToggle.checked = state.autoStartBreaks;
    autoFocusToggle.checked = state.autoStartFocus;

    if (window.soundEngine) {
      chimeVolumeInput.value = Math.round(window.soundEngine.masterChimeVolume * 100);
      chimeToneSelect.value = window.soundEngine.selectedChimeStyle;
      rainStyleSelect.value = window.soundEngine.selectedRainStyle;
    }

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      requestNotifyBtn.textContent = 'Bildirimler Açık ✓';
      requestNotifyBtn.disabled = true;
    }
  } catch (err) {
    console.warn('Error preparing settings modal:', err);
  }

  settingsModal.classList.remove('hidden');
}

function closeSettings() {
  settingsModal.classList.add('hidden');
}

function saveSettings() {
  const workMins = parseInt(workDurationInput.value, 10) || 50;
  const shortBreakMins = parseInt(shortBreakInput.value, 10) || 10;
  const longBreakMins = parseInt(longBreakInput.value, 10) || 20;
  const cycleCount = parseInt(cycleCountInput.value, 10) || 4;

  state.workDuration = Math.max(1, workMins) * 60;
  state.shortBreakDuration = Math.max(1, shortBreakMins) * 60;
  state.longBreakDuration = Math.max(1, longBreakMins) * 60;
  state.totalCycleSessions = Math.max(1, cycleCount);

  state.soundEnabled = soundAlertsToggle.checked;
  state.autoStartBreaks = autoBreakToggle.checked;
  state.autoStartFocus = autoFocusToggle.checked;

  window.soundEngine.setChimeVolume(parseInt(chimeVolumeInput.value, 10) / 100);
  window.soundEngine.setChimeStyle(chimeToneSelect.value);
  window.soundEngine.setRainStyle(rainStyleSelect.value);

  saveStorage();
  resetTimer();
  closeSettings();
}

function resetSettingsToDefaults() {
  workDurationInput.value = 50;
  shortBreakInput.value = 10;
  longBreakInput.value = 20;
  cycleCountInput.value = 4;
  soundAlertsToggle.checked = true;
  autoBreakToggle.checked = true;
  autoFocusToggle.checked = false;
  chimeVolumeInput.value = 80;
  chimeToneSelect.value = 'bell';
  rainStyleSelect.value = 'gentle';
}

/* ================= EVENT LISTENERS ================= */
function setupEventListeners() {
  // Timer Controls
  startPauseBtn.addEventListener('click', () => {
    if (window.soundEngine) window.soundEngine.playClick();
    if (state.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  resetBtn.addEventListener('click', () => {
    if (window.soundEngine) window.soundEngine.playClick();
    resetTimer();
  });

  skipBtn.addEventListener('click', () => {
    if (window.soundEngine) window.soundEngine.playClick();
    handleTimerCompletion();
  });

  // Mode Tabs
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      switchMode(tab.dataset.mode);
    });
  });

  // Theme Toggles
  themeGreenBtn.addEventListener('click', () => {
    if (window.soundEngine) window.soundEngine.playClick();
    applyTheme('green', state.themeMode);
  });

  themePinkBtn.addEventListener('click', () => {
    if (window.soundEngine) window.soundEngine.playClick();
    applyTheme('pink', state.themeMode);
  });

  darkModeBtn.addEventListener('click', () => {
    if (window.soundEngine) window.soundEngine.playClick();
    toggleThemeMode();
  });

  // Ambience Chips (Nature Rain, Heavy Rain, Fireplace, Cafe Jazz)
  if (soundNatureRainBtn) soundNatureRainBtn.addEventListener('click', () => toggleAmbientSound('natureRain'));
  if (soundRainBtn) soundRainBtn.addEventListener('click', () => toggleAmbientSound('rain'));
  if (soundFireBtn) soundFireBtn.addEventListener('click', () => toggleAmbientSound('fire'));
  if (soundJazzBtn) soundJazzBtn.addEventListener('click', () => toggleAmbientSound('jazz'));

  // Ambience Volume & Mute
  if (ambienceVolumeSlider) {
    ambienceVolumeSlider.addEventListener('input', (e) => {
      updateAmbienceVolume(parseInt(e.target.value, 10));
    });
  }

  if (ambienceMuteBtn) {
    ambienceMuteBtn.addEventListener('click', toggleAmbienceMute);
  }

  // Celebration Modal Dismiss
  dismissCelebrationBtn.addEventListener('click', () => {
    if (window.soundEngine) window.soundEngine.playClick();
    hideCelebrationAnimation();
  });

  // Task Form & Delegation
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(taskInput.value);
    taskInput.value = '';
  });

  taskList.addEventListener('click', (e) => {
    if (e.target.classList.contains('task-checkbox')) {
      toggleTask(parseInt(e.target.dataset.index, 10));
    } else if (e.target.classList.contains('task-delete-btn')) {
      deleteTask(parseInt(e.target.dataset.index, 10));
    }
  });

  // Stats Reset
  resetStatsBtn.addEventListener('click', () => {
    if (confirm('Bugünkü istatistikleri sıfırlamak istiyor musunuz?')) {
      state.completedSessions = 0;
      state.totalFocusMinutes = 0;
      saveStorage();
      renderStats();
    }
  });

  // Settings Modal Handlers
  settingsOpenBtn.addEventListener('click', openSettings);
  settingsCloseBtn.addEventListener('click', closeSettings);
  saveSettingsBtn.addEventListener('click', saveSettings);
  resetSettingsBtn.addEventListener('click', resetSettingsToDefaults);
  testChimeBtn.addEventListener('click', () => {
    if (window.soundEngine) {
      window.soundEngine.setChimeStyle(chimeToneSelect.value);
      window.soundEngine.setChimeVolume(parseInt(chimeVolumeInput.value, 10) / 100);
      window.soundEngine.playBreakStart();
    }
  });
  requestNotifyBtn.addEventListener('click', requestNotificationPermission);

  // Close modals on overlay click or Escape key
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettings();
  });
  celebrationOverlay.addEventListener('click', (e) => {
    if (e.target === celebrationOverlay || e.target.classList.contains('celebration-backdrop')) {
      hideCelebrationAnimation();
    }
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Ignore keyboard shortcuts if user is typing in an input
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      startPauseBtn.click();
    } else if (e.key === 'r' || e.key === 'R') {
      resetTimer();
    } else if (e.key === 's' || e.key === 'S') {
      skipBtn.click();
    } else if (e.key === 'm' || e.key === 'M') {
      if (window.soundEngine && window.soundEngine.hasActiveTracks()) {
        toggleAmbienceMute();
      } else {
        toggleAmbientSound('rain');
      }
    } else if (e.key === 'Escape') {
      closeSettings();
      hideCelebrationAnimation();
    }
  });

  // Quote rotation every 3 minutes
  setInterval(rotateQuote, 180000);
}

/* ================= INITIALIZATION ================= */
function initApp() {
  loadStorage();
  applyTheme(state.themeColor, state.themeMode);
  state.timeLeft = getCurrentTotalDuration();
  updateDisplay();
  renderTasks();
  renderStats();
  rotateQuote();
  setupEventListeners();

  // Set ambience volume from stored state
  if (ambienceVolumeSlider) {
    ambienceVolumeSlider.value = Math.round(state.ambienceVolume * 100);
  }
  if (ambienceVolLabel) {
    ambienceVolLabel.textContent = `${Math.round(state.ambienceVolume * 100)}%`;
  }
  if (window.soundEngine) {
    window.soundEngine.setAmbienceVolume(state.ambienceVolume);
  }
  initAmbientCanvas();
}

// Boot up
document.addEventListener('DOMContentLoaded', initApp);
