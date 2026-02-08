// OpenRGB SDK wrapper for NZXT case lighting
// Color wash: set all LEDs to the key's color on each keypress
// Graceful degradation: if OpenRGB is down, log once and become no-op

const { Client } = require('openrgb-sdk');

class OpenRGBWrapper {
  constructor() {
    this.client = null;
    this.devices = [];
    this.nzxtIndices = [];
    this.connected = false;
    this.failedOnce = false;
  }

  async init() {
    this.client = new Client('KeySmash', 6742, 'localhost');
    await this.client.connect();
    this.connected = true;

    const count = await this.client.getControllerCount();
    for (let i = 0; i < count; i++) {
      const device = await this.client.getControllerData(i);
      this.devices.push(device);
      // Look for NZXT devices (case fans, strips, etc.)
      const name = (device.name || '').toLowerCase();
      if (name.includes('nzxt') || name.includes('hue') || name.includes('kraken') || name.includes('smart device')) {
        this.nzxtIndices.push(i);
      }
    }

    // If no NZXT found, use all devices as fallback
    if (this.nzxtIndices.length === 0) {
      console.log('[OpenRGB] No NZXT device found, will control all devices');
      this.nzxtIndices = Array.from({ length: count }, (_, i) => i);
    }

    console.log(`[OpenRGB] Found ${count} devices, controlling indices: ${this.nzxtIndices}`);
  }

  async setColor(color) {
    if (!this.connected) return;
    if (this.failedOnce) return;

    try {
      for (const idx of this.nzxtIndices) {
        const device = this.devices[idx];
        const ledCount = device.colors ? device.colors.length : 1;
        const colors = Array(ledCount).fill({ red: color.r, green: color.g, blue: color.b });
        await this.client.updateLeds(idx, colors);
      }
    } catch (err) {
      if (!this.failedOnce) {
        console.warn('[OpenRGB] Error setting color, disabling:', err.message);
        this.failedOnce = true;
      }
    }
  }

  async destroy() {
    if (this.client && this.connected) {
      try {
        await this.client.disconnect();
      } catch {}
    }
  }
}

module.exports = OpenRGBWrapper;
