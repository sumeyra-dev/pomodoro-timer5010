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

  // Rain ambience
  rainActive: false,
  rainVolume: 0.45,

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

// Theme & Rain DOM
const htmlRoot = document.documentElement;
const themeGreenBtn = document.getElementById('theme-green-btn');
const themePinkBtn = document.getElementById('theme-pink-btn');
const darkModeBtn = document.getElementById('dark-mode-btn');
const rainToggleBtn = document.getElementById('rain-toggle-btn');
const rainVolumeInput = document.getElementById('rain-volume');
const rainCanvas = document.getElementById('rain-canvas');

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
      autoStartFocus: state.autoStartFocus
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

/* ================= RAIN BACKGROUND & VISUAL CANVAS ================= */
let rainDrops = [];
let rainAnimId = null;

function initRainCanvas() {
  const canvas = rainCanvas;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  rainDrops = [];
  const dropCount = 90;
  for (let i = 0; i < dropCount; i++) {
    rainDrops.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      length: Math.random() * 22 + 10,
      speed: Math.random() * 8 + 12,
      opacity: Math.random() * 0.4 + 0.15
    });
  }

  function renderRain() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const strokeColor = state.themeColor === 'pink' ? '244, 143, 177' : '129, 199, 132';

    rainDrops.forEach(d => {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${strokeColor}, ${d.opacity})`;
      ctx.lineWidth = 1.2;
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 1.5, d.y + d.length);
      ctx.stroke();

      d.y += d.speed;
      d.x -= 0.6; // gentle wind angle

      if (d.y > canvas.height) {
        d.y = -20;
        d.x = Math.random() * canvas.width;
      }
    });

    if (state.rainActive) {
      rainAnimId = requestAnimationFrame(renderRain);
    }
  }

  if (state.rainActive) {
    canvas.classList.add('active');
    renderRain();
  } else {
    canvas.classList.remove('active');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function toggleRain(forcedState = null) {
  if (window.soundEngine) {
    window.soundEngine.initContext();
  }

  state.rainActive = forcedState !== null ? forcedState : !state.rainActive;
  const ambienceWrapper = document.querySelector('.ambience-control');

  if (state.rainActive) {
    ambienceWrapper.classList.add('active');
    rainCanvas.classList.add('active');
    if (window.soundEngine) {
      window.soundEngine.startRain();
    }
    initRainCanvas();
  } else {
    ambienceWrapper.classList.remove('active');
    rainCanvas.classList.remove('active');
    if (window.soundEngine) {
      window.soundEngine.stopRain();
    }
    if (rainAnimId) {
      cancelAnimationFrame(rainAnimId);
      rainAnimId = null;
    }
    const ctx = rainCanvas.getContext('2d');
    ctx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
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

  // Rain Toggle & Volume
  rainToggleBtn.addEventListener('click', () => {
    toggleRain();
  });

  rainVolumeInput.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value) / 100;
    state.rainVolume = vol;
    if (window.soundEngine) {
      window.soundEngine.setRainVolume(vol);
    }
  });

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
      toggleRain();
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

  // Set rain volume from stored state
  rainVolumeInput.value = Math.round(state.rainVolume * 100);
  if (window.soundEngine) {
    window.soundEngine.setRainVolume(state.rainVolume);
  }
}

// Boot up
document.addEventListener('DOMContentLoaded', initApp);
