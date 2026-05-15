import { CONFIG } from './config.js';

function drawHexagon(ctx, x, y, size) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a  = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + size * Math.cos(a);
    const py = y + size * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawTriangle(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.9, y + s * 0.8);
  ctx.lineTo(x - s * 0.9, y + s * 0.8);
  ctx.closePath();
}

function drawDiamond(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.65, y);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x - s * 0.65, y);
  ctx.closePath();
}

function drawShield(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.8,  y - s * 0.25);
  ctx.lineTo(x + s * 0.55, y + s);
  ctx.lineTo(x - s * 0.55, y + s);
  ctx.lineTo(x - s * 0.8,  y - s * 0.25);
  ctx.closePath();
}

function drawArrow(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x - s,        y - s * 0.4);
  ctx.lineTo(x,            y + s * 0.8);
  ctx.lineTo(x + s,        y - s * 0.4);
  ctx.lineTo(x + s * 0.5,  y - s * 0.4);
  ctx.lineTo(x,            y + s * 0.2);
  ctx.lineTo(x - s * 0.5,  y - s * 0.4);
  ctx.closePath();
}

function drawCross(ctx, x, y, s) {
  const t = s * 0.35;
  ctx.beginPath();
  ctx.moveTo(x - t, y - s); ctx.lineTo(x + t, y - s);
  ctx.lineTo(x + t, y - t); ctx.lineTo(x + s, y - t);
  ctx.lineTo(x + s, y + t); ctx.lineTo(x + t, y + t);
  ctx.lineTo(x + t, y + s); ctx.lineTo(x - t, y + s);
  ctx.lineTo(x - t, y + t); ctx.lineTo(x - s, y + t);
  ctx.lineTo(x - s, y - t); ctx.lineTo(x - t, y - t);
  ctx.closePath();
}

const NORMAL_SHAPES = [drawHexagon, drawTriangle, drawDiamond, drawShield, drawArrow, drawCross];

export function createFormation(wave, rows = CONFIG.ENEMY_ROWS, opts = {}) {
  const COLS       = opts.cols          ?? CONFIG.ENEMY_COLS;
  const SPACING_X  = opts.spacingX      ?? CONFIG.ENEMY_SPACING_X;
  const SPACING_Y  = opts.spacingY      ?? CONFIG.ENEMY_SPACING_Y;
  const TOP_MARGIN = opts.topMargin     ?? CONFIG.ENEMY_TOP_MARGIN;
  const SWAY_BASE  = opts.swayBase      ?? CONFIG.ENEMY_SWAY_BASE;
  const SWAY_INC   = opts.swayIncrement ?? CONFIG.ENEMY_SWAY_INCREMENT;
  const DIVE_SPD   = opts.diveMaxSpeed  ?? CONFIG.DIVE_MAX_SPEED;
  const drawEnemy  = opts.drawEnemy     ?? drawHexagon;
  const COL_ENEMY  = opts.colorEnemy    ?? CONFIG.COLOR_ENEMY;
  const COL_DIVER  = opts.colorDiver    ?? CONFIG.COLOR_DIVER;
  const DECOY_CHANCE = opts.decoyChance ?? 0;

  const randomize = !opts.drawEnemy;
  const palette   = randomize
    ? CONFIG.WAVE_PALETTES[Math.floor((wave - 1) / 5) % CONFIG.WAVE_PALETTES.length]
    : null;

  const formationWidth = (COLS - 1) * SPACING_X;
  const startX         = (CONFIG.CANVAS_WIDTH - formationWidth) / 2;

  const base = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < COLS; col++) {
      base.push({
        baseX:      startX + col * SPACING_X,
        baseY:      TOP_MARGIN + row * SPACING_Y,
        alive:      true,
        diving:     false,
        isDecoy:    Math.random() < DECOY_CHANCE,
        flashTimer: 0,
        draw:       randomize ? NORMAL_SHAPES[Math.floor(Math.random() * NORMAL_SHAPES.length)] : null,
        color:      randomize ? palette[Math.floor(Math.random() * palette.length)] : null,
      });
    }
  }

  let groupOffsetX = 0;
  let dir          = 1;
  const swaySpeed  = SWAY_BASE + (wave - 1) * SWAY_INC;

  const actualX = e => e.baseX + groupOffsetX;
  const actualY = e => e.baseY;

  const divers  = [];
  let diveTimer        = CONFIG.DIVE_INTERVAL + (Math.random() * 2 - 1) * CONFIG.DIVE_INTERVAL_VARIANCE;
  let newDiveLaunched  = false;

  function nextDiveTimer() {
    return CONFIG.DIVE_INTERVAL + (Math.random() * 2 - 1) * CONFIG.DIVE_INTERVAL_VARIANCE;
  }

  function launchDive(playerX) {
    const candidates = base.filter(e => e.alive && !e.diving && !e.isDecoy);
    if (candidates.length === 0 || divers.length >= CONFIG.DIVE_MAX_SIMULTANEOUS) return;

    const ref  = candidates[Math.floor(Math.random() * candidates.length)];
    ref.diving = true;

    divers.push({
      ref,
      x:       actualX(ref),
      y:       actualY(ref),
      trackX:  actualX(ref), // steering x, separate from wobble offset
      vx:      0,
      vy:      50,
      phase:   Math.random() * Math.PI * 2,
      targetX: playerX,
      state:   'DIVING',
    });

    diveTimer       = nextDiveTimer();
    newDiveLaunched = true;
  }

  // Returns true when the diver should be removed from divers[].
  function updateDiver(d, dt) {
    switch (d.state) {
      case 'DIVING':
        d.vy     += CONFIG.DIVE_ACCEL * dt;
        d.vy      = Math.min(d.vy, DIVE_SPD);
        d.vx     += (d.targetX - d.trackX) * CONFIG.DIVE_STEER * dt;
        d.vx      = Math.max(-CONFIG.DIVE_MAX_VX, Math.min(CONFIG.DIVE_MAX_VX, d.vx));
        d.trackX += d.vx * dt;
        d.y      += d.vy * dt;
        d.phase  += CONFIG.DIVE_WOBBLE_SPEED * dt;
        d.x       = d.trackX + Math.sin(d.phase) * CONFIG.DIVE_WOBBLE_AMP;

        if (d.y > CONFIG.DIVE_LOOP_Y) d.state = 'LOOPING';
        break;

      case 'LOOPING':
        d.vy     -= CONFIG.LOOP_ACCEL * dt;
        d.trackX += d.vx * dt;
        d.y      += d.vy * dt;
        d.x       = d.trackX; // no wobble during the pull-up arc

        if (d.y < -CONFIG.ENEMY_SIZE * 2) {
          d.state  = 'RETURNING';
          d.y      = -CONFIG.ENEMY_SIZE * 2;
          d.vy     = CONFIG.RETURN_SPEED;
          d.vx     = 0;
          d.trackX = d.x;
        }
        break;

      case 'RETURNING': {
        const slotX = actualX(d.ref);
        const slotY = actualY(d.ref);
        const dx    = slotX - d.x;
        const dy    = slotY - d.y;
        const dist  = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.RETURN_SNAP_DIST) {
          d.ref.diving = false;
          return true; // signal removal
        }

        const step = CONFIG.RETURN_SPEED * dt / dist;
        d.x      += dx * step;
        d.y      += dy * step;
        d.trackX  = d.x;
        break;
      }
    }
    return false;
  }

  return {
    // All shootable enemies: formation (non-diving) + active divers.
    getEnemyRects() {
      const rects = base
        .filter(e => e.alive && !e.diving)
        .map(e => ({ x: actualX(e), y: actualY(e), hw: CONFIG.ENEMY_HITBOX, hh: CONFIG.ENEMY_HITBOX, ref: e }));

      for (const d of divers) {
        rects.push({ x: d.x, y: d.y, hw: CONFIG.ENEMY_HITBOX, hh: CONFIG.ENEMY_HITBOX, ref: d.ref });
      }

      return rects;
    },

    // Diver positions only — used by game.js for player collision.
    getDiverRects() {
      return divers.map(d => ({ x: d.x, y: d.y, hw: CONFIG.ENEMY_HITBOX, hh: CONFIG.ENEMY_HITBOX, ref: d.ref }));
    },

    kill(ref) {
      if (ref.isDecoy) {
        ref.flashTimer = CONFIG.DECOY_FLASH_DURATION;
        return false;  // decoy: flash but survive
      }
      ref.alive  = false;
      ref.diving = false;
      const idx = divers.findIndex(d => d.ref === ref);
      if (idx !== -1) divers.splice(idx, 1);
      return true;   // actually killed
    },

    allDead() { return base.every(e => !e.alive || e.isDecoy); },

    wasDiveLaunched() { return newDiveLaunched; },

    // playerX: player's current x, used to aim new dives.
    update(dt, playerX) {
      newDiveLaunched = false;
      const live = base.filter(e => e.alive);
      if (live.length === 0) return;

      // Sway — driven by non-diving enemies only
      groupOffsetX += swaySpeed * dir * dt;
      const nonDiving = live.filter(e => !e.diving);
      if (nonDiving.length > 0) {
        const leftmost  = Math.min(...nonDiving.map(e => actualX(e)));
        const rightmost = Math.max(...nonDiving.map(e => actualX(e)));
        if (dir ===  1 && rightmost + CONFIG.ENEMY_SIZE >= CONFIG.CANVAS_WIDTH - CONFIG.ENEMY_EDGE_PADDING) dir = -1;
        if (dir === -1 && leftmost  - CONFIG.ENEMY_SIZE <= CONFIG.ENEMY_EDGE_PADDING)                       dir =  1;
      }

      // Count down decoy flash timers
      for (const e of base) {
        if (e.flashTimer > 0) e.flashTimer -= dt;
      }

      // Dive launch
      diveTimer -= dt;
      if (diveTimer <= 0) launchDive(playerX);

      // Update active divers
      for (let i = divers.length - 1; i >= 0; i--) {
        if (updateDiver(divers[i], dt)) divers.splice(i, 1);
      }
    },

    render(ctx, playerX = undefined, playerY = undefined) {
      ctx.save();

      // Formation enemies
      ctx.lineWidth  = 2;
      ctx.shadowBlur = CONFIG.ENEMY_GLOW;

      for (const e of base) {
        if (!e.alive || e.diving) continue;
        const col    = e.color ?? COL_ENEMY;
        const drawFn = e.draw  ?? drawEnemy;
        ctx.strokeStyle = col;
        ctx.shadowColor = col;
        drawFn(ctx, actualX(e), actualY(e), CONFIG.ENEMY_SIZE);
        ctx.stroke();
        ctx.globalAlpha = e.isDecoy ? 0.06 : 0.12;
        ctx.fillStyle   = col;
        ctx.fill();
        ctx.globalAlpha = 1;
        // Decoy hit flash
        if (e.flashTimer > 0) {
          ctx.globalAlpha = e.flashTimer / CONFIG.DECOY_FLASH_DURATION;
          ctx.fillStyle   = '#ffffff';
          ctx.shadowBlur  = 0;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.shadowBlur  = CONFIG.ENEMY_GLOW;
        }
      }

      for (const d of divers) {
        // Cloak: invisible beyond 120px, fade in 80–120px
        if (opts.cloakDivers && playerX !== undefined) {
          const dx   = d.x - playerX;
          const dy   = d.y - (playerY ?? (CONFIG.CANVAS_HEIGHT - CONFIG.PLAYER_START_Y_OFFSET));
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 120) continue;
          if (dist > 80) ctx.globalAlpha = (120 - dist) / 40;
        }
        const col    = d.ref.color ?? COL_DIVER;
        const drawFn = d.ref.draw  ?? drawEnemy;
        ctx.strokeStyle = col;
        ctx.shadowColor = col;
        drawFn(ctx, d.x, d.y, CONFIG.ENEMY_SIZE);
        ctx.stroke();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle   = col;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    },
  };
}
