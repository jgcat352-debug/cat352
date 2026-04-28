// Base Entity — shared by Player, Enemy, Projectiles
export class Entity {
  constructor({ x, y, w, h }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.active = true;
    this.facing = 1; // 1 = right, -1 = left
  }

  get centerX() { return this.x + this.w / 2; }
  get centerY() { return this.y + this.h / 2; }
  get right()  { return this.x + this.w; }
  get bottom() { return this.y + this.h; }

  getBounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  overlaps(other) {
    return this.x < other.x + other.w &&
           this.x + this.w > other.x &&
           this.y < other.y + other.h &&
           this.y + this.h > other.y;
  }

  applyGravity(gravity, dt) {
    if (!this.onGround) {
      this.vy += gravity * dt;
    }
  }

  move(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

// Armor piece that flies off and lands
export class ArmorDebris extends Entity {
  constructor({ x, y, color, shape, region }) {
    super({ x, y, w: 14, h: 10 });
    this.vx = (Math.random() - 0.5) * 260;
    this.vy = -(Math.random() * 220 + 100);
    this.color = color;
    this.shape = shape; // 'head' | 'chest' | 'arm' | 'leg'
    this.region = region;
    this.rotation = 0;
    this.rotSpeed = (Math.random() - 0.5) * 12;
    this.bounces = 0;
    this.maxBounces = 2;
    this.alpha = 1;
    this.settled = false;
    this.settleTimer = 0;
  }

  update(dt, platforms, gravity = 900) {
    if (this.settled) {
      this.settleTimer += dt;
      this.alpha = Math.max(0, 1 - (this.settleTimer - 1.5) / 0.8);
      if (this.alpha <= 0) this.active = false;
      return;
    }

    this.vy += gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;

    for (const plat of platforms) {
      if (this.bottom >= plat.y && this.bottom <= plat.y + 20 &&
          this.x + this.w > plat.x && this.x < plat.x + plat.w &&
          this.vy > 0) {
        this.y = plat.y - this.h;
        this.vy *= -0.35;
        this.vx *= 0.7;
        this.bounces++;
        if (this.bounces >= this.maxBounces || Math.abs(this.vy) < 30) {
          this.vy = 0;
          this.vx = 0;
          this.settled = true;
          this.settleTimer = 0;
        }
        break;
      }
    }
  }
}

// Projectile (arrow, rock, flail)
export class Projectile extends Entity {
  constructor({ x, y, vx, vy, type, owner, level = 1 }) {
    const dims = type === 'rock' ? { w: 22, h: 20 } :
                 type === 'flail' ? { w: 14, h: 14 } :
                 { w: 18, h: 6 };
    super({ x, y, ...dims });
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    this.owner = owner; // 'player' | 'enemy' | 'trap'
    this.level = level; // attack level 0=high 1=mid 2=low
    this.rotation = 0;
    this.lifeTime = 0;
    this.maxLife = type === 'rock' ? 4 : 3;
  }

  update(dt, gravity = 900) {
    this.lifeTime += dt;
    if (this.lifeTime > this.maxLife) { this.active = false; return; }

    if (this.type === 'rock' || this.type === 'flail') {
      this.vy += gravity * dt;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += (this.type === 'rock' ? 3 : 6) * dt;

    if (this.y > 700 || this.x < -100 || this.x > 1000) this.active = false;
  }
}
