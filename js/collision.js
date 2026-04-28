// Collision detection and resolution module
import { ArmorDebris } from './entity.js';

function rectsOverlap(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

/**
 * Handle player vs enemy sword combat
 * Returns array of hit events
 */
export function resolvePlayerVsEnemies(player, enemies, sound, debris) {
  const events = [];

  // Player's attack hitbox vs enemies
  const pHit = player.getAttackHitbox();
  if (pHit) {
    for (const enemy of enemies) {
      if (!enemy.isAlive) continue;
      if (rectsOverlap(pHit, enemy)) {
        const result = enemy.receiveHit({ level: pHit.level });
        if (result && result !== 'blocked') {
          sound.clang();
          if (result.result === 'armor_break') {
            spawnEnemyArmorDebris(enemy, pHit.level, debris);
            sound.armorDrop();
          }
          if (result.result === 'death') {
            sound.enemyDeath();
          }
          events.push({ type: 'playerHitEnemy', enemy, result });
        } else if (result === 'blocked') {
          sound.blockSuccess();
        }
      }
    }
  }

  // Enemy attack hitboxes vs player
  for (const enemy of enemies) {
    if (!enemy.isAlive) continue;
    const eHit = enemy.getAttackHitbox();
    if (!eHit) continue;
    if (rectsOverlap(eHit, player)) {
      if (player.hitCooldown > 0) continue;
      const result = player.receiveHit({ level: eHit.level });
      if (!result) continue;

      if (result === 'blocked') {
        sound.blockSuccess();
        events.push({ type: 'playerBlocked', level: eHit.level });
      } else if (result.result === 'armor_break') {
        player.spawnArmorDebris(result.region, debris);
        sound.armorDrop();
        sound.playerHit();
        events.push({ type: 'playerArmorBreak', region: result.region });
      } else if (result.result === 'damage') {
        sound.playerHit();
        events.push({ type: 'playerDamage', lethal: result.lethal });
      }
    }
  }

  return events;
}

/**
 * Handle projectiles vs player and vs enemies
 */
export function resolveProjectiles(projectiles, player, enemies, platforms, sound, debris) {
  const events = [];

  for (const proj of projectiles) {
    if (!proj.active) continue;

    // Check ground/platform collision
    for (const plat of platforms) {
      if (rectsOverlap(proj, plat)) {
        if (proj.type === 'arrow') {
          proj.active = false;
          break;
        }
        if (proj.type === 'rock') {
          proj.vy *= -0.3;
          proj.vx *= 0.6;
        }
      }
    }

    if (!proj.active) continue;

    if (proj.owner === 'enemy' || proj.owner === 'trap') {
      // vs player
      if (rectsOverlap(proj, player) && player.hitCooldown <= 0) {
        const result = player.receiveHit({ level: proj.level, projectile: true });
        if (result && result !== 'blocked') {
          if (result.result === 'armor_break') {
            player.spawnArmorDebris(result.region, debris);
            sound.armorDrop();
          }
          sound.playerHit();
          events.push({ type: 'projHitPlayer', proj, result });
        }
        if (proj.type !== 'rock') proj.active = false;
      }
    }

    if (proj.owner === 'player') {
      for (const enemy of enemies) {
        if (!enemy.isAlive) continue;
        if (rectsOverlap(proj, enemy)) {
          const result = enemy.receiveHit({ level: proj.level });
          if (result) {
            sound.clang();
            events.push({ type: 'projHitEnemy', proj, enemy, result });
          }
          proj.active = false;
          break;
        }
      }
    }
  }

  return events;
}

function spawnEnemyArmorDebris(enemy, level, debris) {
  const reg = level === 0 ? 'head' : level === 1 ? 'chest' : 'legs';
  const colors = { head: '#8a8090', chest: '#707888', shield: '#304870', legs: '#606070' };
  debris.push(new ArmorDebris({
    x: enemy.centerX - 7,
    y: enemy.y + (reg === 'head' ? 5 : reg === 'chest' ? 20 : 50),
    color: colors[reg] || '#888',
    shape: reg, region: reg,
  }));
}

export { rectsOverlap };
