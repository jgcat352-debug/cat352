import { Player, LEVEL }         from './player.js';
import { createEnemy }            from './enemy.js';
import { ArmorDebris, Projectile } from './entity.js';
import { SoundSystem }             from './sound.js';
import { ParticleSystem }          from './particles.js';
import { resolvePlayerVsEnemies, resolveProjectiles, rectsOverlap }
                                   from './collision.js';
import { LEVELS, buildLevel }      from './level.js';
import {
  drawBackground, drawPlatforms,
  drawPlayer, drawEnemy, drawArmorBar,
  drawDebris, drawProjectiles,
  drawHitEffect, drawStageInfo,
} from './render.js';

const W = 800, H = 520;
const GRAVITY = 900;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.sound  = new SoundSystem();
    this.particles = new ParticleSystem();

    this.state  = 'title'; // 'title' | 'playing' | 'stageclear' | 'gameover' | 'win'
    this.score  = 0;
    this.lives  = 3;
    this.stageIdx = 0;

    this.keys       = {};
    this.justPressed = {};
    this._bindInput();

    this.player = new Player({ x: 80, y: 376 });
    this.enemies = [];
    this.projectiles = [];
    this.debris  = [];
    this.traps   = [];
    this.platforms = [];

    this.hitEffectTimer = 0;
    this.stageClearTimer = 0;
    this.stageTransTimer = 0;
    this.gameOverTimer   = 0;
    this.time = 0;

    this.bgType = 'hall';
    this.stageName = '';
    this.messageEl  = document.getElementById('message-box');
    this.msgTitle   = document.getElementById('message-title');
    this.msgSub     = document.getElementById('message-sub');

    this._showMessage('황금의 성', 'PRESS SPACE TO BEGIN');
    requestAnimationFrame(ts => this._loop(ts));
  }

  _bindInput() {
    const pressed = new Set();
    window.addEventListener('keydown', e => {
      if (!this.keys[e.code]) {
        this.justPressed[e.code] = true;
      }
      this.keys[e.code] = true;
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });
  }

  _showMessage(title, sub) {
    this.msgTitle.textContent = title;
    this.msgSub.textContent   = sub;
    this.messageEl.style.display = 'block';
  }

  _hideMessage() {
    this.messageEl.style.display = 'none';
  }

  // ─── Stage loading ──────────────────────────────────────────────────────────
  _loadStage(idx) {
    const def = buildLevel(LEVELS[idx]);
    this.platforms  = def.platforms;
    this.bgType     = def.background;
    this.stageName  = def.name;

    this.enemies     = def.spawns.map(s => createEnemy(s.type, s.x, s.y));
    this.traps       = def.trapsInst;
    this.projectiles = [];
    this.debris      = [];
    this.particles.particles = [];

    const ps = def.playerStart;
    this.player.reset({ x: ps.x, y: ps.y });
    this._updateHUD();
  }

  _updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const stageEl = document.getElementById('hud-stage');
    const livesEl = document.getElementById('hud-lives');
    if (scoreEl) scoreEl.textContent = String(this.score).padStart(6, '0');
    if (stageEl) stageEl.textContent = String(this.stageIdx + 1);
    if (livesEl) livesEl.textContent = '♦ '.repeat(this.lives).trim() || '—';
  }

  // ─── Main Loop ───────────────────────────────────────────────────────────────
  _loop(ts) {
    const dt = Math.min((ts - (this._lastTs || ts)) / 1000, 0.05);
    this._lastTs = ts;
    this.time += dt;

    this._update(dt);
    this._draw();

    this.justPressed = {};
    requestAnimationFrame(ts2 => this._loop(ts2));
  }

  _update(dt) {
    switch (this.state) {
      case 'title':    this._updateTitle(dt);    break;
      case 'playing':  this._updatePlaying(dt);  break;
      case 'stageclear': this._updateStageClear(dt); break;
      case 'gameover': this._updateGameOver(dt); break;
      case 'win':      this._updateWin(dt);      break;
    }
  }

  _updateTitle(dt) {
    if (this.justPressed['Space'] || this.justPressed['KeyZ']) {
      this.sound._resume();
      this.state = 'playing';
      this.score = 0;
      this.lives = 3;
      this.stageIdx = 0;
      this._loadStage(0);
      this._hideMessage();
    }
  }

  _updatePlaying(dt) {
    const { player, enemies, projectiles, debris, particles, sound, platforms, traps } = this;

    // Input to player
    player.handleInput(this.keys, this.justPressed);
    player.update(dt, platforms, sound, debris);

    // Enemies
    for (const e of enemies) {
      e.update(dt, player, platforms, sound, projectiles);
    }

    // Traps
    for (const t of traps) {
      t.update(dt, projectiles, sound);
    }

    // Projectiles
    for (const p of projectiles) {
      p.update(dt);
    }

    // Debris physics
    for (const d of debris) {
      d.update(dt, platforms);
    }

    // Particles
    particles.update(dt);

    // Hit effect timer
    if (this.hitEffectTimer > 0) this.hitEffectTimer -= dt;

    // ── Collision resolution ──────────────────────────────────────────────────
    const meleeEvents = resolvePlayerVsEnemies(player, enemies, sound, debris);
    const projEvents  = resolveProjectiles(projectiles, player, enemies, platforms, sound, debris);

    // Process hit events for particles/score/debris
    for (const ev of [...meleeEvents, ...projEvents]) {
      this._handleEvent(ev, sound, particles, debris);
    }

    // Remove inactive
    this.projectiles = projectiles.filter(p => p.active);
    this.debris      = debris.filter(d => d.active);
    this.enemies     = enemies.filter(e => e.active !== false);

    // Mark dead enemies inactive after animation
    for (const e of this.enemies) {
      if (e.state === 'dead' && e.deathTimer > 1.2) e.active = false;
    }

    this._updateHUD();

    // ── Stage clear check ─────────────────────────────────────────────────────
    const liveEnemies = this.enemies.filter(e => e.isAlive);
    if (liveEnemies.length === 0 && !player.dead) {
      this.state = 'stageclear';
      this.stageClearTimer = 0;
      sound.stageClear();
      this._showMessage('STAGE CLEAR!', 'Advancing to next chamber...');
      return;
    }

    // ── Player death ──────────────────────────────────────────────────────────
    if (player.dead && player.deathTimer > 1.6) {
      this.lives--;
      this._updateHUD();
      if (this.lives <= 0) {
        this.state = 'gameover';
        this.gameOverTimer = 0;
        sound.gameOver();
        this._showMessage('GAME OVER', 'PRESS SPACE TO RETRY');
      } else {
        // Respawn
        const ps = LEVELS[this.stageIdx].playerStart;
        player.reset({ x: ps.x, y: ps.y });
        this.projectiles = [];
        this.hitEffectTimer = 0;
      }
    }
  }

  _handleEvent(ev, sound, particles, debris) {
    switch (ev.type) {
      case 'playerHitEnemy': {
        const { enemy, result } = ev;
        const cx = enemy.centerX, cy = enemy.centerY;
        if (result.result === 'death') {
          particles.spawnDeathExplosion(cx, cy, enemy.type);
          this.score += enemy.type === 'giant' ? 500 : enemy.type === 'amazon' ? 200 : 100;
          // drop all armor pieces
          ['head','chest','shield','legs'].forEach(r => {
            if (enemy.armor && enemy.armor[r] !== undefined) {
              this._spawnEnemyDebris(enemy, r);
            }
          });
        } else if (result.result === 'armor_break') {
          particles.spawnSparks(cx, cy, enemy.facing);
          this.score += 30;
        } else {
          particles.spawnSparks(cx, cy, enemy.facing);
          this.score += 10;
        }
        this._updateHUD();
        break;
      }
      case 'playerArmorBreak': {
        particles.spawnBloodless(this.player.centerX, this.player.centerY);
        this.hitEffectTimer = 0.3;
        break;
      }
      case 'playerDamage': {
        particles.spawnBloodless(this.player.centerX, this.player.centerY);
        this.hitEffectTimer = 0.5;
        break;
      }
      case 'projHitPlayer': {
        particles.spawnBloodless(this.player.centerX, this.player.centerY);
        this.hitEffectTimer = 0.4;
        if (ev.proj.type === 'rock') particles.spawnRockSmash(ev.proj.x, ev.proj.y);
        break;
      }
      case 'projHitEnemy': {
        particles.spawnSparks(ev.enemy.centerX, ev.enemy.centerY, ev.enemy.facing);
        if (ev.result?.result === 'death') {
          particles.spawnDeathExplosion(ev.enemy.centerX, ev.enemy.centerY, ev.enemy.type);
          this.score += 100;
          this._updateHUD();
        }
        break;
      }
    }
  }

  _spawnEnemyDebris(enemy, region) {
    const colors = { head: '#8a8090', chest: '#707888', shield: '#304870', legs: '#606070' };
    this.debris.push(new ArmorDebris({
      x: enemy.centerX - 7,
      y: enemy.y + (region === 'head' ? 5 : region === 'chest' ? 20 : region === 'legs' ? 50 : 30),
      color: colors[region] || '#888',
      shape: region, region,
    }));
  }

  _updateStageClear(dt) {
    this.stageClearTimer += dt;
    if (this.stageClearTimer > 2.5) {
      this.stageIdx++;
      if (this.stageIdx >= LEVELS.length) {
        this.state = 'win';
        this._showMessage('YOU WIN!', '황금의 성을 정복했습니다! PRESS SPACE');
        return;
      }
      this.state = 'playing';
      this._loadStage(this.stageIdx);
      this._hideMessage();
    }
  }

  _updateGameOver(dt) {
    this.gameOverTimer += dt;
    if (this.gameOverTimer > 1) {
      if (this.justPressed['Space'] || this.justPressed['KeyZ']) {
        this.state = 'playing';
        this.score = 0;
        this.lives = 3;
        this.stageIdx = 0;
        this._loadStage(0);
        this._hideMessage();
      }
    }
  }

  _updateWin(dt) {
    if (this.justPressed['Space'] || this.justPressed['KeyZ']) {
      this.state = 'title';
      this._showMessage('황금의 성', 'PRESS SPACE TO BEGIN');
    }
  }

  // ─── Draw ────────────────────────────────────────────────────────────────────
  _draw() {
    const { ctx, player, enemies, projectiles, debris, particles, time } = this;
    ctx.clearRect(0, 0, W, H);

    drawBackground(ctx, W, H, this.bgType, time);
    drawPlatforms(ctx, this.platforms);

    // Entities (back to front)
    drawDebris(ctx, debris);
    for (const e of enemies) drawEnemy(ctx, e, time);
    drawPlayer(ctx, player, time);
    drawProjectiles(ctx, projectiles);
    particles.draw(ctx);

    // HUD overlays
    if (this.state === 'playing' || this.state === 'stageclear') {
      drawArmorBar(ctx, player, W);
      drawStageInfo(ctx, this.stageName, W);
    }
    if (this.hitEffectTimer > 0) {
      drawHitEffect(ctx, W, H, this.hitEffectTimer);
    }
  }
}
