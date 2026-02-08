const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { BLOCKED_SHORTCUTS, PARENT_EXIT_COMBO, PARENT_EXIT_HOLD_MS } = require('./babyproof');
const { KEY_TO_COLOR, KEY_TO_CHROMA_POS } = require('./keymap');

let win;
let chroma;
let openrgb;
let parentExitTimer = null;
const isDev = process.argv.includes('--dev');

function loadConfig() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { musicFolder: './music', musicVolume: -18, keyToneVolume: -6, musicEnabled: true };
  }
}

function createWindow() {
  win = new BrowserWindow({
    fullscreen: !isDev,
    kiosk: !isDev,
    frame: isDev,
    alwaysOnTop: !isDev,
    skipTaskbar: !isDev,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
  });

  if (isDev) {
    win.setSize(1280, 720);
    win.center();
  }

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Prevent navigation away
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.on('new-window', (e) => e.preventDefault());
}

function registerShortcuts() {
  if (isDev) return; // Don't block shortcuts in dev mode

  for (const combo of BLOCKED_SHORTCUTS) {
    try {
      globalShortcut.register(combo, () => {
        // Swallow — do nothing
      });
    } catch {
      // Some combos may not be registerable on all platforms
    }
  }

  // Parent exit: Ctrl+Shift+Q held for 3 seconds
  globalShortcut.register(PARENT_EXIT_COMBO, () => {
    if (!parentExitTimer) {
      parentExitTimer = setTimeout(() => {
        app.quit();
      }, PARENT_EXIT_HOLD_MS);
    }
  });
}

function clearParentExitTimer() {
  if (parentExitTimer) {
    clearTimeout(parentExitTimer);
    parentExitTimer = null;
  }
}

async function initHardware() {
  // Chroma
  try {
    const Chroma = require('./hardware/chroma');
    chroma = new Chroma();
    await chroma.init();
    console.log('[Chroma] Initialized');
  } catch (err) {
    console.warn('[Chroma] Not available:', err.message);
    chroma = null;
  }

  // OpenRGB
  try {
    const OpenRGBWrapper = require('./hardware/openrgb');
    openrgb = new OpenRGBWrapper();
    await openrgb.init();
    console.log('[OpenRGB] Initialized');
  } catch (err) {
    console.warn('[OpenRGB] Not available:', err.message);
    openrgb = null;
  }
}

function setupIPC() {
  const config = loadConfig();

  // Send config to renderer on request
  ipcMain.handle('get-config', () => config);

  // Scan music folder and return file list
  ipcMain.handle('get-music-files', () => {
    try {
      // In packaged app, music is in extraResources; in dev, relative to app root
      let musicDir = path.resolve(__dirname, config.musicFolder);
      if (app.isPackaged) {
        const resourceMusic = path.join(process.resourcesPath, 'music');
        if (fs.existsSync(resourceMusic)) musicDir = resourceMusic;
      }
      if (!fs.existsSync(musicDir)) return [];
      const exts = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];
      return fs.readdirSync(musicDir)
        .filter(f => exts.includes(path.extname(f).toLowerCase()))
        .map(f => `file://${path.join(musicDir, f).replace(/\\/g, '/')}`);
    } catch {
      return [];
    }
  });

  // Music controls from parent (could wire to a hidden key combo later)
  ipcMain.on('music-next', () => win?.webContents.send('music-command', 'next'));
  ipcMain.on('music-toggle', () => win?.webContents.send('music-command', 'toggle'));

  // Hardware trigger from renderer — fire-and-forget
  ipcMain.on('key-pressed', (_event, keyCode) => {
    const color = KEY_TO_COLOR[keyCode];
    if (!color) return;

    if (chroma) {
      const pos = KEY_TO_CHROMA_POS[keyCode];
      chroma.onKeyPress(pos, color).catch(() => {});
    }

    if (openrgb) {
      openrgb.setColor(color).catch(() => {});
    }
  });
}

// Clear parent exit timer when any key is released (they stopped holding)
app.on('browser-window-focus', () => {
  // Periodically check — the timer auto-fires after 3s hold
});

app.whenReady().then(async () => {
  createWindow();
  registerShortcuts();
  setupIPC();
  await initHardware();

  // Reset parent exit timer on any keyup globally
  win.webContents.on('before-input-event', (_event, input) => {
    if (input.type === 'keyUp') {
      clearParentExitTimer();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (chroma) chroma.destroy().catch(() => {});
  if (openrgb) openrgb.destroy().catch(() => {});
});

app.on('window-all-closed', () => app.quit());
