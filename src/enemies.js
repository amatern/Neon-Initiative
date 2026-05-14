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

export function createFormation(wave) {
  const formationWidth = (CONFIG.ENEMY_COLS - 1) * CONFIG.ENEMY_SPACING_X;
  const startX         = (CONFIG.CANVAS_WIDTH - formationWidth) / 2;

  const base = [];
  for (let row = 0; row < CONFIG.ENEMY_ROWS; row++) {
    for (let col = 0; col < CONFIG.ENEMY_COLS; col++) {
      base.push({
        baseX:  startX + col * CONFIG.ENEMY_SPACING_X,
        baseY:  CONFIG.ENEMY_TOP_MARGIN + row * CONFIG.ENEMY_SPACING_Y,
        alive:  true,
        diving: false,
      });
    }
  }

  let groupOffsetX = 0;
  let dir          = 1;
  const swaySpeed  = CONFIG.ENEMY_SWAY_BASE + (wave - 1) * CONFIG.ENEMY_SWAY_INCREMENT;

  const actualX = e => e.baseX + groupOffsetX;
  const actualY = e => e.baseY;

  const divers  = [];
  let diveTimer        = CONFIG.DIVE_INTERVAL + (Math.random() * 2 - 1) * CONFIG.DIVE_INTERVAL_VARIANCE;
  let newDiveLaunched  = false;

  function nextDiveTimer() {
    return CONFIG.DIVE_INTERVAL + (Math.random() * 2 - 1) * CONFIG.DIVE_INTERVAL_VARIANCE;
  }

  function launchDive(playerX) {
    const candidates = base.filter(e => e.alive && !e.diving);
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
        d.vy      = Math.min(d.vy, CONFIG.DIVE_MAX_SPEED);
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
      ref.alive  = false;
      ref.diving = false;
      const idx = divers.findIndex(d => d.ref === ref);
      if (idx !== -1) divers.splice(idx, 1);
    },

    allDead() { return base.every(e => !e.alive); },

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

      // Dive launch
      diveTimer -= dt;
      if (diveTimer <= 0) launchDive(playerX);

      // Update active divers
      for (let i = divers.length - 1; i >= 0; i--) {
        if (updateDiver(divers[i], dt)) divers.splice(i, 1);
      }
    },

    render(ctx) {
      ctx.save();

      // Formation enemies
      ctx.strokeStyle = CONFIG.COLOR_ENEMY;
      ctx.lineWidth   = 2;
      ctx.shadowBlur  = CONFIG.ENEMY_GLOW;
      ctx.shadowColor = CONFIG.COLOR_ENEMY;

      for (const e of base) {
        if (!e.alive || e.diving) continue;
        drawHexagon(ctx, actualX(e), actualY(e), CONFIG.ENEMY_SIZE);
        ctx.stroke();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle   = CONFIG.COLOR_ENEMY;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Divers — distinct color to signal "this one is coming for you"
      ctx.strokeStyle = CONFIG.COLOR_DIVER;
      ctx.shadowColor = CONFIG.COLOR_DIVER;

      for (const d of divers) {
        drawHexagon(ctx, d.x, d.y, CONFIG.ENEMY_SIZE);
        ctx.stroke();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle   = CONFIG.COLOR_DIVER;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    },
  };
}
