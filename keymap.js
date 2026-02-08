// Pentatonic scale: C, D, E, G, A across 3 octaves
// Mapped left-to-right across keyboard rows so spatial position = pitch

const PENTATONIC = ['C', 'D', 'E', 'G', 'A'];

// Build note assignments: keyboard rows top-to-bottom = octaves 3,4,5
// Within each row, keys go left-to-right cycling through pentatonic
const ROWS = [
  // Number row (octave 3)
  ['Backquote','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0','Minus','Equal','Backspace'],
  // QWERTY row (octave 4)
  ['Tab','KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight','Backslash'],
  // Home row (octave 4, higher notes)
  ['CapsLock','KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote','Enter'],
  // Bottom row (octave 5)
  ['ShiftLeft','KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash','ShiftRight'],
  // Space bar row
  ['ControlLeft','MetaLeft','AltLeft','Space','AltRight','MetaRight','ControlRight'],
];

const OCTAVES = [3, 4, 4, 5, 4];

const KEY_TO_NOTE = {};
const KEY_TO_COLOR = {};
const KEY_TO_SCREEN_POS = {};

// Vibrant colors for each pentatonic degree
const NOTE_COLORS = {
  C: { r: 255, g: 50,  b: 50  },  // Red
  D: { r: 255, g: 165, b: 0   },  // Orange
  E: { r: 255, g: 255, b: 50  },  // Yellow
  G: { r: 50,  g: 220, b: 50  },  // Green
  A: { r: 80,  g: 120, b: 255 },  // Blue
};

for (let row = 0; row < ROWS.length; row++) {
  const keys = ROWS[row];
  const octave = OCTAVES[row];
  for (let col = 0; col < keys.length; col++) {
    const code = keys[col];
    const noteIdx = col % PENTATONIC.length;
    const noteName = PENTATONIC[noteIdx];
    KEY_TO_NOTE[code] = `${noteName}${octave}`;
    KEY_TO_COLOR[code] = NOTE_COLORS[noteName];

    // Screen position: spread across display
    KEY_TO_SCREEN_POS[code] = {
      x: (col + 0.5) / keys.length,  // 0..1 normalized
      y: (row + 0.5) / ROWS.length,
    };
  }
}

// Function keys and extras — give them notes too
const EXTRAS = ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12','Escape','Delete','Insert','Home','End','PageUp','PageDown'];
for (let i = 0; i < EXTRAS.length; i++) {
  const noteIdx = i % PENTATONIC.length;
  const noteName = PENTATONIC[noteIdx];
  KEY_TO_NOTE[EXTRAS[i]] = `${noteName}5`;
  KEY_TO_COLOR[EXTRAS[i]] = NOTE_COLORS[noteName];
  KEY_TO_SCREEN_POS[EXTRAS[i]] = { x: Math.random(), y: Math.random() };
}

// Razer Chroma keyboard grid positions (6 rows x 22 cols)
// Maps key codes to [row, col] in the Chroma grid
const KEY_TO_CHROMA_POS = {
  Escape: [0,1], F1: [0,3], F2: [0,4], F3: [0,5], F4: [0,6],
  F5: [0,8], F6: [0,9], F7: [0,10], F8: [0,11],
  F9: [0,13], F10: [0,14], F11: [0,15], F12: [0,16],

  Backquote: [1,1], Digit1: [1,2], Digit2: [1,3], Digit3: [1,4], Digit4: [1,5],
  Digit5: [1,6], Digit6: [1,7], Digit7: [1,8], Digit8: [1,9], Digit9: [1,10],
  Digit0: [1,11], Minus: [1,12], Equal: [1,13], Backspace: [1,14],

  Tab: [2,1], KeyQ: [2,2], KeyW: [2,3], KeyE: [2,4], KeyR: [2,5],
  KeyT: [2,6], KeyY: [2,7], KeyU: [2,8], KeyI: [2,9], KeyO: [2,10],
  KeyP: [2,11], BracketLeft: [2,12], BracketRight: [2,13], Backslash: [2,14],

  CapsLock: [3,1], KeyA: [3,2], KeyS: [3,3], KeyD: [3,4], KeyF: [3,5],
  KeyG: [3,6], KeyH: [3,7], KeyJ: [3,8], KeyK: [3,9], KeyL: [3,10],
  Semicolon: [3,11], Quote: [3,12], Enter: [3,14],

  ShiftLeft: [4,1], KeyZ: [4,2], KeyX: [4,3], KeyC: [4,4], KeyV: [4,5],
  KeyB: [4,6], KeyN: [4,7], KeyM: [4,8], Comma: [4,9], Period: [4,10],
  Slash: [4,11], ShiftRight: [4,14],

  ControlLeft: [5,1], MetaLeft: [5,2], AltLeft: [5,3], Space: [5,7],
  AltRight: [5,11], MetaRight: [5,12], ControlRight: [5,14],
};

module.exports = { KEY_TO_NOTE, KEY_TO_COLOR, KEY_TO_SCREEN_POS, KEY_TO_CHROMA_POS, NOTE_COLORS };
