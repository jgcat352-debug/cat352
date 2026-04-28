// Particle system for hit effects, sparks, death explosions
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawn({ x, y, count = 8, color = '#fff', colorAlt = null, size = 5,
          speed = 120, gravity = 400, life = 0.4, type = 'square' }) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - speed * 0.3,
        color: (colorAlt && Math.random() > 0.5) ? colorAlt : color,
        size: size * (0.5 + Math.random() * 0.5),
        life: life * (0.7 + Math.random() * 0.5),
        maxLife: life,
        gravity,
        type,
      });
    }
  }

  spawnSparks(x, y, facing = 1) {
    this.spawn({
      x, y, count: 10,
      color: '#ffffff', colorAlt: '#ffd700',
      size: 4, speed: 180, gravity: 600, life: 0.3, type: 'square',
    });
    this.spawn({
      x: x + facing * 20, y,
      count: 5, color: '#ff8800',
      size: 3, speed: 100, gravity: 400, life: 0.2,
    });
  }

  spawnBloodless(x, y) {
    // No blood — sparks and fragments instead
    this.spawn({
      x, y, count: 14, color: '#c0c8d0', colorAlt: '#d4af37',
      size: 5, speed: 200, gravity: 700, life: 0.5,
    });
  }

  spawnDeathExplosion(x, y, type = 'skeleton') {
    const colors = {
      skeleton: ['#e8dfc8', '#c0b898', '#ffffff'],
      amazon:   ['#804020', '#d4af37', '#e8b870'],
      giant:    ['#c0c8d0', '#d4af37', '#4488ff'],
    };
    const cols = colors[type] || colors.skeleton;
    this.spawn({
      x, y, count: 20,
      color: cols[0], colorAlt: cols[1],
      size: 7, speed: 250, gravity: 600, life: 0.7,
    });
    this.spawn({
      x, y, count: 10, color: cols[2],
      size: 3, speed: 150, gravity: 400, life: 0.4,
    });
  }

  spawnRockSmash(x, y) {
    this.spawn({
      x, y, count: 16, color: '#555560', colorAlt: '#333340',
      size: 6, speed: 160, gravity: 500, life: 0.6,
    });
    this.spawn({
      x, y, count: 6, color: '#888890',
      size: 3, speed: 90, gravity: 300, life: 0.35,
    });
  }

  update(dt) {
    this.particles = this.particles.filter(p => {
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.life -= dt;
      return p.life > 0;
    });
  }

  draw(ctx) {
    for (const p of this.particles) {
      const prog = Math.max(0, 1 - p.life / p.maxLife);
      ctx.globalAlpha = Math.max(0, 1 - prog * 1.2);
      ctx.fillStyle = p.color;
      const sz = p.size * (1 - prog * 0.4);
      if (p.type === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
      }
    }
    ctx.globalAlpha = 1;
  }
}
