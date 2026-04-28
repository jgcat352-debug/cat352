// Render module — pixel-art style drawing using Canvas 2D
import { LEVEL } from './player.js';

const TAU = Math.PI * 2;

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  stone:      '#2a2830',
  stoneDark:  '#1a1820',
  stoneLight: '#3a3648',
  torch:      '#ff9900',
  torchInner: '#ffdd66',
  gold:       '#d4af37',
  goldDark:   '#8a7010',
  silver:     '#c0c8d0',
  silverDark: '#707880',
  blood:      '#8b0000',
  bone:       '#e8dfc8',
  boneDark:   '#c0b898',
  dirt:       '#3a2a18',
  shadow:     'rgba(0,0,0,0.55)',
};

// ─── Background Scenes ────────────────────────────────────────────────────────
export function drawBackground(ctx, W, H, bgType, time) {
  // Base stone fill
  ctx.fillStyle = C.stoneDark;
  ctx.fillRect(0, 0, W, H);

  drawStoneTiles(ctx, W, H);
  drawArches(ctx, W, H, bgType);
  drawTorches(ctx, W, H, time, bgType);
  drawFloorDetails(ctx, W, bgType);
  drawAmbientLight(ctx, W, H);

  if (bgType === 'throne') drawThroneDetails(ctx, W, H);
  if (bgType === 'chamber') drawChamberDetails(ctx, W, H);
}

function drawStoneTiles(ctx, W, H) {
  const tw = 40, th = 30;
  for (let row = 0; row * th < H; row++) {
    for (let col = 0; col * tw < W; col++) {
      const shade = (row + col) % 2 === 0 ? C.stone : C.stoneDark;
      ctx.fillStyle = shade;
      ctx.fillRect(col * tw + 1, row * th + 1, tw - 2, th - 2);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(col * tw, row * th, tw, 2);
      ctx.fillRect(col * tw, row * th, 2, th);
    }
  }
}

function drawArches(ctx, W, H, bgType) {
  // Gothic arched windows / doorways
  const positions = bgType === 'throne' ? [120, 400, 680] : [100, 700];
  ctx.save();
  for (const ax of positions) {
    const aw = 70, ah = 120;
    const ay = H - 440 - ah;
    // Dark interior
    ctx.fillStyle = '#0d0d18';
    ctx.beginPath();
    ctx.rect(ax - aw/2, ay + ah/2, aw, ah/2);
    ctx.arc(ax, ay + ah/2, aw/2, Math.PI, 0, false);
    ctx.fill();
    // Stone frame
    ctx.strokeStyle = C.stoneLight;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.rect(ax - aw/2 - 4, ay + ah/2, aw + 8, ah/2 + 6);
    ctx.arc(ax, ay + ah/2, aw/2 + 4, Math.PI, 0, false);
    ctx.stroke();
    // Subtle light glow from window
    const grd = ctx.createRadialGradient(ax, ay + ah/2, 5, ax, ay + ah/2, aw);
    grd.addColorStop(0, 'rgba(80,60,150,0.18)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.rect(ax - aw/2, ay + ah/2, aw, ah/2);
    ctx.arc(ax, ay + ah/2, aw/2, Math.PI, 0, false);
    ctx.fill();
  }
  ctx.restore();
}

function drawTorches(ctx, W, H, time, bgType) {
  const flicker = 0.7 + 0.3 * Math.sin(time * 8.3) * Math.cos(time * 5.7);
  const positions = bgType === 'hall' ? [60, 380, 740] :
                    bgType === 'chamber' ? [40, 280, 520, 760] :
                    [80, 240, 560, 720];

  for (const tx of positions) {
    const ty = H - 340;
    drawTorch(ctx, tx, ty, time, flicker);
  }
}

function drawTorch(ctx, x, y, time, flicker) {
  // Bracket
  ctx.fillStyle = '#333';
  ctx.fillRect(x - 3, y, 6, 16);
  ctx.fillRect(x - 8, y - 2, 16, 5);
  // Torch body
  ctx.fillStyle = '#5a3010';
  ctx.fillRect(x - 3, y + 2, 6, 14);
  // Flame glow
  const grd = ctx.createRadialGradient(x, y, 2, x, y, 55 * flicker);
  grd.addColorStop(0, `rgba(255,180,50,${0.35 * flicker})`);
  grd.addColorStop(0.5, `rgba(255,100,20,${0.15 * flicker})`);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(x - 55, y - 55, 110, 110);
  // Flame
  for (let i = 0; i < 3; i++) {
    const fw = 8 - i * 2;
    const fh = (14 + i * 4) * flicker;
    const fx = x + Math.sin(time * 7 + i * 1.2) * 2;
    ctx.fillStyle = i === 0 ? C.torch : i === 1 ? '#ffbb44' : C.torchInner;
    ctx.beginPath();
    ctx.moveTo(fx - fw, y);
    ctx.lineTo(fx + fw, y);
    ctx.lineTo(fx + fw/3, y - fh);
    ctx.lineTo(fx, y - fh - 4);
    ctx.lineTo(fx - fw/3, y - fh);
    ctx.closePath();
    ctx.fill();
  }
}

function drawFloorDetails(ctx, W, bgType) {
  // Floor line with shadow
  const fy = 440;
  ctx.fillStyle = C.stoneDark;
  ctx.fillRect(0, fy, W, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, fy, W, 8);
  // Floor ornament line
  ctx.fillStyle = C.goldDark;
  ctx.fillRect(0, fy - 2, W, 2);
}

function drawAmbientLight(ctx, W, H) {
  // Top vignette
  const topGrd = ctx.createLinearGradient(0, 0, 0, 180);
  topGrd.addColorStop(0, 'rgba(0,0,0,0.7)');
  topGrd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topGrd;
  ctx.fillRect(0, 0, W, 180);
  // Side vignettes
  const sideGrd = ctx.createLinearGradient(0, 0, 80, 0);
  sideGrd.addColorStop(0, 'rgba(0,0,0,0.5)');
  sideGrd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sideGrd;
  ctx.fillRect(0, 0, 80, H);
  const sideGrd2 = ctx.createLinearGradient(W, 0, W - 80, 0);
  sideGrd2.addColorStop(0, 'rgba(0,0,0,0.5)');
  sideGrd2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sideGrd2;
  ctx.fillRect(W - 80, 0, 80, H);
}

function drawThroneDetails(ctx, W, H) {
  const fy = 440;
  // Throne at back center
  ctx.fillStyle = '#2a1a08';
  ctx.fillRect(340, fy - 120, 120, 120);
  // Throne back
  ctx.fillStyle = '#3a2a10';
  ctx.fillRect(350, fy - 200, 100, 90);
  // Gold accents
  ctx.fillStyle = C.gold;
  ctx.fillRect(340, fy - 122, 120, 4);
  ctx.fillRect(340, fy - 122, 4, 122);
  ctx.fillRect(456, fy - 122, 4, 122);
  // Emblem above throne
  drawEmblem(ctx, 400, fy - 240);
}

function drawEmblem(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  // Shield shape
  ctx.fillStyle = C.goldDark;
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(28, -10);
  ctx.lineTo(28, 10);
  ctx.lineTo(0, 30);
  ctx.lineTo(-28, 10);
  ctx.lineTo(-28, -10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cross
  ctx.fillStyle = C.gold;
  ctx.fillRect(-3, -20, 6, 40);
  ctx.fillRect(-18, -4, 36, 8);
  ctx.restore();
}

function drawChamberDetails(ctx, W, H) {
  // Weapon racks on walls
  const fy = 440;
  drawWeaponRack(ctx, 30, fy - 110);
  drawWeaponRack(ctx, 740, fy - 110);
}

function drawWeaponRack(ctx, x, y) {
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(x, y, 30, 80);
  // Swords
  ctx.strokeStyle = C.silver;
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 5 + i * 10, y + 10);
    ctx.lineTo(x + 5 + i * 10, y + 70);
    ctx.stroke();
    ctx.fillStyle = C.gold;
    ctx.fillRect(x + 1 + i * 10, y + 35, 12, 4);
  }
}

// ─── Platform drawing ─────────────────────────────────────────────────────────
export function drawPlatforms(ctx, platforms) {
  for (let i = 1; i < platforms.length - 1; i++) { // skip floor (0) and ceiling (last)
    const p = platforms[i];
    // Stone slab
    ctx.fillStyle = C.stoneLight;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    // Highlight top edge
    ctx.fillStyle = '#4a4460';
    ctx.fillRect(p.x, p.y, p.w, 3);
    // Gold ornament edge
    ctx.fillStyle = C.goldDark;
    ctx.fillRect(p.x, p.y - 1, p.w, 2);
    // Shadow below
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(p.x, p.y + p.h, p.w, 6);
  }
}

// ─── Player drawing ────────────────────────────────────────────────────────────
export function drawPlayer(ctx, player, time) {
  if (player.dead && player.deathTimer > 1.5) return;

  ctx.save();
  if (player.hitFlash > 0 && Math.floor(player.hitFlash / 0.05) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }
  if (player.dead) {
    ctx.globalAlpha = Math.max(0, 1 - player.deathTimer / 1.5);
  }

  const { x, y, w, h, facing, armor, isAttacking, isBlocking, guardLevel, attackLevel, walkFrame } = player;
  const cx = x + w / 2;

  ctx.save();
  ctx.translate(cx, y + h);
  ctx.scale(facing, 1);

  _drawKnight(ctx, w, h, armor, isAttacking, isBlocking, guardLevel, attackLevel, walkFrame, time);

  ctx.restore();

  // Sparks
  for (const s of player.sparkEffect) {
    const prog = 1 - s.life / s.maxLife;
    ctx.globalAlpha = (1 - prog) * (player.hitFlash > 0 ? 0.4 : 1);
    ctx.fillStyle = s.color;
    const sz = 4 * (1 - prog);
    ctx.fillRect(s.x - sz / 2, s.y - sz / 2, sz, sz);
  }

  // Guard level indicator
  ctx.globalAlpha = 0.85;
  _drawGuardIndicator(ctx, player);

  ctx.restore();
}

function _drawKnight(ctx, w, h, armor, isAttacking, isBlocking, guardLevel, attackLevel, walkFrame, time) {
  const legAnim = [0, 6, 0, -6][walkFrame] || 0;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.6, 6, 0, 0, TAU);
  ctx.fill();

  // ── Legs ─────────────────────────────────────────────────────────────
  if (armor.legs) {
    ctx.fillStyle = C.silver;
    // Left leg
    ctx.fillRect(-11, -36 + legAnim, 9, 26);
    ctx.fillStyle = C.silverDark;
    ctx.fillRect(-11, -36 + legAnim, 9, 3);
    // Right leg
    ctx.fillStyle = C.silver;
    ctx.fillRect(2, -36 - legAnim, 9, 26);
    ctx.fillStyle = C.silverDark;
    ctx.fillRect(2, -36 - legAnim, 9, 3);
    // Boots
    ctx.fillStyle = '#282838';
    ctx.fillRect(-13, -10 + legAnim, 11, 10);
    ctx.fillRect(2, -10 - legAnim, 11, 10);
    // Knee guards
    ctx.fillStyle = C.gold;
    ctx.fillRect(-11, -24 + legAnim, 9, 4);
    ctx.fillRect(2, -24 - legAnim, 9, 4);
  } else {
    // No armor — cloth/bare legs
    ctx.fillStyle = '#3a3050';
    ctx.fillRect(-9, -36 + legAnim, 7, 26);
    ctx.fillRect(2, -36 - legAnim, 7, 26);
    ctx.fillStyle = '#222';
    ctx.fillRect(-11, -10 + legAnim, 9, 10);
    ctx.fillRect(2, -10 - legAnim, 9, 10);
  }

  // ── Chest ────────────────────────────────────────────────────────────
  const torsoY = -72;
  if (armor.chest) {
    ctx.fillStyle = C.silver;
    ctx.fillRect(-13, torsoY, 26, 36);
    ctx.fillStyle = C.silverDark;
    ctx.fillRect(-13, torsoY, 26, 3);
    ctx.fillRect(-13, torsoY, 3, 36);
    // Center line
    ctx.fillStyle = '#8898a8';
    ctx.fillRect(-1, torsoY + 4, 2, 28);
    // Gold collar
    ctx.fillStyle = C.gold;
    ctx.fillRect(-13, torsoY, 26, 5);
    ctx.fillStyle = C.goldDark;
    ctx.fillRect(-8, torsoY + 18, 16, 4);
  } else {
    ctx.fillStyle = '#3a3050';
    ctx.fillRect(-11, torsoY, 22, 36);
    ctx.fillStyle = '#555070';
    ctx.fillRect(-6, torsoY + 8, 12, 20);
  }

  // ── Shield arm (left side in facing direction) ────────────────────────
  const shieldY = guardLevel === LEVEL.HIGH ? -90 :
                  guardLevel === LEVEL.LOW  ? -52 : -72;
  if (isBlocking && armor.shield) {
    ctx.fillStyle = '#3060a0';
    ctx.beginPath();
    ctx.moveTo(-20, shieldY - 18);
    ctx.lineTo(-38, shieldY - 8);
    ctx.lineTo(-38, shieldY + 22);
    ctx.lineTo(-20, shieldY + 30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.arc(-29, shieldY + 6, 5, 0, TAU);
    ctx.fill();
  } else {
    // Arm
    ctx.fillStyle = armor.shield ? C.silver : '#3a3050';
    ctx.fillRect(-24, torsoY + 4, 10, 24);
    if (armor.shield) {
      ctx.fillStyle = C.silverDark;
      ctx.fillRect(-24, torsoY + 4, 10, 3);
    }
  }

  // ── Sword arm (right) ─────────────────────────────────────────────────
  const swordY = isAttacking
    ? (attackLevel === LEVEL.HIGH ? -88 : attackLevel === LEVEL.LOW ? -54 : -72)
    : -72;
  const swordAngle = isAttacking ? -0.3 : 0.1;
  ctx.save();
  ctx.translate(14, swordY + 10);
  ctx.rotate(swordAngle);
  ctx.fillStyle = armor.chest ? C.silver : '#3a3050';
  ctx.fillRect(0, -8, 10, 22);
  // Sword
  ctx.fillStyle = C.silverDark;
  ctx.fillRect(3, -50, 5, 46);
  ctx.fillStyle = C.silver;
  ctx.fillRect(4, -50, 3, 44);
  ctx.fillStyle = C.gold;
  ctx.fillRect(-4, -8, 18, 5); // crossguard
  ctx.fillRect(4, -3, 5, 8);  // grip
  ctx.fillStyle = C.goldDark;
  ctx.beginPath();
  ctx.arc(6, -52, 4, 0, TAU);
  ctx.fill();
  ctx.restore();

  // ── Head ─────────────────────────────────────────────────────────────
  const headY = -100;
  if (armor.head) {
    // Helmet
    ctx.fillStyle = C.silver;
    ctx.fillRect(-12, headY, 24, 22);
    ctx.beginPath();
    ctx.arc(0, headY, 12, Math.PI, 0, false);
    ctx.fill();
    // Visor
    ctx.fillStyle = '#101018';
    ctx.fillRect(-9, headY + 8, 18, 7);
    // Crest
    ctx.fillStyle = '#cc2020';
    ctx.fillRect(-3, headY - 10, 6, 12);
    // Gold trim
    ctx.fillStyle = C.gold;
    ctx.fillRect(-12, headY + 14, 24, 3);
    ctx.fillRect(-12, headY, 24, 3);
  } else {
    // Bare head / face
    ctx.fillStyle = '#e8c880';
    ctx.beginPath();
    ctx.arc(0, headY + 8, 12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#101018';
    ctx.fillRect(-3, headY + 4, 2, 3);
    ctx.fillRect(1, headY + 4, 2, 3);
    ctx.fillRect(-4, headY + 10, 8, 2);
    ctx.fillStyle = '#6040a0';
    ctx.fillRect(-8, headY - 4, 16, 6);
  }
}

function _drawGuardIndicator(ctx, player) {
  if (player.dead) return;
  const labels = ['HIGH', 'MID', 'LOW'];
  const colors  = ['#ff6060', '#60ff60', '#6060ff'];
  const y = player.y - 18;
  const lbl = labels[player.guardLevel];
  const col = colors[player.guardLevel];
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillText(lbl, player.centerX + 1, y + 1);
  ctx.fillStyle = col;
  ctx.fillText(lbl, player.centerX, y);

  // Attack mode indicator
  if (player.isAttacking) {
    ctx.fillStyle = '#ffd700';
    ctx.fillText('⚔', player.centerX + player.facing * 30, player.y + 30);
  }
  if (player.isBlocking) {
    ctx.fillStyle = '#4488ff';
    ctx.fillText('🛡', player.centerX - player.facing * 10, player.y + 10);
  }
}

// ─── Armor bar UI ──────────────────────────────────────────────────────────────
export function drawArmorBar(ctx, player, W) {
  const px = 14, py = 70;
  const regions = ['head', 'chest', 'shield', 'legs'];
  const icons   = ['H', 'C', 'S', 'L'];
  const colors  = [C.silver, C.silver, '#4488ff', C.silverDark];

  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(px - 4, py - 12, 130, 20);
  ctx.fillStyle = '#888';
  ctx.fillText('ARMOR', px, py);

  regions.forEach((r, i) => {
    const bx = px + i * 30;
    const by = py + 6;
    const intact = player.armor[r] > 0;
    ctx.fillStyle = intact ? colors[i] : '#333';
    ctx.fillRect(bx, by, 22, 14);
    ctx.strokeStyle = intact ? '#fff' : '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, 22, 14);
    ctx.fillStyle = intact ? '#111' : '#555';
    ctx.textAlign = 'center';
    ctx.fillText(icons[i], bx + 11, by + 10);
  });

  // HP pips (bare health)
  const hpX = px + 130;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#888';
  ctx.fillText('HP', hpX, py);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < player.hp ? '#ee3333' : '#333';
    ctx.fillRect(hpX + i * 18, py + 6, 14, 14);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(hpX + i * 18, py + 6, 14, 14);
  }
}

// ─── Enemy drawing ─────────────────────────────────────────────────────────────
export function drawEnemy(ctx, enemy, time) {
  if (!enemy.active) return;
  const alpha = enemy.state === 'dead'
    ? Math.max(0, 1 - enemy.deathTimer / 0.8)
    : 1;
  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  if (enemy.state === 'hurt' && Math.floor(time / 0.05) % 2 === 0) {
    ctx.globalAlpha = alpha * 0.5;
  }

  const cx = enemy.centerX;
  ctx.save();
  ctx.translate(cx, enemy.y + enemy.h);
  ctx.scale(enemy.facing, 1);

  switch (enemy.type) {
    case 'skeleton': _drawSkeleton(ctx, enemy, time); break;
    case 'amazon':   _drawAmazon(ctx, enemy, time);   break;
    case 'giant':    _drawGiant(ctx, enemy, time);    break;
  }

  ctx.restore();

  // HP bar
  if (enemy.state !== 'dead' && enemy.hp < enemy.maxHp) {
    const bw = enemy.w + 10, bh = 5;
    const bx = enemy.x - 5, by = enemy.y - 14;
    ctx.fillStyle = '#330000';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(bx, by, Math.max(0, bw * enemy.hp / enemy.maxHp), bh);
    ctx.strokeStyle = '#550000';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
  }

  // Guard level indicator for enemies
  if (enemy.isBlocking || (enemy.state !== 'dead' && enemy.state !== 'hurt')) {
    _drawEnemyGuardHint(ctx, enemy);
  }

  ctx.restore();
}

function _drawSkeleton(ctx, enemy, time) {
  const h = enemy.h;
  const lw = enemy.walkFrame % 2 === 0 ? 6 : -6;
  const wobble = Math.sin(enemy.wobble) * 2;

  // Legs (bones)
  ctx.strokeStyle = C.bone;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-5, -10); ctx.lineTo(-8 + lw, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, -10);  ctx.lineTo(8 - lw, 0); ctx.stroke();

  // Ribcage
  ctx.fillStyle = C.bone;
  ctx.fillRect(-10, -50 + wobble, 20, 32);
  ctx.fillStyle = C.boneDark;
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-9, -46 + wobble + i * 7, 18, 2);
  }
  // Spine
  ctx.fillStyle = C.stoneDark;
  ctx.fillRect(-2, -50 + wobble, 4, 32);

  // Arms
  ctx.strokeStyle = C.bone;
  ctx.lineWidth = 4;
  const attackSwing = enemy.isAttacking ? -0.5 : 0;
  ctx.save(); ctx.translate(12, -40 + wobble); ctx.rotate(attackSwing);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 10); ctx.stroke();
  // Rusty sword
  ctx.fillStyle = '#505050';
  ctx.fillRect(14, 6, 4, 28);
  ctx.fillStyle = C.gold;
  ctx.fillRect(8, 8, 14, 4);
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-12, -40 + wobble); ctx.lineTo(-16, -20 + wobble); ctx.stroke();

  // Skull
  ctx.fillStyle = C.bone;
  ctx.beginPath(); ctx.arc(0, -62 + wobble, 14, 0, TAU); ctx.fill();
  ctx.fillStyle = C.boneDark;
  ctx.beginPath(); ctx.arc(0, -62 + wobble, 12, 0, TAU); ctx.fill();
  ctx.fillStyle = C.bone;
  ctx.beginPath(); ctx.arc(0, -62 + wobble, 10, 0, TAU); ctx.fill();
  // Eye sockets
  ctx.fillStyle = '#0a0010';
  ctx.beginPath(); ctx.arc(-5, -64 + wobble, 4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -64 + wobble, 4, 0, TAU); ctx.fill();
  // Glowing eyes
  ctx.fillStyle = '#ff3300';
  ctx.beginPath(); ctx.arc(-5, -64 + wobble, 2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -64 + wobble, 2, 0, TAU); ctx.fill();
  // Jaw
  ctx.fillStyle = C.bone;
  ctx.fillRect(-8, -54 + wobble, 16, 6);
  ctx.fillStyle = C.boneDark;
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-7 + i * 4, -52 + wobble, 3, 5);
  }

  // Armor piece (chest)
  if (enemy.armor.chest) {
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(-11, -48 + wobble, 22, 30);
    ctx.strokeStyle = '#7a6040';
    ctx.lineWidth = 2;
    ctx.strokeRect(-11, -48 + wobble, 22, 30);
  }
}

function _drawAmazon(ctx, enemy, time) {
  const lw = enemy.walkFrame % 2 === 0 ? 8 : -8;
  const isAtt = enemy.isAttacking;

  // Legs
  ctx.fillStyle = enemy.armor.legs ? '#8a5030' : '#5a3820';
  ctx.fillRect(-10, -38 + lw, 9, 28);
  ctx.fillRect(1, -38 - lw, 9, 28);
  // Boots
  ctx.fillStyle = '#2a1808';
  ctx.fillRect(-12, -10 + lw, 11, 10);
  ctx.fillRect(1, -10 - lw, 11, 10);

  // Torso
  ctx.fillStyle = enemy.armor.chest ? '#804020' : '#5a2810';
  ctx.fillRect(-13, -70, 26, 34);
  // Chest detail
  if (enemy.armor.chest) {
    ctx.fillStyle = '#a05030';
    ctx.fillRect(-11, -68, 22, 6);
    ctx.fillStyle = C.gold;
    ctx.fillRect(-4, -52, 8, 3);
  }

  // Shield arm
  ctx.fillStyle = '#6a3820';
  ctx.fillRect(-22, -64, 10, 22);
  if (enemy.armor.shield || true) {
    // Round shield
    ctx.fillStyle = '#5a4020';
    ctx.beginPath(); ctx.arc(-28, -52, 14, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = C.gold;
    ctx.beginPath(); ctx.arc(-28, -52, 5, 0, TAU); ctx.fill();
  }

  // Sword arm
  const swingAngle = isAtt ? -0.8 : -0.1;
  ctx.save(); ctx.translate(13, -56); ctx.rotate(swingAngle);
  ctx.fillStyle = '#6a3820'; ctx.fillRect(0, -8, 10, 22);
  // Spear / sword
  ctx.fillStyle = '#808888'; ctx.fillRect(3, -60, 5, 56);
  ctx.fillStyle = C.silver;  ctx.fillRect(4, -60, 3, 55);
  ctx.fillStyle = '#606868'; ctx.fillRect(0, -4, 14, 5);
  // Spear tip
  ctx.fillStyle = C.silver;
  ctx.beginPath();
  ctx.moveTo(5, -62); ctx.lineTo(1, -60); ctx.lineTo(9, -60); ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Head
  const hy = -86;
  ctx.fillStyle = '#e8b870';
  ctx.beginPath(); ctx.arc(0, hy, 13, 0, TAU); ctx.fill();
  // Hair
  ctx.fillStyle = '#3a1808';
  ctx.fillRect(-13, hy - 13, 26, 8);
  ctx.fillRect(-14, hy - 8, 4, 14);
  // Eyes
  ctx.fillStyle = '#101010';
  ctx.fillRect(-6, hy - 3, 3, 3);
  ctx.fillRect(3, hy - 3, 3, 3);
  // War paint
  ctx.fillStyle = '#cc2222';
  ctx.fillRect(-7, hy + 2, 5, 2);
  ctx.fillRect(2, hy + 2, 5, 2);
  // Helmet/headband
  if (enemy.armor.head) {
    ctx.fillStyle = '#6a3820';
    ctx.fillRect(-13, hy - 6, 26, 6);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.strokeRect(-13, hy - 6, 26, 6);
  }
}

function _drawGiant(ctx, enemy, time) {
  const lw = enemy.walkFrame % 2 === 0 ? 10 : -10;
  const h = enemy.h;
  const phase = enemy.phase;

  // Legs
  ctx.fillStyle = phase === 2 ? '#505060' : C.silverDark;
  ctx.fillRect(-17, -48 + lw, 14, 38);
  ctx.fillRect(3, -48 - lw, 14, 38);
  // Boots
  ctx.fillStyle = '#1a1828';
  ctx.fillRect(-20, -10 + lw, 18, 10);
  ctx.fillRect(2, -10 - lw, 18, 10);
  // Knee spikes
  ctx.fillStyle = C.silver;
  ctx.fillRect(-17, -28 + lw, 14, 5);
  ctx.fillRect(3, -28 - lw, 14, 5);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = C.silverDark;
    ctx.fillRect(-16 + i * 5, -33 + lw, 4, 5);
    ctx.fillRect(4 + i * 5, -33 - lw, 4, 5);
  }

  // Massive torso
  ctx.fillStyle = phase === 2 ? '#404050' : C.silver;
  ctx.fillRect(-20, -98, 40, 52);
  ctx.fillStyle = C.silverDark;
  ctx.fillRect(-20, -98, 40, 4);
  ctx.fillRect(-20, -98, 4, 52);
  // Chest ridges
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#7080a0';
    ctx.fillRect(-18, -92 + i * 14, 36, 5);
  }
  // Shoulder pads
  ctx.fillStyle = C.silver;
  ctx.fillRect(-28, -98, 14, 16);
  ctx.fillRect(14, -98, 14, 16);
  for (let s = 0; s < 3; s++) {
    ctx.fillStyle = C.silverDark;
    ctx.fillRect(-28, -98 + s * 5, 14, 2);
    ctx.fillRect(14, -98 + s * 5, 14, 2);
  }

  // Shield arm
  ctx.fillStyle = C.silver;
  ctx.fillRect(-36, -90, 14, 32);
  // Large tower shield
  if (enemy.armor.shield) {
    ctx.fillStyle = '#3050a0';
    ctx.fillRect(-58, -106, 22, 56);
    ctx.strokeStyle = C.silver; ctx.lineWidth = 3; ctx.strokeRect(-58, -106, 22, 56);
    ctx.fillStyle = C.gold;
    ctx.fillRect(-52, -90, 10, 20);
    ctx.fillRect(-48, -96, 2, 32);
  }

  // Great sword
  const swingAngle = enemy.isAttacking ? -0.9 : 0;
  ctx.save(); ctx.translate(22, -78); ctx.rotate(swingAngle);
  ctx.fillStyle = C.silver; ctx.fillRect(0, -10, 14, 32);
  ctx.fillStyle = C.silverDark; ctx.fillRect(4, -90, 8, 84);
  ctx.fillStyle = C.silver;     ctx.fillRect(5, -90, 5, 84);
  ctx.fillStyle = C.gold;
  ctx.fillRect(-6, -6, 26, 8);
  ctx.fillRect(5, 2, 6, 12);
  // Blade tip
  ctx.fillStyle = C.silver;
  ctx.beginPath();
  ctx.moveTo(4, -92); ctx.lineTo(0, -88); ctx.lineTo(12, -88); ctx.closePath();
  ctx.fill();
  if (phase === 2) {
    // Red glow on blade in phase 2
    ctx.fillStyle = 'rgba(200,50,50,0.3)';
    ctx.fillRect(4, -90, 8, 84);
  }
  ctx.restore();

  // Massive helmet
  const hy = -116;
  ctx.fillStyle = phase === 2 ? '#505060' : C.silver;
  ctx.fillRect(-18, hy, 36, 22);
  ctx.beginPath(); ctx.arc(0, hy, 18, Math.PI, 0, false); ctx.fill();
  ctx.fillStyle = '#080810';
  ctx.fillRect(-14, hy + 10, 28, 8);
  // Horns
  ctx.fillStyle = '#3a3848';
  ctx.fillRect(-20, hy - 10, 6, 16);
  ctx.fillRect(14, hy - 10, 6, 16);
  ctx.beginPath(); ctx.moveTo(-20, hy - 10); ctx.lineTo(-14, hy - 24); ctx.lineTo(-14, hy - 10); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(20, hy - 10); ctx.lineTo(14, hy - 24); ctx.lineTo(14, hy - 10); ctx.closePath(); ctx.fill();
  // Gold trim
  ctx.fillStyle = phase === 2 ? '#cc3333' : C.gold;
  ctx.fillRect(-18, hy + 16, 36, 4);
  ctx.fillRect(-18, hy, 36, 4);

  if (phase === 2) {
    // Phase 2: red eyes
    ctx.fillStyle = '#ff0000';
    ctx.beginPath(); ctx.arc(-6, hy + 14, 3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(6, hy + 14, 3, 0, TAU); ctx.fill();
  }
}

function _drawEnemyGuardHint(ctx, enemy) {
  // Show a small colored dot above enemy to hint at guard/attack level
  const colors = ['#ff4040', '#40cc40', '#4040ff'];
  const lvl = enemy.isAttacking ? enemy.attackLevel : enemy.guardLevel;
  if (lvl === undefined || lvl === null) return;
  ctx.fillStyle = colors[lvl] || '#fff';
  ctx.beginPath();
  ctx.arc(enemy.centerX, enemy.y - 20, 4, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ─── Debris drawing ───────────────────────────────────────────────────────────
export function drawDebris(ctx, debris) {
  for (const d of debris) {
    if (!d.active) continue;
    ctx.save();
    ctx.globalAlpha = d.alpha;
    ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
    ctx.rotate(d.rotation);
    ctx.fillStyle = d.color;
    ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 1;
    ctx.strokeRect(-d.w / 2, -d.h / 2, d.w, d.h);
    ctx.restore();
  }
}

// ─── Projectile drawing ────────────────────────────────────────────────────────
export function drawProjectiles(ctx, projectiles) {
  for (const p of projectiles) {
    if (!p.active) continue;
    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.rotate(p.rotation);
    if (p.type === 'arrow') {
      ctx.fillStyle = '#8a6030';
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.fillStyle = C.silver;
      ctx.fillRect(p.w / 2 - 6, -p.h / 2 - 1, 6, p.h + 2);
    } else if (p.type === 'rock') {
      ctx.fillStyle = '#555560';
      ctx.beginPath();
      ctx.arc(0, 0, p.w / 2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#333340';
      ctx.beginPath();
      ctx.arc(-3, -3, p.w / 4, 0, TAU);
      ctx.fill();
    } else if (p.type === 'flail') {
      ctx.fillStyle = '#404048';
      ctx.beginPath();
      ctx.arc(0, 0, p.w / 2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#606068';
      ctx.fillRect(-2, -p.h / 2, 4, p.h);
      ctx.fillRect(-p.w / 2, -2, p.w, 4);
    }
    ctx.restore();
  }
}

// ─── Particle Effects ─────────────────────────────────────────────────────────
export function drawParticles(ctx, particles) {
  for (const p of particles) {
    const prog = 1 - p.life / p.maxLife;
    ctx.globalAlpha = Math.max(0, 1 - prog * 1.5);
    ctx.fillStyle = p.color || '#fff';
    const sz = p.size * (1 - prog * 0.5);
    ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
  }
  ctx.globalAlpha = 1;
}

// ─── HUD overlay ──────────────────────────────────────────────────────────────
export function drawHitEffect(ctx, W, H, intensity) {
  if (intensity <= 0) return;
  ctx.fillStyle = `rgba(200,30,30,${intensity * 0.35})`;
  ctx.fillRect(0, 0, W, H);
  // Vignette flash
  const grd = ctx.createRadialGradient(W/2, H/2, H/4, W/2, H/2, H);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, `rgba(180,0,0,${intensity * 0.5})`);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
}

export function drawStageInfo(ctx, stageName, W) {
  ctx.save();
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillText(stageName, W / 2 + 1, 56);
  ctx.fillStyle = C.gold;
  ctx.fillText(stageName, W / 2, 55);
  ctx.restore();
}
