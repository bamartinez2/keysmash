(function() {
// Background music player
// Plays shuffled local music files, volume ducked under key tones

class MusicPlayer {
  constructor() {
    this.playlist = [];
    this.currentIndex = 0;
    this.audio = new Audio();
    this.audio.loop = false;
    this.enabled = true;
    this.volume = -18; // dB, will convert to 0..1 for HTML audio

    this.audio.addEventListener('ended', () => this.next());
    this.audio.addEventListener('error', () => {
      console.warn('[Music] Error playing track, skipping');
      this.next();
    });
  }

  setVolume(db) {
    this.volume = db;
    // Convert dB to linear (0..1) for HTML audio element
    // -18dB ≈ 0.126, -6dB ≈ 0.5, 0dB = 1.0
    this.audio.volume = Math.min(1, Math.max(0, Math.pow(10, db / 20)));
  }

  async init(config) {
    if (config.musicVolume !== undefined) this.setVolume(config.musicVolume);
    if (config.musicEnabled === false) this.enabled = false;

    const files = await window.keysmash.getMusicFiles();
    if (!files || files.length === 0) {
      console.log('[Music] No music files found, feature disabled');
      this.enabled = false;
      return;
    }

    // Shuffle
    this.playlist = files.slice();
    for (let i = this.playlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
    }

    console.log(`[Music] Loaded ${this.playlist.length} tracks`);
  }

  play() {
    if (!this.enabled || this.playlist.length === 0) return;
    this.audio.src = this.playlist[this.currentIndex];
    this.setVolume(this.volume); // re-apply after src change
    this.audio.play().catch(() => {});
  }

  next() {
    if (this.playlist.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    this.play();
  }

  toggle() {
    if (!this.enabled) {
      this.enabled = true;
      this.play();
    } else if (this.audio.paused) {
      this.audio.play().catch(() => {});
    } else {
      this.audio.pause();
    }
  }

  handleCommand(cmd) {
    if (cmd === 'next') this.next();
    else if (cmd === 'toggle') this.toggle();
  }
}

window.MusicPlayer = MusicPlayer;
})();
