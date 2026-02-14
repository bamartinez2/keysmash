# KeySmash

A baby keyboard/touch toy. Every key mash or screen tap produces a pleasant musical note, colorful particle effects, and optional physical light shows (Razer keyboard + NZXT case). Fully baby-proofed.

**Two versions:**
- **Desktop (Windows)** — Electron kiosk app with hardware lighting
- **Mobile (iPhone/iPad/any browser)** — PWA web app, tap-to-play

---

## Mobile / iPhone

KeySmash runs as a web app on any device with a browser. Tap anywhere for sounds + visuals.

**Self-hosted setup** (already running on the homelab):
- Visit `http://<keysmash_ip>:8888` from your phone
- **Add to Home Screen** (Safari share button) for fullscreen, app-like experience
- Multi-touch supported — baby can mash the whole screen
- Also works with a keyboard if one is connected

The web server runs as a systemd service (`keysmash-web`) and auto-starts on boot.

---

## Desktop — Quick Start (Portable EXE)

1. Download `KeySmash-Portable.exe` from the [latest release](../../releases/latest)
2. Double-click to run — no installation needed
3. Drop music files (`.mp3`, `.wav`, `.ogg`) into the `music/` folder next to the exe for background music (optional)
4. The app launches fullscreen. Mash keys!

**Parent exit:** Hold `Ctrl + Shift + Q` for 3 seconds to quit.

## Desktop — Installation (Windows Installer)

1. Download `KeySmash-Setup.exe` from the [latest release](../../releases/latest)
2. Run the installer — installs to your user profile (no admin needed)
3. Launch "KeySmash" from the Start Menu

---

## Building from Source

### Prerequisites

- **Node.js 18+** — [download](https://nodejs.org/)
- **Git** — [download](https://git-scm.com/download/win)

### Steps

```powershell
git clone https://github.com/bamartinez2/keysmash.git
cd keysmash
npm install

npm run dev              # Windowed dev mode (shortcuts not blocked)
npm start                # Fullscreen kiosk production mode

npm run build            # Build Windows installer + portable exe
npm run build:installer  # NSIS installer only
npm run build:portable   # Portable exe only
```

Output lands in `dist/`. CI also builds automatically on tag push via GitHub Actions.

---

## Background Music

Drop audio files into the `music/` folder:

- Supported: `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`, `.aac`
- Auto-shuffles and loops
- Music at -18dB, key tones at -6dB (tones sit clearly on top)
- Empty folder = music silently disabled

Edit `config.json` to customize:

```json
{
  "musicFolder": "./music",
  "musicVolume": -18,
  "keyToneVolume": -6,
  "musicEnabled": true
}
```

---

## Hardware Lighting (Optional, Desktop Only)

Both are optional. The app works with just sound + screen visuals.

### Razer Chroma (Keyboard)

1. Install [Razer Synapse 3](https://www.razer.com/synapse-3)
2. Ensure Synapse is running — Chroma SDK starts on `localhost:54235`
3. KeySmash sends per-key colors + ripple effects

### OpenRGB (NZXT Case / Other RGB)

1. Download [OpenRGB](https://openrgb.org/) and install
2. **Close NZXT CAM** (USB contention)
3. Settings > SDK Server > Start Server, port `6742`
4. KeySmash sets all LEDs to the pressed key's color

If either service isn't running, KeySmash logs a warning and continues.

---

## Architecture

```
DESKTOP (Electron)
  RENDERER (zero-latency)              MAIN PROCESS (fire-and-forget IPC)
  ┌─────────────────────┐              ┌──────────────────────────┐
  │  keydown event       │              │                          │
  │  ├─ sound.play()    │───IPC───────>│  hardware/chroma.js      │
  │  ├─ visuals.burst() │              │  └─ Razer REST API       │
  │  └─ triggerHardware()│              │  hardware/openrgb.js     │
  │                     │              │  └─ OpenRGB TCP SDK      │
  └─────────────────────┘              └──────────────────────────┘

MOBILE (Web)
  ┌─────────────────────┐
  │  touch/tap event     │  Single self-contained HTML file
  │  ├─ Web Audio API   │  No dependencies, no build step
  │  └─ Canvas 2D       │  PWA manifest for Add to Home Screen
  └─────────────────────┘
```

- **Sound**: Pentatonic scale (C, D, E, G, A) across 3 octaves, triangle wave. Any key combination sounds pleasant.
- **Visuals**: Canvas 2D particles — burst circles, expanding rings, character pops, cycling background gradient.

### Baby-Proofing (Desktop)

Blocked shortcuts in production mode:
`Alt+F4`, `Alt+Tab`, `Alt+Esc`, `Ctrl+W`, `Ctrl+Q`, `Ctrl+T`, `Ctrl+N`, `Ctrl+F4`, `Ctrl+Shift+I/J`, `Ctrl+R`, `F5`, `F11`, `F12`, `Win+D/E/L/R/Tab`

Dev mode (`npm run dev`) disables all blocking for easy development.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No sound on first key/tap | Normal — audio requires a user gesture to start |
| Chroma not working | Ensure Razer Synapse 3 is running |
| OpenRGB not working | Ensure SDK server is running (port 6742), close NZXT CAM |
| Desktop app won't exit | Hold `Ctrl+Shift+Q` for 3 seconds |
| Music not playing | Add files to `music/` folder and restart |
| Web version not loading | Check `systemctl --user status keysmash-web` on the server |
