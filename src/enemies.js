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

function bezierPoint(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return {
    x: u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x,
    y: u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y,
  };
}

function layoutGrid(wave) {
  const cols = CONFIG.ENEMY_COLS, rows = CONFIG.ENEMY_ROWS;
  const sx = CONFIG.ENEMY_SPACING_X, sy = CONFIG.ENEMY_SPACING_Y;
  const startX = (CONFIG.CANVAS_WIDTH - (cols - 1) * sx) / 2;
  const pos = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      pos.push({ baseX: startX + c * sx, baseY: CONFIG.ENEMY_TOP_MARGIN + r * sy });
  return pos;
}

function layoutDiamond(wave) {
  const cx = CONFIG.CANVAS_WIDTH / 2;
  const sx = CONFIG.ENEMY_SPACING_X, sy = CONFIG.ENEMY_SPACING_Y;
  const top = CONFIG.ENEMY_TOP_MARGIN;
  const widths = [3, 5, 7, 5, 3];
  const pos = [];
  widths.forEach((w, r) => {
    const half = (w - 1) / 2;
    for (let c = 0; c < w; c++)
      pos.push({ baseX: cx + (c - half) * sx, baseY: top + r * sy });
  });
  return pos; // 23 enemies
}

function layoutArc(wave) {
  const cx = CONFIG.CANVAS_WIDTH / 2;
  const cy = CONFIG.ENEMY_TOP_MARGIN + 70;
  const pos = [];
  // Outer arc: 11 enemies along a wide arch (peaks upward in the middle)
  for (let i = 0; i < 11; i++) {
    const a = Math.PI + Math.PI * i / 10;
    pos.push({ baseX: cx + 260 * Math.cos(a), baseY: cy + 60 * Math.sin(a) });
  }
  // Inner arc: 9 enemies, 50px lower, narrower
  const cy2 = cy + 50;
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + Math.PI * i / 8;
    pos.push({ baseX: cx + 180 * Math.cos(a), baseY: cy2 + 50 * Math.sin(a) });
  }
  return pos; // 20 enemies
}

function layoutStagger(wave) {
  const sx = CONFIG.ENEMY_SPACING_X, sy = CONFIG.ENEMY_SPACING_Y;
  const top = CONFIG.ENEMY_TOP_MARGIN;
  const evenStartX = (CONFIG.CANVAS_WIDTH - 6 * sx) / 2;
  const oddStartX  = evenStartX + sx / 2;
  const pos = [];
  for (let r = 0; r < 4; r++) {
    const isOdd  = r % 2 === 1;
    const count  = isOdd ? 6 : 7;
    const startX = isOdd ? oddStartX : evenStartX;
    for (let c = 0; c < count; c++)
      pos.push({ baseX: startX + c * sx, baseY: top + r * sy });
  }
  return pos; // 26 enemies
}

function layoutClusters(wave) {
  const W = CONFIG.CANVAS_WIDTH, top = CONFIG.ENEMY_TOP_MARGIN;
  const step = 44;
  const centers = [
    { cx: W * 0.22, cy: top + 50 },
    { cx: W * 0.50, cy: top + 50 },
    { cx: W * 0.78, cy: top + 50 },
    { cx: W * 0.35, cy: top + 130 },
    { cx: W * 0.65, cy: top + 130 },
  ];
  const offsets = [[0,0],[-1,0],[1,0],[0,-1],[0,1]];
  const pos = [];
  centers.forEach(({ cx, cy }) =>
    offsets.forEach(([dc, dr]) =>
      pos.push({ baseX: cx + dc * step, baseY: cy + dr * step })
    )
  );
  return pos; // 25 enemies
}

function layoutSpiral(wave) {
  const cx = CONFIG.CANVAS_WIDTH / 2;
  const cy = CONFIG.ENEMY_TOP_MARGIN + 120;
  const n  = 20;
  const pos = [];
  for (let i = 0; i < n; i++) {
    const t     = i / n;
    const angle = t * Math.PI * 3.5;
    const r     = 15 + t * 95;
    pos.push({ baseX: cx + r * Math.cos(angle), baseY: cy + r * Math.sin(angle) });
  }
  return pos;
}

const LAYOUTS = [layoutGrid, layoutDiamond, layoutArc, layoutStagger, layoutClusters, layoutSpiral];

function pickLayout(wave) {
  return LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)](wave);
}
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

  // Normal waves use random layouts; special waves (seal/boss) keep the grid via opts.
  const positions = randomize
    ? pickLayout(wave)
    : (() => {
        const fw = (COLS - 1) * SPACING_X;
        const sx = (CONFIG.CANVAS_WIDTH - fw) / 2;
        const pos = [];
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < COLS; c++)
            pos.push({ baseX: sx + c * SPACING_X, baseY: TOP_MARGIN + r * SPACING_Y });
        return pos;
      })();

  const base = positions.map(({ baseX, baseY }) => ({
    baseX, baseY,
    alive:      true,
    diving:     false,
    isDecoy:    Math.random() < DECOY_CHANCE,
    flashTimer: 0,
    draw:       randomize ? NORMAL_SHAPES[Math.floor(Math.random() * NORMAL_SHAPES.length)] : null,
    color:      randomize ? palette[Math.floor(Math.random() * palette.length)] : null,
    state:      'active',
    ex:         baseX,
    ey:         baseY,
  }));

  // Conga entry animation — normal waves only
  const doEntry = randomize;
  let cp0, cp1, cp2, cp3;
  if (doEntry) {
    const W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT;
    const fromLeft = wave % 2 === 0;
    if (fromLeft) {
      cp0 = { x: -20,      y: H * 0.38 };
      cp1 = { x: W * 0.25, y: H * 0.05 };
      cp2 = { x: W * 0.75, y: H * 0.05 };
      cp3 = { x: W + 20,   y: H * 0.38 };
    } else {
      cp0 = { x: W + 20,   y: H * 0.38 };
      cp1 = { x: W * 0.75, y: H * 0.05 };
      cp2 = { x: W * 0.25, y: H * 0.05 };
      cp3 = { x: -20,      y: H * 0.38 };
    }

    // Pre-sample the path to compute each enemy's peel-off t value
    const SAMPLES = 60;
    const pathSamples = Array.from({ length: SAMPLES }, (_, i) =>
      bezierPoint(i / (SAMPLES - 1), cp0, cp1, cp2, cp3)
    );

    base.forEach((e, i) => {
      e.state      = 'entering';
      e.entryDelay = i * CONFIG.ENTRY_STAGGER;
      e.entryT     = 0;
      e.ex         = cp0.x;
      e.ey         = cp0.y;

      // Find the path sample closest to this enemy's formation slot
      let bestT = 0, bestDist = Infinity;
      pathSamples.forEach((pt, si) => {
        const dx = pt.x - e.baseX, dy = pt.y - e.baseY;
        const d  = dx * dx + dy * dy;
        if (d < bestDist) { bestDist = d; bestT = si / (SAMPLES - 1); }
      });
      e.peelT = bestT;
    });
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

  function allActive() {
    if (!doEntry) return true;
    return base.every(e => !e.alive || e.state === 'active');
  }

  function updateEntry(dt) {
    for (const e of base) {
      if (!e.alive) continue;
      if (e.state === 'entering') {
        if (e.entryDelay > 0) {
          e.entryDelay -= dt;
        } else {
          e.entryT    = Math.min(1, e.entryT + dt / CONFIG.ENTRY_TRAVEL_TIME);
          const pt    = bezierPoint(e.entryT, cp0, cp1, cp2, cp3);
          e.ex        = pt.x;
          e.ey        = pt.y;
          if (e.entryT >= e.peelT) e.state = 'locking';
        }
      } else if (e.state === 'locking') {
        const dx   = e.baseX - e.ex;
        const dy   = e.baseY - e.ey;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 4) {
          e.ex    = e.baseX;
          e.ey    = e.baseY;
          e.state = 'active';
        } else {
          const step = Math.min(CONFIG.ENTRY_LOCK_SPEED * dt, dist);
          e.ex += (dx / dist) * step;
          e.ey += (dy / dist) * step;
        }
      }
    }
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
        .map(e => ({
          x:  e.state === 'active' ? actualX(e) : e.ex,
          y:  e.state === 'active' ? actualY(e) : e.ey,
          hw: CONFIG.ENEMY_HITBOX,
          hh: CONFIG.ENEMY_HITBOX,
          ref: e,
        }));

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

      const active = allActive();

      // Advance entry animation while enemies are still settling in
      if (!active) updateEntry(dt);

      // Sway — only once all enemies have locked into formation
      if (active) {
        groupOffsetX += swaySpeed * dir * dt;
        const nonDiving = live.filter(e => !e.diving);
        if (nonDiving.length > 0) {
          const leftmost  = Math.min(...nonDiving.map(e => actualX(e)));
          const rightmost = Math.max(...nonDiving.map(e => actualX(e)));
          if (dir ===  1 && rightmost + CONFIG.ENEMY_SIZE >= CONFIG.CANVAS_WIDTH - CONFIG.ENEMY_EDGE_PADDING) dir = -1;
          if (dir === -1 && leftmost  - CONFIG.ENEMY_SIZE <= CONFIG.ENEMY_EDGE_PADDING)                       dir =  1;
        }
      }

      // Count down decoy flash timers — always
      for (const e of base) {
        if (e.flashTimer > 0) e.flashTimer -= dt;
      }

      // Dive launch — only once all enemies have locked into formation
      if (active) {
        diveTimer -= dt;
        if (diveTimer <= 0) launchDive(playerX);
      }

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
        const px = e.state === 'active' ? actualX(e) : e.ex;
        const py = e.state === 'active' ? actualY(e) : e.ey;
        drawFn(ctx, px, py, CONFIG.ENEMY_SIZE);
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
