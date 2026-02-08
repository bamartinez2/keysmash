// Keydown orchestrator: wires sound + visuals + hardware IPC
// Designed to be crash-proof — each subsystem is independent

// Key-to-color and screen position maps
const PENTATONIC_KEYS = ['C', 'D', 'E', 'G', 'A'];
const KEY_ROWS = [
  ['Backquote','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0','Minus','Equal','Backspace'],
  ['Tab','KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight','Backslash'],
  ['CapsLock','KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote','Enter'],
  ['ShiftLeft','KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash','ShiftRight'],
  ['ControlLeft','MetaLeft','AltLeft','Space','AltRight','MetaRight','ControlRight'],
];

const NOTE_COLORS = {
  C: { r: 255, g: 50,  b: 50  },
  D: { r: 255, g: 165, b: 0   },
  E: { r: 255, g: 255, b: 50  },
  G: { r: 50,  g: 220, b: 50  },
  A: { r: 80,  g: 120, b: 255 },
};

const APP_KEY_TO_COLOR = {};
const APP_KEY_TO_SCREEN_POS = {};

for (let row = 0; row < KEY_ROWS.length; row++) {
  for (let col = 0; col < KEY_ROWS[row].length; col++) {
    const code = KEY_ROWS[row][col];
    const noteIdx = col % PENTATONIC_KEYS.length;
    APP_KEY_TO_COLOR[code] = NOTE_COLORS[PENTATONIC_KEYS[noteIdx]];
    APP_KEY_TO_SCREEN_POS[code] = {
      x: (col + 0.5) / KEY_ROWS[row].length,
      y: (row + 0.5) / KEY_ROWS.length,
    };
  }
}

const EXTRAS = ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12','Escape','Delete','Insert','Home','End','PageUp','PageDown'];
for (let i = 0; i < EXTRAS.length; i++) {
  APP_KEY_TO_COLOR[EXTRAS[i]] = NOTE_COLORS[PENTATONIC_KEYS[i % 5]];
  APP_KEY_TO_SCREEN_POS[EXTRAS[i]] = { x: Math.random(), y: Math.random() };
}

function keyCodeToChar(code) {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code === 'Space') return ' ';
  if (code === 'Enter') return '\u23CE';
  if (code === 'Backspace') return '\u232B';
  if (code === 'Tab') return '\u21B9';
  if (code.startsWith('F') && !isNaN(code.slice(1))) return code;
  return '';
}

// --- Error display (visible on black screen for debugging) ---
const errors = [];
function showError(msg) {
  errors.push(msg);
  console.error('[KeySmash]', msg);
  // Draw errors on screen if canvas exists
  const c = document.getElementById('canvas');
  if (c) {
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ff0000';
    ctx.font = '16px monospace';
    errors.forEach((e, i) => ctx.fillText(e, 20, 30 + i * 22));
  }
}

// --- Global error handlers ---
window.onerror = function(msg, src, line, col, err) {
  showError(`${msg} (${src}:${line}:${col})`);
};
window.addEventListener('unhandledrejection', function(e) {
  showError('Unhandled rejection: ' + (e.reason?.message || e.reason || 'unknown'));
});

// --- Init subsystems independently ---
let sound = null;
let visuals = null;
let music = null;

// 1. Visuals — start IMMEDIATELY, no dependencies
try {
  const canvas = document.getElementById('canvas');
  if (!canvas) throw new Error('Canvas element not found');
  visuals = new VisualEngine(canvas);
  visuals.start();
} catch (e) {
  showError('Visuals init failed: ' + e.message);
}

// 2. Sound — create instance (Tone.js starts on first keypress)
try {
  sound = new SoundEngine();
} catch (e) {
  showError('Sound init failed: ' + e.message);
}

// 3. Music — async init, but don't block anything
try {
  music = new MusicPlayer();
} catch (e) {
  showError('Music init failed: ' + e.message);
  music = null;
}

// 4. Load config and finish music setup (async, non-blocking)
(async function initAsync() {
  try {
    if (window.keysmash) {
      const config = await window.keysmash.getConfig();
      if (config.keyToneVolume !== undefined && sound) sound.setVolume(config.keyToneVolume);
      if (music) await music.init(config);
      window.keysmash.onMusicCommand((cmd) => { if (music) music.handleCommand(cmd); });
    } else {
      showError('window.keysmash not available (preload may have failed)');
    }
  } catch (e) {
    showError('Async init failed: ' + e.message);
  }
})();

// --- Keydown handler ---
const pressedKeys = new Set();

document.addEventListener('keydown', function(e) {
  e.preventDefault();
  e.stopPropagation();

  const code = e.code;
  if (pressedKeys.has(code)) return;
  pressedKeys.add(code);

  // Visuals — always try
  try {
    if (visuals) {
      const color = APP_KEY_TO_COLOR[code] || { r: 255, g: 255, b: 255 };
      const pos = APP_KEY_TO_SCREEN_POS[code] || { x: 0.5, y: 0.5 };
      const char = keyCodeToChar(code);
      visuals.burst(pos.x, pos.y, color, char);
    }
  } catch (e) { /* don't let visuals crash kill sound */ }

  // Sound — ensure started then play
  try {
    if (sound) {
      sound.ensureStarted().then(() => sound.play(code)).catch(() => {});
    }
  } catch (e) { /* don't let sound crash kill visuals */ }

  // Music — start on first keypress
  try {
    if (music && music.enabled && music.audio && music.audio.paused && music.playlist.length > 0) {
      music.play();
    }
  } catch (e) { /* ignore */ }

  // Hardware — fire-and-forget IPC
  try {
    if (window.keysmash) window.keysmash.triggerHardware(code);
  } catch (e) { /* ignore */ }
});

document.addEventListener('keyup', function(e) {
  e.preventDefault();
  pressedKeys.delete(e.code);
});

document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
document.addEventListener('mousedown', function(e) { e.preventDefault(); });
document.addEventListener('dblclick', function(e) { e.preventDefault(); });
