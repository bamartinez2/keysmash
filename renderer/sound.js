(function() {
  const KEY_TO_NOTE = {};
  const PENTATONIC = ['C', 'D', 'E', 'G', 'A'];
  const ROWS = [
    ['Backquote','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0','Minus','Equal','Backspace'],
    ['Tab','KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight','Backslash'],
    ['CapsLock','KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote','Enter'],
    ['ShiftLeft','KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash','ShiftRight'],
    ['ControlLeft','MetaLeft','AltLeft','Space','AltRight','MetaRight','ControlRight'],
  ];
  const OCTAVES = [3, 4, 4, 5, 4];

  for (let row = 0; row < ROWS.length; row++) {
    for (let col = 0; col < ROWS[row].length; col++) {
      const noteIdx = col % PENTATONIC.length;
      KEY_TO_NOTE[ROWS[row][col]] = `${PENTATONIC[noteIdx]}${OCTAVES[row]}`;
    }
  }

  const EXTRAS = ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12','Escape','Delete','Insert','Home','End','PageUp','PageDown'];
  for (let i = 0; i < EXTRAS.length; i++) {
    KEY_TO_NOTE[EXTRAS[i]] = `${PENTATONIC[i % 5]}5`;
  }

  class SoundEngine {
    constructor() {
      this.synth = null;
      this.started = false;
      this.volume = -6;
    }

    async ensureStarted() {
      if (this.started) return;
      await Tone.start();
      this.synth = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 8,
        voice: Tone.Synth,
        options: {
          oscillator: { type: 'triangle' },
          envelope: {
            attack: 0.02,
            decay: 0.3,
            sustain: 0.1,
            release: 0.5,
          },
        },
      });
      this.synth.volume.value = this.volume;
      this.synth.toDestination();
      this.started = true;
    }

    setVolume(db) {
      this.volume = db;
      if (this.synth) this.synth.volume.value = db;
    }

    play(keyCode) {
      if (!this.started || !this.synth) return;
      const note = KEY_TO_NOTE[keyCode];
      if (!note) return;
      this.synth.triggerAttackRelease(note, '8n');
    }
  }

  window.SoundEngine = SoundEngine;
})();
