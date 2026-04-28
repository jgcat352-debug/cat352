// Level / Map data: platforms, traps, enemy spawns
import { Projectile } from './entity.js';
import { LEVEL } from './player.js';

// ─── Trap System ─────────────────────────────────────────────────────────────
export class Trap {
  constructor({ type, x, y, interval, delay = 0 }) {
    this.type = type; // 'arrow' | 'rock'
    this.x = x;
    this.y = y;
    this.interval = interval;
    this.timer = delay;
    this.active = true;
  }

  update(dt, projectiles, sound) {
    if (!this.active) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.interval;
      this._fire(projectiles, sound);
    }
  }

  _fire(projectiles, sound) {
    if (this.type === 'arrow') {
      // Wall arrow — shoots horizontally
      projectiles.push(new Projectile({
        x: this.x, y: this.y,
        vx: this.vx || -200, vy: 0,
        type: 'arrow', owner: 'trap',
        level: LEVEL.MID,
      }));
      sound.arrowShoot();
    } else if (this.type === 'rock') {
      // Ceiling rock — falls
      projectiles.push(new Projectile({
        x: this.x, y: this.y,
        vx: (Math.random() - 0.5) * 40, vy: 0,
        type: 'rock', owner: 'trap',
        level: LEVEL.HIGH,
      }));
      sound.rockFall();
    }
  }
}

// ─── Level definitions ───────────────────────────────────────────────────────
const FLOOR_Y = 440; // main floor Y

export const LEVELS = [
  // Stage 1: Entry Hall
  {
    name: '입구 홀',
    background: 'hall',
    platforms: [
      { x: 0,   y: FLOOR_Y, w: 800, h: 80 }, // main floor
      { x: 100, y: 330,     w: 140, h: 18 }, // left balcony
      { x: 560, y: 330,     w: 140, h: 18 }, // right balcony
      { x: 300, y: 260,     w: 200, h: 18 }, // center bridge
      { x: 0,   y: 0,       w: 800, h: 20 }, // ceiling (invisible)
    ],
    spawns: [
      { type: 'skeleton', x: 580, y: FLOOR_Y - 60 },
      { type: 'skeleton', x: 680, y: FLOOR_Y - 60 },
      { type: 'amazon',   x: 500, y: FLOOR_Y - 62 },
    ],
    traps: [
      { type: 'arrow', x: 795, y: FLOOR_Y - 30, vx: -200, interval: 4, delay: 2 },
      { type: 'rock',  x: 400, y: 25,            interval: 5, delay: 1.5 },
    ],
    playerStart: { x: 80, y: FLOOR_Y - 64 },
    clearCondition: 'all_enemies',
  },
  // Stage 2: Guard Chambers
  {
    name: '경비 막사',
    background: 'chamber',
    platforms: [
      { x: 0,   y: FLOOR_Y, w: 800, h: 80 },
      { x: 50,  y: 360,     w: 120, h: 18 },
      { x: 250, y: 300,     w: 120, h: 18 },
      { x: 450, y: 360,     w: 120, h: 18 },
      { x: 630, y: 290,     w: 120, h: 18 },
      { x: 0,   y: 0,       w: 800, h: 20 },
    ],
    spawns: [
      { type: 'skeleton', x: 350, y: FLOOR_Y - 60 },
      { type: 'skeleton', x: 550, y: FLOOR_Y - 60 },
      { type: 'amazon',   x: 450, y: FLOOR_Y - 62 },
      { type: 'amazon',   x: 650, y: 290 - 62 },
    ],
    traps: [
      { type: 'arrow', x: 795, y: FLOOR_Y - 30, vx: -200, interval: 3,   delay: 1 },
      { type: 'arrow', x: 795, y: FLOOR_Y - 30, vx: -200, interval: 3,   delay: 2.5 },
      { type: 'rock',  x: 200, y: 25,            interval: 4.5, delay: 0.5 },
      { type: 'rock',  x: 600, y: 25,            interval: 5,   delay: 2 },
    ],
    playerStart: { x: 60, y: FLOOR_Y - 64 },
    clearCondition: 'all_enemies',
  },
  // Stage 3: The Throne (Boss)
  {
    name: '왕좌의 방 — BOSS',
    background: 'throne',
    platforms: [
      { x: 0,   y: FLOOR_Y, w: 800, h: 80 },
      { x: 150, y: 350,     w: 160, h: 18 },
      { x: 490, y: 350,     w: 160, h: 18 },
      { x: 300, y: 240,     w: 200, h: 18 },
      { x: 0,   y: 0,       w: 800, h: 20 },
    ],
    spawns: [
      { type: 'giant',    x: 580, y: FLOOR_Y - 88 },
      { type: 'skeleton', x: 480, y: FLOOR_Y - 60 },
    ],
    traps: [
      { type: 'arrow', x: 795, y: FLOOR_Y - 50, vx: -200, interval: 2.5, delay: 1 },
      { type: 'arrow', x: 795, y: 350 - 30,     vx: -200, interval: 3.5, delay: 0.5 },
      { type: 'rock',  x: 150, y: 25,            interval: 3.5, delay: 0 },
      { type: 'rock',  x: 650, y: 25,            interval: 3,   delay: 1.8 },
    ],
    playerStart: { x: 60, y: FLOOR_Y - 64 },
    clearCondition: 'all_enemies',
  },
];

export function buildLevel(levelDef) {
  const traps = levelDef.traps.map(td => {
    const t = new Trap(td);
    t.vx = td.vx;
    return t;
  });
  return {
    ...levelDef,
    trapsInst: traps,
  };
}
