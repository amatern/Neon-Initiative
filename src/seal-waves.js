import { CONFIG }          from './config.js';
import { createFormation } from './enemies.js';

export const SEAL_DATA = {
  3: {
    name:    'SEAL OF FIRE',
    color:   '#ff3300',
    glow:    '#ff6600',
    narrator: {
      start:   ['Crimson Peak burns.', 'The Seal of Fire is yours to defend.'],
      victory: ['The Seal of Fire holds.', "The dragon's body stays bound in stone."],
      defeat:  ['The Ruby goes dark.', 'Infernadax flexes against his chains.'],
    },
  },
  8: {
    name:    'SEAL OF THE DEEP',
    color:   '#0077cc',
    glow:    '#44aaff',
    narrator: {
      start:   ['Thessalmar floods the Weeping Depths.', 'Guard the Sapphire.'],
      victory: ['The Seal of the Deep holds.', 'Infernadax bleeds and cannot heal.'],
      defeat:  ['The Sapphire drowns.', "The dragon's wounds begin to close."],
    },
  },
  13: {
    name:    'SEAL OF STORM',
    color:   '#ffdd00',
    glow:    '#aaeeff',
    narrator: {
      start:   ['Silvaclaw circles Stormcrest Spire.', 'Hold the Topaz.'],
      victory: ['The Seal of Storm holds.', 'Infernadax stays grounded in the dark.'],
      defeat:  ['The Topaz falls silent.', 'The dragon remembers his wings.'],
    },
  },
  18: {
    name:    'SEAL OF DAWN',
    color:   '#ffd700',
    glow:    '#ffffff',
    narrator: {
      start:   ['Vexmire poisons the Radiant Temple.', 'Shield the Diamond.'],
      victory: ['The Seal of Dawn holds.', "The dragon's fear stays caged in light."],
      defeat:  ['The Diamond turns grey.', "The dragon's terror spills across the coast."],
    },
  },
  23: {
    name:    'SEAL OF SHADOW',
    color:   '#aa44ff',
    glow:    '#00ff88',
    narrator: {
      start:   ['Nyx coils in the Umbral Vault.', 'Guard the last Seal — and what it hides.'],
      victory: ['The Seal of Shadow holds.', 'All five endure — now hunt the phylactery.'],
      defeat:  ['The Emerald goes black.', 'His magic wakes, and his hidden heart beats on.'],
    },
  },
};

// Seal of Fire — armored shield crest, wide base, top spike
function drawCrimsonDrake(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x,           y - s);        // top spike
  ctx.lineTo(x + s * 0.8, y - s * 0.25); // right shoulder
  ctx.lineTo(x + s * 0.55, y + s);       // right base
  ctx.lineTo(x - s * 0.55, y + s);       // left base
  ctx.lineTo(x - s * 0.8, y - s * 0.25); // left shoulder
  ctx.closePath();
}

// Seal of the Deep — horizontal serpentine lens
function drawSapphireSerpent(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x - s * 1.3, y);            // left tip
  ctx.lineTo(x - s * 0.4, y - s * 0.55); // upper left
  ctx.lineTo(x + s * 0.4, y - s * 0.55); // upper right
  ctx.lineTo(x + s * 1.3, y);            // right tip
  ctx.lineTo(x + s * 0.4, y + s * 0.55); // lower right
  ctx.lineTo(x - s * 0.4, y + s * 0.55); // lower left
  ctx.closePath();
}

// Seal of Storm — aerodynamic upward triangle
function drawStormDrake(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x,           y - s);        // top point
  ctx.lineTo(x + s * 0.9, y + s * 0.8); // bottom right
  ctx.lineTo(x - s * 0.9, y + s * 0.8); // bottom left
  ctx.closePath();
}

// Seal of Dawn — corrupted star (two overlapping triangles)
function drawDawnDrake(ctx, x, y, s) {
  ctx.beginPath();
  // upward triangle
  ctx.moveTo(x,           y - s);
  ctx.lineTo(x + s * 0.87, y + s * 0.5);
  ctx.lineTo(x - s * 0.87, y + s * 0.5);
  ctx.closePath();
  ctx.moveTo(x,           y + s);        // downward triangle
  ctx.lineTo(x + s * 0.87, y - s * 0.5);
  ctx.lineTo(x - s * 0.87, y - s * 0.5);
  ctx.closePath();
}

// Seal of Shadow — irregular asymmetric pentagon (hard to read)
function drawShadowDrake(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x + s * 0.2,  y - s);       // top, off-center
  ctx.lineTo(x + s,        y - s * 0.2); // right
  ctx.lineTo(x + s * 0.6,  y + s);       // lower right
  ctx.lineTo(x - s * 0.8,  y + s * 0.5); // lower left
  ctx.lineTo(x - s * 0.5,  y - s * 0.7); // upper left
  ctx.closePath();
}

export function createSealWave(wave, enemyBullets) {
  const seal = SEAL_DATA[wave];
  if (!seal) throw new Error(`No seal data for wave ${wave}`);

  const DRAW = {
    3:  drawCrimsonDrake,
    8:  drawSapphireSerpent,
    13: drawStormDrake,
    18: drawDawnDrake,
    23: drawShadowDrake,
  };

  const FORMATION_OPTS = {
    3:  { cols: 9,  rows: 4, swayBase: CONFIG.ENEMY_SWAY_BASE * 0.4,  colorEnemy: '#ff3300', colorDiver: '#ff6600', drawEnemy: DRAW[3]  },
    8:  { cols: 10, rows: 5, swayBase: CONFIG.ENEMY_SWAY_BASE * 1.2,  colorEnemy: '#0077cc', colorDiver: '#44aaff', drawEnemy: DRAW[8]  },
    13: { cols: 7,  rows: 3, swayBase: CONFIG.ENEMY_SWAY_BASE * 2.0,  colorEnemy: '#ffdd00', colorDiver: '#aaeeff', drawEnemy: DRAW[13], diveMaxSpeed: CONFIG.DIVE_MAX_SPEED * 1.4 },
    18: { cols: 8,  rows: 4, swayBase: CONFIG.ENEMY_SWAY_BASE,        colorEnemy: '#ffd700', colorDiver: '#ffffff', drawEnemy: DRAW[18] },
    23: { cols: 8,  rows: 4, swayBase: CONFIG.ENEMY_SWAY_BASE * 0.8,  colorEnemy: '#aa44ff', colorDiver: '#00ff88', drawEnemy: DRAW[23], decoyChance: 0.5 },
  };

  const opts  = FORMATION_OPTS[wave];
  const inner = createFormation(wave, opts.rows, opts);

  // Seal-specific state (populated in later tasks)
  const mechanics = createSealMechanics(wave, inner, enemyBullets);

  let _playerX = CONFIG.CANVAS_WIDTH / 2;
  let _playerY = CONFIG.CANVAS_HEIGHT - 60;

  return {
    update(dt, playerX, playerY) {
      _playerX = playerX;
      _playerY = playerY;
      inner.update(dt, playerX);
      mechanics.update(dt, playerX, playerY);
    },
    wasDiveLaunched()  { return inner.wasDiveLaunched(); },
    getEnemyRects()    { return inner.getEnemyRects(); },
    getDiverRects()    { return inner.getDiverRects(); },
    kill(ref)          { return inner.kill(ref); },
    allDead()          { return inner.allDead(); },
    render(ctx)        { inner.render(ctx); mechanics.render(ctx); },

    getMechanics()     { return mechanics; },
  };
}

// Stub — replaced per-seal in Tasks 5–8
function createSealMechanics(wave, formation, enemyBullets) {
  return { update() {}, render() {} };
}

export function getSealData(wave) {
  return SEAL_DATA[wave] ?? null;
}

export function isSealWave(wave) {
  return wave % 5 === 3 && wave <= 23;
}
