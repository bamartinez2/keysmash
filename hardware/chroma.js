// Razer Chroma REST API wrapper
// Session management, heartbeat, per-key grid with ripple effect
// Throttled to 30fps to avoid overwhelming the API

const CHROMA_URL = 'http://localhost:54235';
const HEARTBEAT_MS = 8000;
const FLUSH_MS = 33; // ~30fps
const RIPPLE_INTERVAL_MS = 50;
const RIPPLE_STEPS = 5;
const RIPPLE_DECAY = 0.7;

const ROWS = 6;
const COLS = 22;

class Chroma {
  constructor() {
    this.sessionUrl = null;
    this.heartbeatTimer = null;
    this.flushTimer = null;
    this.grid = this.emptyGrid();
    this.dirty = false;
    this.ripples = []; // active ripple animations
  }

  emptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  // Convert RGB to BGR integer (Razer's format)
  rgbToBgr(r, g, b) {
    return (b << 16) | (g << 8) | r;
  }

  async init() {
    const res = await fetch(`${CHROMA_URL}/razer/rest/chromasdk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'KeySmash',
        description: 'Baby keyboard light show',
        author: { name: 'KeySmash', contact: 'https://github.com' },
        device_supported: ['keyboard'],
        category: 'application',
      }),
    });

    const data = await res.json();
    this.sessionUrl = data.uri;

    // Start heartbeat
    this.heartbeatTimer = setInterval(() => this.heartbeat(), HEARTBEAT_MS);

    // Start flush loop
    this.flushTimer = setInterval(() => this.flush(), FLUSH_MS);
  }

  async heartbeat() {
    if (!this.sessionUrl) return;
    try {
      await fetch(`${this.sessionUrl}/heartbeat`, { method: 'PUT' });
    } catch {
      // Session may have expired
    }
  }

  async onKeyPress(chromaPos, color) {
    if (!this.sessionUrl || !chromaPos) return;

    const [row, col] = chromaPos;
    const bgr = this.rgbToBgr(color.r, color.g, color.b);

    // Set the pressed key
    this.grid[row][col] = bgr;
    this.dirty = true;

    // Start ripple animation
    this.ripples.push({
      row, col,
      bgr,
      step: 0,
      timer: setInterval(() => {
        this.rippleStep(this.ripples[this.ripples.length - 1]);
      }, RIPPLE_INTERVAL_MS),
    });
  }

  rippleStep(ripple) {
    ripple.step++;
    if (ripple.step > RIPPLE_STEPS) {
      clearInterval(ripple.timer);
      const idx = this.ripples.indexOf(ripple);
      if (idx >= 0) this.ripples.splice(idx, 1);
      return;
    }

    const brightness = Math.pow(RIPPLE_DECAY, ripple.step);
    const r = Math.floor((ripple.bgr & 0xFF) * brightness);
    const g = Math.floor(((ripple.bgr >> 8) & 0xFF) * brightness);
    const b = Math.floor(((ripple.bgr >> 16) & 0xFF) * brightness);
    const dimBgr = (b << 16) | (g << 8) | r;

    const dist = ripple.step;
    for (let dr = -dist; dr <= dist; dr++) {
      for (let dc = -dist; dc <= dist; dc++) {
        if (Math.abs(dr) !== dist && Math.abs(dc) !== dist) continue; // only ring border
        const nr = ripple.row + dr;
        const nc = ripple.col + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          this.grid[nr][nc] = dimBgr;
        }
      }
    }
    this.dirty = true;
  }

  async flush() {
    if (!this.dirty || !this.sessionUrl) return;
    this.dirty = false;

    try {
      await fetch(`${this.sessionUrl}/keyboard`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effect: 'CHROMA_CUSTOM',
          param: this.grid,
        }),
      });
    } catch {
      // Silently ignore flush errors
    }

    // Decay all grid cells toward black
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c] === 0) continue;
        const val = this.grid[r][c];
        const red = Math.floor((val & 0xFF) * 0.9);
        const grn = Math.floor(((val >> 8) & 0xFF) * 0.9);
        const blu = Math.floor(((val >> 16) & 0xFF) * 0.9);
        const decayed = (blu << 16) | (grn << 8) | red;
        this.grid[r][c] = decayed < 0x010101 ? 0 : decayed;
        if (this.grid[r][c] !== 0) this.dirty = true;
      }
    }
  }

  async destroy() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.flushTimer) clearInterval(this.flushTimer);
    for (const ripple of this.ripples) clearInterval(ripple.timer);
    this.ripples = [];

    if (this.sessionUrl) {
      try {
        await fetch(this.sessionUrl, { method: 'DELETE' });
      } catch {}
    }
  }
}

module.exports = Chroma;
