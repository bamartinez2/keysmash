// Dangerous key combos to block at the OS level via globalShortcut
// Format: Electron accelerator strings
const BLOCKED_SHORTCUTS = [
  'Alt+F4',
  'Alt+Tab',
  'Alt+Escape',
  'Ctrl+W',
  'Ctrl+Q',
  'Ctrl+F4',
  'Ctrl+Shift+I',
  'Ctrl+Shift+J',
  'Ctrl+R',
  'Ctrl+Shift+R',
  'F5',
  'F11',
  'F12',
  'Ctrl+T',
  'Ctrl+N',
  'Ctrl+Shift+Delete',
  'Ctrl+L',
  'Alt+Home',
  'Alt+Left',
  'Alt+Right',
  'Super+D',        // Show desktop
  'Super+E',        // File explorer
  'Super+L',        // Lock screen
  'Super+R',        // Run dialog
  'Super+Tab',      // Task view
];

// Parent escape: Ctrl+Shift+Q held for 3 seconds
const PARENT_EXIT_COMBO = 'Ctrl+Shift+Q';
const PARENT_EXIT_HOLD_MS = 3000;

module.exports = { BLOCKED_SHORTCUTS, PARENT_EXIT_COMBO, PARENT_EXIT_HOLD_MS };
