import { Entity, ArmorDebris } from './entity.js';

const GRAVITY = 900;
const MOVE_SPEED = 160;
const JUMP_FORCE = -460;

// Guard/Attack levels: 0 = HIGH, 1 = MID, 2 = LOW
export const LEVEL = { HIGH: 0, MID: 1, LOW: 2 };

// Armor regions
const ARMOR_REGIONS = ['head', 'chest', 'shield', 'legs'];

export class Player extends Entity {
  constructor({ x, y }) {
    super({ x, y, w: 36, h: 64 });
    this.speed = MOVE_SPEED;
    this.jumpForce = JUMP_FORCE;

    // Combat state
    this.guardLevel = LEVEL.MID;
    this.attackLevel = LEVEL.MID;
    this.isAttacking = false;
    this.isBlocking = false;
    this.attackTimer = 0;
    this.attackDuration = 0.28;
    this.attackCooldown = 0;
    this.hitCooldown = 0; // invincibility frames after hit
    this.blockCooldown = 0;

    // Armor system: each piece has HP 1 (present) or 0 (destroyed)
    this.armor = { head: 1, chest: 1, shield: 1, legs: 1 };
    this.armorIntact = 4;

    // Health: only relevant after all armor gone
    this.hp = 3;
    this.dead = false;
    this.deathTimer = 0;

    // Visual
    this.walkFrame = 0;
    this.walkTimer = 0;
    this.sparkEffect = [];
    this.hitFlash = 0;

    // Input snapshot
    this.keys = {};
    this.justPressed = {};
  }

  get hasArmor() { return this.armorIntact > 0; }

  // Map attack/guard level to body region
  static levelToRegion(lvl) {
    if (lvl === LEVEL.HIGH) return 'head';
    if (lvl === LEVEL.MID)  return 'chest';
    return 'legs';
  }

  handleInput(keys, justPressed) {
    this.keys = keys;
    this.justPressed = justPressed;
  }

  update(dt, platforms, sound, debris) {
    if (this.dead) {
      this.deathTimer += dt;
      return;
    }

    this._updateTimers(dt);
    this._processMovement(dt, platforms);
    this._processActions(dt, sound);
    this._updateEffects(dt);
  }

  _updateTimers(dt) {
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.attackTimer = 0;
        this.isAttacking = false;
      }
    }
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.hitCooldown > 0) this.hitCooldown -= dt;
    if (this.blockCooldown > 0) this.blockCooldown -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  _processMovement(dt, platforms) {
    const k = this.keys;

    // Horizontal
    if (k['ArrowLeft'] || k['KeyA']) {
      this.vx = -this.speed;
      this.facing = -1;
    } else if (k['ArrowRight'] || k['KeyD']) {
      this.vx = this.speed;
      this.facing = 1;
    } else {
      this.vx = 0;
    }

    // Level selection (up/down)
    if (this.justPressed['ArrowUp']) {
      this.guardLevel = Math.max(0, this.guardLevel - 1);
      this.attackLevel = this.guardLevel;
    }
    if (this.justPressed['ArrowDown']) {
      this.guardLevel = Math.min(2, this.guardLevel + 1);
      this.attackLevel = this.guardLevel;
    }

    // Jump
    if ((this.justPressed['Space'] || this.justPressed['ArrowUp']) && this.onGround) {
      this.vy = this.jumpForce;
      this.onGround = false;
    }

    // Gravity
    this.applyGravity(GRAVITY, dt);
    this.move(dt);
    this._resolveCollisions(platforms);
  }

  _resolveCollisions(platforms) {
    this.onGround = false;
    for (const p of platforms) {
      if (this.right > p.x && this.x < p.x + p.w) {
        // Landing on top
        if (this.vy >= 0 && this.bottom > p.y && this.bottom < p.y + p.h + 16 &&
            this.y < p.y) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.onGround = true;
        }
        // Head bump
        if (this.vy < 0 && this.y < p.y + p.h && this.bottom > p.y + p.h) {
          this.y = p.y + p.h;
          this.vy = 0;
        }
      }
      // Side collisions
      if (this.bottom > p.y + 4 && this.y < p.y + p.h - 4) {
        if (this.vx > 0 && this.right > p.x && this.x < p.x) {
          this.x = p.x - this.w;
          this.vx = 0;
        }
        if (this.vx < 0 && this.x < p.x + p.w && this.right > p.x + p.w) {
          this.x = p.x + p.w;
          this.vx = 0;
        }
      }
    }

    // World bounds
    if (this.x < 0) this.x = 0;
    if (this.right > 800) this.x = 800 - this.w;
  }

  _processActions(dt, sound) {
    const jp = this.justPressed;

    // Attack
    if ((jp['KeyZ'] || jp['KeyJ']) && this.attackCooldown <= 0 && !this.isAttacking) {
      this.isAttacking = true;
      this.isBlocking = false;
      this.attackTimer = this.attackDuration;
      this.attackCooldown = 0.45;
      sound.attackGrunt();
      // Sparks at blade tip
      this._addSparks();
    }

    // Block
    this.isBlocking = (this.keys['KeyX'] || this.keys['KeyK']) && !this.isAttacking;
  }

  _addSparks() {
    for (let i = 0; i < 6; i++) {
      this.sparkEffect.push({
        x: this.centerX + this.facing * 30,
        y: this._getLevelY(this.attackLevel),
        vx: this.facing * (Math.random() * 120 + 40),
        vy: (Math.random() - 0.5) * 120,
        life: 0.25 + Math.random() * 0.15,
        maxLife: 0.25 + Math.random() * 0.15,
        color: Math.random() > 0.5 ? '#fff' : '#ffd700',
      });
    }
  }

  _updateEffects(dt) {
    this.sparkEffect = this.sparkEffect.filter(s => {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      return s.life > 0;
    });

    this.walkTimer += dt;
    if (Math.abs(this.vx) > 10 && this.onGround) {
      if (this.walkTimer > 0.12) {
        this.walkFrame = (this.walkFrame + 1) % 4;
        this.walkTimer = 0;
      }
    }
  }

  // Get pixel Y for a combat level on this entity
  _getLevelY(lvl) {
    if (lvl === LEVEL.HIGH) return this.y + 14;
    if (lvl === LEVEL.MID)  return this.y + 32;
    return this.y + 52;
  }

  getAttackHitbox() {
    if (!this.isAttacking) return null;
    const reach = 52;
    const lvl = this.attackLevel;
    const hy = this._getLevelY(lvl);
    const hh = 18;
    return {
      x: this.facing === 1 ? this.right : this.x - reach,
      y: hy - hh / 2,
      w: reach,
      h: hh,
      level: lvl,
    };
  }

  receiveHit({ level, source, projectile = false }) {
    if (this.hitCooldown > 0 || this.dead) return false;

    // Check block
    if (this.isBlocking && !projectile) {
      if (this.guardLevel === level) {
        return 'blocked'; // perfect block
      }
    }

    // Determine which armor region is hit
    const hitRegion = Player.levelToRegion(level);
    // Shield covers chest/mid when blocking
    if (this.isBlocking && this.armor.shield > 0 && level === LEVEL.MID) {
      return 'blocked';
    }

    // Armor absorbs hit
    if (this.armor[hitRegion] > 0) {
      this.armor[hitRegion] = 0;
      this.armorIntact--;
      this.hitCooldown = 0.6;
      this.hitFlash = 0.3;
      return { result: 'armor_break', region: hitRegion };
    }

    // Bare hit
    if (this.armorIntact === 0) {
      // Fully unarmored — lethal
      this.hp--;
      this.hitCooldown = 0.5;
      this.hitFlash = 0.4;
      if (this.hp <= 0) {
        this.dead = true;
        this.deathTimer = 0;
      }
      return { result: 'damage', lethal: this.hp <= 0 };
    }

    // Hit unprotected region while some armor still exists
    this.hp = Math.max(0, this.hp - 1);
    this.hitCooldown = 0.5;
    this.hitFlash = 0.4;
    if (this.hp <= 0) {
      this.dead = true;
      this.deathTimer = 0;
    }
    return { result: 'damage', lethal: this.hp <= 0 };
  }

  spawnArmorDebris(region, debrisArr) {
    const colors = { head: '#c0c0c0', chest: '#9090a0', shield: '#8080b0', legs: '#707080' };
    const rx = this.centerX + (Math.random() - 0.5) * 20;
    const ry = this._regionY(region);
    debrisArr.push(new ArmorDebris({
      x: rx - 7, y: ry - 5,
      color: colors[region] || '#aaa',
      shape: region,
      region,
    }));
  }

  _regionY(region) {
    switch (region) {
      case 'head':   return this.y + 8;
      case 'chest':  return this.y + 26;
      case 'shield': return this.y + 36;
      case 'legs':   return this.y + 52;
      default:       return this.centerY;
    }
  }

  reset({ x, y }) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.armor = { head: 1, chest: 1, shield: 1, legs: 1 };
    this.armorIntact = 4;
    this.hp = 3;
    this.dead = false;
    this.deathTimer = 0;
    this.isAttacking = false;
    this.isBlocking = false;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.hitCooldown = 0;
    this.hitFlash = 0;
    this.sparkEffect = [];
    this.guardLevel = LEVEL.MID;
    this.attackLevel = LEVEL.MID;
    this.facing = 1;
  }
}
