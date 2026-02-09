(function() {
const MAX_PARTICLES = 500;

class VisualEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.rings = [];
    this.letters = [];
    this.bgHue = 0;
    this.running = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  // Trigger effects for a keypress
  burst(normX, normY, color, letter) {
    const x = normX * this.canvas.width;
    const y = normY * this.canvas.height;
    const r = color.r, g = color.g, b = color.b;

    // Shift background hue
    this.bgHue = (this.bgHue + 15) % 360;

    // Burst particles (15-25)
    const count = 15 + Math.floor(Math.random() * 11);
    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r, g, b,
        alpha: 1,
        size: 3 + Math.random() * 8,
        decay: 0.015 + Math.random() * 0.02,
      });
    }

    // Expanding ring
    this.rings.push({
      x, y, r, g, b,
      radius: 10,
      alpha: 1,
      lineWidth: 4,
    });

    // Letter pop
    if (letter && letter.length === 1) {
      this.letters.push({
        x, y, r, g, b,
        char: letter.toUpperCase(),
        alpha: 1,
        scale: 1,
      });
    }
  }

  update() {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.vy += 0.05; // slight gravity
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.radius += 4;
      ring.alpha -= 0.02;
      ring.lineWidth *= 0.97;
      if (ring.alpha <= 0) {
        this.rings.splice(i, 1);
      }
    }

    // Update letters
    for (let i = this.letters.length - 1; i >= 0; i--) {
      const lt = this.letters[i];
      lt.scale += 0.08;
      lt.alpha -= 0.025;
      lt.y -= 1;
      if (lt.alpha <= 0) {
        this.letters.splice(i, 1);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background: dark radial gradient with slowly cycling hue
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    grad.addColorStop(0, `hsl(${this.bgHue}, 30%, 8%)`);
    grad.addColorStop(1, `hsl(${(this.bgHue + 60) % 360}, 20%, 2%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw rings
    for (const ring of this.rings) {
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${ring.r},${ring.g},${ring.b},${ring.alpha})`;
      ctx.lineWidth = ring.lineWidth;
      ctx.stroke();
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.alpha})`;
      ctx.fill();
    }

    // Draw letters
    for (const lt of this.letters) {
      ctx.save();
      ctx.translate(lt.x, lt.y);
      ctx.scale(lt.scale, lt.scale);
      ctx.font = 'bold 60px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(${lt.r},${lt.g},${lt.b},${lt.alpha})`;
      ctx.fillText(lt.char, 0, 0);
      ctx.restore();
    }
  }
}

window.VisualEngine = VisualEngine;
})();
