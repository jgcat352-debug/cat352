import { Entity, Projectile } from './entity.js';
import { LEVEL } from './player.js';

const GRAVITY = 900;

// ─── Base Enemy ──────────────────────────────────────────────────────────────
class Enemy extends Entity {
  constructor({ x, y, w, h, type, hp, speed }) {
    super({ x, y, w, h });
    this.type    = type;
    this.maxHp   = hp;
    this.hp      = hp;
    this.speed   = speed;
    this.state   = 'idle'; // idle | patrol | attack | hurt | dead
    this.stateTimer  = 0;
    this.thinkTimer  = 0;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.hurtTimer   = 0;
    this.deathTimer  = 0;

    // Combat
    this.attackLevel  = LEVEL.MID;
    this.guardLevel   = LEVEL.MID;
    this.isAttacking  = false;
    this.isBlocking   = false;
    this.attackReach  = 50;
    this.attackDamageWindow = [0.15, 0.3]; // [start, end] of attack animation

    // AI
    this.aggroRange   = 300;
    this.patrolDir    = Math.random() > 0.5 ? 1 : -1;
    this.patrolTimer  = 0;

    // Armor (enemies also have body regions)
    this.armor = { head: 1, chest: 1, shield: 0, legs: 1 };
    this.armorIntact = 3;
  }

  get isAlive() { return this.state !== 'dead'; }

  _baseUpdate(dt, player, platforms, gravity = GRAVITY) {
    // Gravity
    this.applyGravity(gravity, dt);
    this.move(dt);
    this._resolveCollisions(platforms);

    // Timers
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) { this.isAttacking = false; this.attackTimer = 0; }
    }
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0) this.state = 'idle';
    }
    if (this.state === 'dead') {
      this.deathTimer += dt;
      this.vx *= 0.9;
      return;
    }
  }

  _resolveCollisions(platforms) {
    this.onGround = false;
    for (const p of platforms) {
      if (this.right > p.x && this.x < p.x + p.w) {
        if (this.vy >= 0 && this.bottom > p.y && this.bottom < p.y + p.h + 16 && this.y < p.y) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.onGround = true;
        }
      }
      if (this.bottom > p.y + 4 && this.y < p.y + p.h - 4) {
        if (this.vx > 0 && this.right > p.x && this.x < p.x) {
          this.x = p.x - this.w; this.vx = 0; this.patrolDir *= -1;
        }
        if (this.vx < 0 && this.x < p.x + p.w && this.right > p.x + p.w) {
          this.x = p.x + p.w; this.vx = 0; this.patrolDir *= -1;
        }
      }
    }
    if (this.x < 0) { this.x = 0; this.patrolDir = 1; }
    if (this.right > 800) { this.x = 800 - this.w; this.patrolDir = -1; }
  }

  _aiMoveToward(player, speed) {
    const dx = player.centerX - this.centerX;
    if (Math.abs(dx) > 10) {
      this.vx = Math.sign(dx) * speed;
      this.facing = Math.sign(dx);
    } else {
      this.vx = 0;
    }
  }

  _inRange(player) {
    return Math.abs(player.centerX - this.centerX) < this.aggroRange &&
           Math.abs(player.centerY - this.centerY) < 180;
  }

  _inAttackRange(player) {
    return Math.abs(player.centerX - this.centerX) < (this.w / 2 + player.w / 2 + this.attackReach + 10);
  }

  receiveHit({ level }) {
    if (this.state === 'dead') return false;
    // Check guard
    if (this.isBlocking && this.guardLevel === level) return 'blocked';

    const reg = level === 0 ? 'head' : level === 1 ? 'chest' : 'legs';

    if (this.armor[reg] > 0) {
      this.armor[reg] = 0;
      this.armorIntact = Math.max(0, this.armorIntact - 1);
    }

    this.hp--;
    this.state = 'hurt';
    this.hurtTimer = 0.35;
    this.isAttacking = false;
    this.attackTimer = 0;

    if (this.hp <= 0) {
      this.state = 'dead';
      this.deathTimer = 0;
      this.vx = this.facing * -80;
      this.vy = -120;
    }
    return { result: this.hp <= 0 ? 'death' : 'damage' };
  }

  getAttackHitbox() {
    if (!this.isAttacking) return null;
    const progress = 1 - this.attackTimer / 0.5;
    if (progress < this.attackDamageWindow[0] || progress > this.attackDamageWindow[1]) return null;
    const reach = this.attackReach;
    const lvl = this.attackLevel;
    const hy = this._getLevelY(lvl);
    return { x: this.facing === 1 ? this.right : this.x - reach, y: hy - 10, w: reach, h: 20, level: lvl };
  }

  _getLevelY(lvl) {
    if (lvl === LEVEL.HIGH) return this.y + Math.floor(this.h * 0.18);
    if (lvl === LEVEL.MID)  return this.y + Math.floor(this.h * 0.5);
    return this.y + Math.floor(this.h * 0.82);
  }
}

// ─── Skeleton Soldier ─────────────────────────────────────────────────────────
export class Skeleton extends Enemy {
  constructor({ x, y }) {
    super({ x, y, w: 32, h: 60, type: 'skeleton', hp: 2, speed: 70 });
    this.aggroRange = 280;
    this.attackCooldownTime = 1.6;
    this.guardLevel = LEVEL.MID;
    this.armor = { head: 0, chest: 1, shield: 0, legs: 0 };
    this.armorIntact = 1;
    this.walkFrame = 0;
    this.walkTimer = 0;
    this.wobble = Math.random() * Math.PI * 2;
  }

  update(dt, player, platforms, sound, projectiles) {
    this._baseUpdate(dt, player, platforms);
    if (this.state === 'dead') return;

    this.wobble += dt * 3;
    this.walkTimer += dt;
    if (Math.abs(this.vx) > 5 && this.onGround && this.walkTimer > 0.15) {
      this.walkFrame = (this.walkFrame + 1) % 4;
      this.walkTimer = 0;
    }

    if (this.state === 'hurt') return;

    if (this._inRange(player)) {
      this._aiMoveToward(player, this.speed);
      if (this._inAttackRange(player) && this.attackCooldown <= 0) {
        this._chooseAttackLevel(player);
        this._startAttack(sound);
      }
    } else {
      this._patrol(dt);
    }
  }

  _chooseAttackLevel(player) {
    // Skeletons vary attack randomly
    this.attackLevel = Math.floor(Math.random() * 3);
  }

  _startAttack(sound) {
    this.isAttacking = true;
    this.attackTimer = 0.5;
    this.attackCooldown = this.attackCooldownTime;
    this.vx = 0;
  }

  _patrol(dt) {
    this.patrolTimer += dt;
    if (this.patrolTimer > 2.5) {
      this.patrolDir *= -1;
      this.patrolTimer = 0;
    }
    this.vx = this.patrolDir * 40;
    this.facing = this.patrolDir;
  }
}

// ─── Amazon Warrior ───────────────────────────────────────────────────────────
export class Amazon extends Enemy {
  constructor({ x, y }) {
    super({ x, y, w: 30, h: 62, type: 'amazon', hp: 3, speed: 100 });
    this.aggroRange = 320;
    this.attackCooldownTime = 1.1;
    this.attackReach = 44;
    this.guardLevel = LEVEL.HIGH; // prefers high guard
    this.armor = { head: 1, chest: 1, shield: 0, legs: 0 };
    this.armorIntact = 2;
    this.leapCooldown = 0;
    this.walkFrame = 0;
    this.walkTimer = 0;
  }

  update(dt, player, platforms, sound, projectiles) {
    this._baseUpdate(dt, player, platforms);
    if (this.state === 'dead') return;

    if (this.leapCooldown > 0) this.leapCooldown -= dt;

    this.walkTimer += dt;
    if (Math.abs(this.vx) > 10 && this.onGround && this.walkTimer > 0.1) {
      this.walkFrame = (this.walkFrame + 1) % 6;
      this.walkTimer = 0;
    }

    if (this.state === 'hurt') return;

    if (this._inRange(player)) {
      const dx = Math.abs(player.centerX - this.centerX);
      this._aiMoveToward(player, this.speed);
      // Amazon can leap over player
      if (dx < 80 && this.onGround && this.leapCooldown <= 0) {
        this.vy = -350;
        this.leapCooldown = 3;
      }
      if (this._inAttackRange(player) && this.attackCooldown <= 0) {
        this.attackLevel = Math.random() > 0.4 ? LEVEL.HIGH : LEVEL.MID;
        this._startAttack(sound);
      }
    } else {
      this._patrol(dt);
    }
  }

  _startAttack(sound) {
    this.isAttacking = true;
    this.attackTimer = 0.4;
    this.attackCooldown = this.attackCooldownTime;
    this.vx = 0;
  }

  _patrol(dt) {
    this.patrolTimer += dt;
    if (this.patrolTimer > 1.8) { this.patrolDir *= -1; this.patrolTimer = 0; }
    this.vx = this.patrolDir * 55;
    this.facing = this.patrolDir;
  }
}

// ─── Giant Swordsman (Boss) ────────────────────────────────────────────────────
export class GiantSwordsman extends Enemy {
  constructor({ x, y }) {
    super({ x, y, w: 52, h: 88, type: 'giant', hp: 8, speed: 55 });
    this.aggroRange = 500;
    this.attackCooldownTime = 1.8;
    this.attackReach = 70;
    this.guardLevel = LEVEL.MID;
    this.armor = { head: 1, chest: 1, shield: 1, legs: 1 };
    this.armorIntact = 4;
    this.slamCooldown = 0;
    this.phase = 1; // becomes more aggressive at low HP
    this.walkFrame = 0;
    this.walkTimer = 0;
  }

  update(dt, player, platforms, sound, projectiles) {
    this._baseUpdate(dt, player, platforms);
    if (this.state === 'dead') return;

    if (this.slamCooldown > 0) this.slamCooldown -= dt;
    if (this.hp <= 4 && this.phase === 1) {
      this.phase = 2;
      this.speed = 80;
      this.attackCooldownTime = 1.2;
    }

    this.walkTimer += dt;
    if (Math.abs(this.vx) > 10 && this.onGround && this.walkTimer > 0.18) {
      this.walkFrame = (this.walkFrame + 1) % 4;
      this.walkTimer = 0;
    }

    if (this.state === 'hurt') return;

    this._aiMoveToward(player, this.speed);
    if (this._inAttackRange(player) && this.attackCooldown <= 0) {
      if (this.slamCooldown <= 0 && Math.random() > 0.6) {
        this._groundSlam(player, sound, projectiles);
      } else {
        this.attackLevel = [LEVEL.HIGH, LEVEL.MID, LEVEL.LOW][Math.floor(Math.random() * 3)];
        this._startAttack(sound);
      }
    }
  }

  _groundSlam(player, sound, projectiles) {
    this.isAttacking = true;
    this.attackTimer = 0.6;
    this.attackCooldown = this.attackCooldownTime + 0.5;
    this.slamCooldown = 4;
    this.attackLevel = LEVEL.LOW;
    // Shockwave projectile along ground
    const sx = this.facing === 1 ? this.right : this.x;
    projectiles.push(new Projectile({
      x: sx, y: this.bottom - 14,
      vx: this.facing * 200, vy: 0,
      type: 'flail', owner: 'enemy', level: LEVEL.LOW,
    }));
    sound.clang();
  }

  _startAttack(sound) {
    this.isAttacking = true;
    this.attackTimer = 0.55;
    this.attackCooldown = this.attackCooldownTime;
    this.vx = 0;
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────
export function createEnemy(type, x, y) {
  switch (type) {
    case 'skeleton': return new Skeleton({ x, y });
    case 'amazon':   return new Amazon({ x, y });
    case 'giant':    return new GiantSwordsman({ x, y });
    default:         return new Skeleton({ x, y });
  }
}
