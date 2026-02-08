# KeySmash

A baby keyboard game for Windows 11. Every key mash produces a pleasant musical note, colorful particle effects on screen, Razer keyboard lighting ripples, and NZXT case color washes. Fully baby-proofed — no accidental Alt+F4, Alt+Tab, or desktop escapes.

## Quick Start (Portable EXE)

1. Download `KeySmash-Portable-1.0.0.exe` from [Releases](../../releases)
2. Double-click to run — no installation needed
3. Drop music files (`.mp3`, `.wav`, `.ogg`) into the `music/` folder next to the exe for background music (optional)
4. The app launches fullscreen. Mash keys!

**Parent exit:** Hold `Ctrl + Shift + Q` for 3 seconds to quit.

---

## Installation (Windows Installer)

1. Download `KeySmash-Setup-1.0.0.exe` from [Releases](../../releases)
2. Run the installer — it installs to your user profile (no admin needed)
3. Launch "KeySmash" from the Start Menu

---

## Building from Source

### Prerequisites

- **Windows 10/11** (building must happen on Windows for native modules)
- **Node.js 18+** — [download](https://nodejs.org/)
- **Git** — [download](https://git-scm.com/download/win)

### Steps

```powershell
# Clone the repo
git clone https://github.com/bamartinez2/keysmash.git
cd keysmash

# Install dependencies
npm install

# Run in dev mode (windowed, shortcuts not blocked)
npm run dev

# Run in production mode (fullscreen kiosk)
npm start

# Build Windows installer + portable exe
npm run build

# Or build only one target:
npm run build:installer    # NSIS installer
npm run build:portable     # Single portable .exe
```

Output lands in `dist/`:
- `KeySmash Setup 1.0.0.exe` — one-click installer
- `KeySmash-Portable-1.0.0.exe` — standalone portable exe

---

## Background Music

Drop audio files into the `music/` folder (next to the app, or `resources/music/` if installed):

- Supported formats: `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`, `.aac`
- Playlist auto-shuffles and loops
- Music plays at -18dB, key tones at -6dB (tones sit clearly on top)
- If the folder is empty, music is silently disabled

To change the music folder path or volume levels, edit `config.json`:

```json
{
  "musicFolder": "./music",
  "musicVolume": -18,
  "keyToneVolume": -6,
  "musicEnabled": true
}
```

---

## Hardware Lighting (Optional)

Both lighting integrations are optional. The app works perfectly with just sound + screen visuals.

### Razer Chroma (Keyboard)

1. Install [Razer Synapse 3](https://www.razer.com/synapse-3)
2. Ensure Synapse is running — Chroma SDK starts automatically on `localhost:54235`
3. KeySmash sends per-key colors + ripple effects to your Razer keyboard

### OpenRGB (NZXT Case / Other RGB)

1. Download [OpenRGB](https://openrgb.org/) and install
2. **Close NZXT CAM** — it conflicts over USB with OpenRGB
3. Open OpenRGB, go to **Settings > SDK Server**:
   - Check **Start Server**
   - Port: `6742` (default)
   - Optional: enable "Start on boot"
4. OpenRGB auto-detects hardware. KeySmash sets all NZXT LEDs to the pressed key's color

If Razer Synapse or OpenRGB aren't running, KeySmash logs a single warning and continues — no crashes, no errors.

---

## How It Works

```
RENDERER (zero-latency)              MAIN PROCESS (fire-and-forget IPC)
┌─────────────────────┐              ┌──────────────────────────┐
│  keydown event       │              │                          │
│  ├─ sound.play()    │───IPC───────>│  hardware/chroma.js      │
│  ├─ visuals.burst() │              │  └─ Razer REST API       │
│  └─ triggerHardware()│              │  hardware/openrgb.js     │
│                     │              │  └─ OpenRGB TCP SDK      │
└─────────────────────┘              └──────────────────────────┘
```

- **Sound**: Tone.js PolySynth, triangle wave, pentatonic scale (C, D, E, G, A) across 3 octaves. Any combination of keys sounds pleasant.
- **Visuals**: Canvas 2D particle engine — burst circles, expanding rings, letter pops, slowly cycling background gradient.
- **Chroma**: 6x22 BGR grid, ripple effect expanding outward from the pressed key, 30fps throttle.
- **OpenRGB**: Whole-case color wash on each keypress.

### Baby-Proofing

Blocked shortcuts (in production mode):
- `Alt+F4`, `Alt+Tab`, `Alt+Esc`
- `Ctrl+W`, `Ctrl+Q`, `Ctrl+T`, `Ctrl+N`, `Ctrl+F4`
- `Ctrl+Shift+I/J` (DevTools), `Ctrl+R` (refresh)
- `F5`, `F11`, `F12`
- `Win+D`, `Win+E`, `Win+L`, `Win+R`, `Win+Tab`

**Dev mode** (`npm run dev`) disables kiosk mode and shortcut blocking for easy development.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No sound on first key | Normal — browser audio requires a user gesture. First keypress starts audio. |
| Chroma not working | Make sure Razer Synapse 3 is running. Check `http://localhost:54235/razer/rest/chromasdk` in a browser. |
| OpenRGB not working | Make sure OpenRGB SDK server is running (port 6742). Close NZXT CAM first. |
| App won't exit | Hold `Ctrl+Shift+Q` for 3 full seconds. In dev mode, just close the window. |
| Music not playing | Drop `.mp3`/`.wav`/`.ogg` files into the `music/` folder and restart. |
| Build fails | Must build on Windows. Ensure Node.js 18+ is installed. Run `npm install` first. |
