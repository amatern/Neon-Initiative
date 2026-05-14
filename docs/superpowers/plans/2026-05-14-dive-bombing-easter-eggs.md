# Dive-Bombing + JONAS/CHAD Easter Eggs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add enemy dive-bombing with loop-back, JONAS title-screen code (gold ship for the session), and CHAD title-screen code (D&D dice rolls — NAT 1 fizzles, NAT 20 crits for 2000 pts).

**Architecture:** Dive logic is self-contained in `enemies.js` — a `divers[]` array and three-state machine (DIVING → LOOPING → RETURNING). Easter egg state lives in `easter-eggs.js` with its own `keydown` listener; `game.js` reads it via exported getters. `game.js` gains one diver–player collision check and the CHAD roll branch; `hud.js` gains a D20 icon.

**Tech Stack:** Vanilla JS (ES modules), HTML5 Canvas 2D — no new dependencies.

> **Testing note:** Canvas game — browser verification only. Open `http://localhost:8080` (run `python -m http.server 8080` from the project root).

---

## File Map

| File | Change |
|------|--------|
| `src/config.js` | Add dive constants, `COLOR_DIVER`, `COLOR_JONAS`, `DIVE_MAX_VX` |
| `src/easter-eggs.js` | Full implementation: key buffer, `jonasActive`, `chadActive`, `rollForHit()` |
| `src/enemies.js` | Add diver state machine, `getDiverRects()`, `update(dt, playerX)` signature |
| `src/game.js` | Diver collision, CHAD rolls, notifications, JONAS color, hook moved to title block |
| `src/hud.js` | `chadActive` param, `drawD20Icon()` |

---

## Task 1: Config Constants

**Files:**
- Modify: `src/config.js`

- [ ] **Step 1: Replace `src/config.js` with the following**

```javascript
export const CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,

  // Colors
  COLOR_BG: '#000000',
  COLOR_PLAYER: '#00f0ff',
  COLOR_ENEMY: '#ff007a',
  COLOR_DIVER: '#ff4444',
  COLOR_BULLET: '#ffffff',
  COLOR_HUD: '#00f0ff',
  COLOR_BANNER: '#ffd700',
  COLOR_JONAS: '#ffd700',
  COLOR_STAR_DIM: 'rgba(255,255,255,0.25)',
  COLOR_STAR_MID: 'rgba(255,255,255,0.6)',
  COLOR_STAR_BRIGHT: 'rgba(255,255,255,1.0)',

  // Player
  PLAYER_SPEED: 320,
  PLAYER_WIDTH: 32,
  PLAYER_HEIGHT: 36,
  PLAYER_HITBOX_SCALE: 0.7,
  PLAYER_GLOW: 14,
  PLAYER_START_Y_OFFSET: 60,

  // Bullet
  BULLET_SPEED: 520,
  BULLET_WIDTH: 3,
  BULLET_HEIGHT: 14,
  BULLET_GLOW: 8,

  // Enemies
  ENEMY_COLS: 8,
  ENEMY_ROWS: 4,
  ENEMY_SPACING_X: 72,
  ENEMY_SPACING_Y: 56,
  ENEMY_TOP_MARGIN: 80,
  ENEMY_SIZE: 20,
  ENEMY_HITBOX: 18,
  ENEMY_GLOW: 10,
  ENEMY_SWAY_BASE: 55,
  ENEMY_SWAY_INCREMENT: 7,
  ENEMY_EDGE_PADDING: 40,

  // Dive-bombing
  DIVE_INTERVAL: 3.5,
  DIVE_INTERVAL_VARIANCE: 1.0,
  DIVE_MAX_SIMULTANEOUS: 2,
  DIVE_ACCEL: 180,
  DIVE_MAX_SPEED: 380,
  DIVE_MAX_VX: 200,
  DIVE_STEER: 1.5,
  DIVE_WOBBLE_AMP: 18,
  DIVE_WOBBLE_SPEED: 5.0,
  LOOP_ACCEL: 600,
  RETURN_SPEED: 260,
  RETURN_SNAP_DIST: 20,

  // Score / lives
  SCORE_PER_ENEMY: 100,
  SCORE_NAT20_BONUS: 2000,
  STARTING_LIVES: 3,

  // Wave banner
  WAVE_BANNER_DURATION: 2200,

  // Particles
  PARTICLE_COUNT: 14,
  PARTICLE_SPEED_MIN: 60,
  PARTICLE_SPEED_MAX: 210,
  PARTICLE_LIFETIME_MIN: 0.4,
  PARTICLE_LIFETIME_MAX: 0.9,
  PARTICLE_SIZE: 3,

  // Starfield
  STAR_COUNT_DIM: 70,
  STAR_COUNT_MID: 50,
  STAR_COUNT_BRIGHT: 30,
  STAR_SPEED_DIM: 20,
  STAR_SPEED_MID: 55,
  STAR_SPEED_BRIGHT: 110,

  // Loop
  FIXED_STEP: 1 / 60,
  MAX_STEPS: 5,
};
```

- [ ] **Step 2: Verify**

Open browser, start a game. Expected: no console errors, game plays normally.

---

## Task 2: Easter Eggs

**Files:**
- Modify: `src/easter-eggs.js` (complete rewrite)

- [ ] **Step 1: Replace `src/easter-eggs.js` with the following**

```javascript
let jonasActive = false;
let chadActive  = false;
let keyBuffer   = '';

// Listener always accumulates keypresses; activation only happens in checkTitleScreenCode(),
// which game.js calls exclusively from the title-state block.
window.addEventListener('keydown', e => {
  if (e.key.length === 1) {
    keyBuffer = (keyBuffer + e.key.toUpperCase()).slice(-10);
  }
});

export const easterEggs = {
  get jonasActive() { return jonasActive; },
  get chadActive()  { return chadActive;  },

  checkTitleScreenCode() {
    if (keyBuffer.includes('JONAS')) { jonasActive = true; keyBuffer = ''; }
    if (keyBuffer.includes('CHAD'))  { chadActive  = true; keyBuffer = ''; }
  },

  // Returns {roll: 1–20}. Called by game.js on every bullet hit when chadActive.
  rollForHit() {
    return { roll: Math.floor(Math.random() * 20) + 1 };
  },

  onWaveStart(_wave) {},
  onPlayerShoot()    { return null; },
};
```

- [ ] **Step 2: Verify**

Open browser, navigate to title screen. Open DevTools console and run:

```javascript
// Simulate typing JONAS
['J','O','N','A','S'].forEach(k => window.dispatchEvent(new KeyboardEvent('keydown', {key: k})));
```

Expected: no errors. Then import and check via:
```javascript
// In console (ES module context won't allow direct import, but check by starting game)
// After simulating, press Space to start — ship color should be gold.
```

Manual test: Go to title, type `JONAS` slowly on keyboard. Press Space. Ship should be gold (`#ffd700`).

Manual test: Go to title, type `CHAD` slowly. Press Space. HUD should show D20 icon (once Task 5 is done). Shoot an enemy — occasionally "NAT 1" or "NAT 20!" should appear (once Task 4 is done).

---

## Task 3: Enemy Dive-Bombing

**Files:**
- Modify: `src/enemies.js` (complete rewrite)

- [ ] **Step 1: Replace `src/enemies.js` with the following**

```javascript
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

  const divers   = [];
  let diveTimer  = CONFIG.DIVE_INTERVAL + (Math.random() * 2 - 1) * CONFIG.DIVE_INTERVAL_VARIANCE;

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

    diveTimer = nextDiveTimer();
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

        if (d.y > CONFIG.CANVAS_HEIGHT * 0.78) d.state = 'LOOPING';
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

    // playerX: player's current x, used to aim new dives.
    update(dt, playerX) {
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
```

- [ ] **Step 2: Verify**

Open browser, start a game. Expected:
- Enemies sway as before
- After ~3 seconds, one enemy peels off, turns red-orange, dives toward the player's position
- It swoops down with a sine wobble, curves back up off the bottom, disappears off top, re-appears from above and flies back into its slot, turning magenta again
- The diver is shootable mid-dive
- Max 2 divers active at once
- Console: no errors

---

## Task 4: Game State Machine Updates

**Files:**
- Modify: `src/game.js` (complete rewrite)

- [ ] **Step 1: Replace `src/game.js` with the following**

```javascript
import { CONFIG }               from './config.js';
import { createPlayer }         from './player.js';
import { createFormation }      from './enemies.js';
import { createBulletPool }     from './bullets.js';
import { createParticleSystem } from './particles.js';
import { createStarfield }      from './starfield.js';
import { renderHUD }            from './hud.js';
import { easterEggs }           from './easter-eggs.js';

const STATE = { TITLE: 'title', PLAYING: 'playing', GAME_OVER: 'game_over' };

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');

  const starfield     = createStarfield();
  const particles     = createParticleSystem();
  const player        = createPlayer();
  const bullets       = createBulletPool();
  const notifications = [];

  let state     = STATE.TITLE;
  let score     = 0;
  let lives     = CONFIG.STARTING_LIVES;
  let wave      = 1;
  let formation = null;
  let banner    = null;

  function makeBanner(text) {
    const duration = CONFIG.WAVE_BANNER_DURATION / 1000;
    return { text, timer: duration, duration };
  }

  function addNotification(text, x, y, color) {
    notifications.push({ text, x, y, vy: -60, color, timer: 1.5, maxTimer: 1.5 });
  }

  function startGame() {
    state     = STATE.PLAYING;
    score     = 0;
    lives     = CONFIG.STARTING_LIVES;
    wave      = 1;
    formation = createFormation(wave);
    bullets.clear();
    notifications.length = 0;
    banner = makeBanner('Roll for initiative!');
    easterEggs.onWaveStart(wave);
    if (easterEggs.jonasActive) player.setColor(CONFIG.COLOR_JONAS);
  }

  function spawnNextWave() {
    wave++;
    formation = createFormation(wave);
    bullets.clear();
    banner = makeBanner('Roll for initiative!');
    easterEggs.onWaveStart(wave);
  }

  function renderTitle() {
    ctx.save();
    ctx.textAlign = 'center';

    ctx.font        = 'bold 66px monospace';
    ctx.fillStyle   = '#00f0ff';
    ctx.shadowBlur  = 30;
    ctx.shadowColor = '#00f0ff';
    ctx.fillText('NEON', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 55);

    ctx.font        = 'bold 66px monospace';
    ctx.fillStyle   = '#ffd700';
    ctx.shadowBlur  = 30;
    ctx.shadowColor = '#ffd700';
    ctx.fillText('INITIATIVE', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 20);

    const pulse     = 0.65 + 0.35 * Math.sin(Date.now() / 420);
    ctx.globalAlpha = pulse;
    ctx.font        = '21px monospace';
    ctx.fillStyle   = '#ffffff';
    ctx.shadowBlur  = 0;
    ctx.fillText('PRESS SPACE TO START', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 90);

    ctx.globalAlpha = 1;
    ctx.font        = '15px monospace';
    ctx.fillStyle   = 'rgba(255,255,255,0.45)';
    ctx.fillText('← → to move   ■ SPACE to fire', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 130);

    ctx.restore();
  }

  function renderGameOver() {
    ctx.save();
    ctx.textAlign = 'center';

    ctx.font        = 'bold 54px monospace';
    ctx.fillStyle   = '#ff007a';
    ctx.shadowBlur  = 22;
    ctx.shadowColor = '#ff007a';
    ctx.fillText('GAME OVER', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 20);

    ctx.font        = '26px monospace';
    ctx.fillStyle   = '#00f0ff';
    ctx.shadowBlur  = 10;
    ctx.shadowColor = '#00f0ff';
    ctx.fillText(`FINAL SCORE: ${score}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 40);

    const pulse     = 0.65 + 0.35 * Math.sin(Date.now() / 420);
    ctx.globalAlpha = pulse;
    ctx.font        = '19px monospace';
    ctx.fillStyle   = '#ffffff';
    ctx.shadowBlur  = 0;
    ctx.fillText('PRESS R TO RETURN TO TITLE', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 92);

    ctx.restore();
  }

  return {
    update(dt, input) {
      starfield.update(dt);
      particles.update(dt);

      if (banner) {
        banner.timer -= dt;
        if (banner.timer <= 0) banner = null;
      }

      // Notifications float upward and fade
      for (let i = notifications.length - 1; i >= 0; i--) {
        const n = notifications[i];
        n.y     += n.vy * dt;
        n.timer -= dt;
        if (n.timer <= 0) notifications.splice(i, 1);
      }

      if (state === STATE.TITLE) {
        easterEggs.checkTitleScreenCode(); // only active on title screen
        if (input.wasPressed('Space')) startGame();
        return;
      }

      if (state === STATE.GAME_OVER) {
        if (input.wasPressed('KeyR')) state = STATE.TITLE;
        return;
      }

      // ── STATE.PLAYING ──────────────────────────────────────────────────
      player.update(dt, input);

      if (input.wasPressed('Space')) {
        bullets.fire(player.x, player.y - player.height / 2);
      }

      formation.update(dt, player.x);
      bullets.update(dt);

      // Collision: bullets vs. enemies (formation + divers)
      const hits = bullets.checkCollisions(formation.getEnemyRects());
      for (const { enemy } of hits) {
        if (easterEggs.chadActive) {
          const { roll } = easterEggs.rollForHit();
          if (roll === 1) {
            // Nat 1: shot fizzles — bullet consumed but enemy survives
            addNotification('NAT 1', enemy.x, enemy.y, '#888888');
          } else {
            formation.kill(enemy.ref);
            particles.burst(enemy.x, enemy.y, CONFIG.COLOR_ENEMY);
            if (roll === 20) {
              score += CONFIG.SCORE_NAT20_BONUS;
              particles.burst(enemy.x, enemy.y, CONFIG.COLOR_BANNER); // second burst
              addNotification('NAT 20!', enemy.x, enemy.y, CONFIG.COLOR_BANNER);
            } else {
              score += CONFIG.SCORE_PER_ENEMY;
            }
          }
        } else {
          formation.kill(enemy.ref);
          particles.burst(enemy.x, enemy.y, CONFIG.COLOR_ENEMY);
          score += CONFIG.SCORE_PER_ENEMY;
        }
      }

      // Wave cleared
      if (formation.allDead()) {
        spawnNextWave();
        return;
      }

      // Diver → player collision
      const phb = player.getHitbox();
      for (const d of formation.getDiverRects()) {
        if (rectsOverlap(d.x - d.hw, d.y - d.hh, d.hw * 2, d.hh * 2, phb.x, phb.y, phb.w, phb.h)) {
          formation.kill(d.ref);
          particles.burst(d.x, d.y, CONFIG.COLOR_DIVER);
          lives--;
          if (lives <= 0) state = STATE.GAME_OVER;
          break; // one hit per frame
        }
      }
    },

    render() {
      ctx.fillStyle = CONFIG.COLOR_BG;
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

      starfield.render(ctx);

      if (state === STATE.TITLE) {
        particles.render(ctx);
        renderTitle();
        return;
      }

      formation.render(ctx);
      player.render(ctx);
      bullets.render(ctx);
      particles.render(ctx);

      // Floating NAT roll notifications
      if (notifications.length > 0) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font      = 'bold 20px monospace';
        for (const n of notifications) {
          ctx.globalAlpha = n.timer / n.maxTimer;
          ctx.fillStyle   = n.color;
          ctx.shadowBlur  = 10;
          ctx.shadowColor = n.color;
          ctx.fillText(n.text, n.x, n.y);
        }
        ctx.restore();
      }

      renderHUD(ctx, { score, lives, wave, banner, chadActive: easterEggs.chadActive });

      if (state === STATE.GAME_OVER) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        renderGameOver();
      }
    },
  };
}
```

- [ ] **Step 2: Verify**

Open browser, start a game.
- Enemy dives now cause life loss on contact. ✓
- Typing CHAD before starting: shoot an enemy — should occasionally show "NAT 1" (enemy survives) or "NAT 20!" (gold flash, 2000 pts). ✓
- Typing JONAS before starting: ship should be gold. ✓
- Console: no errors. ✓

---

## Task 5: HUD D20 Icon

**Files:**
- Modify: `src/hud.js` (complete rewrite)

- [ ] **Step 1: Replace `src/hud.js` with the following**

```javascript
import { CONFIG } from './config.js';

function drawD20Icon(ctx, x, y) {
  const s = 12; // half-size of triangle
  ctx.save();
  ctx.strokeStyle = CONFIG.COLOR_JONAS;
  ctx.lineWidth   = 1.5;
  ctx.shadowBlur  = 8;
  ctx.shadowColor = CONFIG.COLOR_JONAS;
  ctx.beginPath();
  ctx.moveTo(x,     y - s);
  ctx.lineTo(x + s, y + s * 0.6);
  ctx.lineTo(x - s, y + s * 0.6);
  ctx.closePath();
  ctx.stroke();
  ctx.font         = 'bold 8px monospace';
  ctx.fillStyle    = CONFIG.COLOR_JONAS;
  ctx.shadowBlur   = 0;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('20', x, y + 1);
  ctx.restore();
}

// banner: null | { text, timer, duration }  (timer in seconds, counts down)
export function renderHUD(ctx, { score, lives, wave, banner, chadActive }) {
  ctx.save();

  ctx.font        = 'bold 18px monospace';
  ctx.fillStyle   = CONFIG.COLOR_HUD;
  ctx.shadowBlur  = 8;
  ctx.shadowColor = CONFIG.COLOR_HUD;

  // Score — top left
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${score}`, 20, 28);

  // D20 icon — shown when CHAD mode is active, right of score text
  if (chadActive) {
    const tw = ctx.measureText(`SCORE: ${score}`).width;
    drawD20Icon(ctx, 20 + tw + 20, 20);
  }

  // Wave — top center
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE ${wave}`, CONFIG.CANVAS_WIDTH / 2, 28);

  // Lives — top right as small triangle icons
  const ts          = 11;
  const lifeSpacing = 28;
  const lifeY       = 18;
  const lifeStartX  = CONFIG.CANVAS_WIDTH - 20 - (lives - 1) * lifeSpacing;

  ctx.strokeStyle = CONFIG.COLOR_HUD;
  ctx.lineWidth   = 1.5;
  for (let i = 0; i < lives; i++) {
    const lx = lifeStartX + i * lifeSpacing;
    ctx.beginPath();
    ctx.moveTo(lx,      lifeY - ts);
    ctx.lineTo(lx + ts, lifeY + ts);
    ctx.lineTo(lx - ts, lifeY + ts);
    ctx.closePath();
    ctx.stroke();
  }

  // Wave banner — stays full alpha then fades in last 30%
  if (banner && banner.timer > 0) {
    const fadeThreshold = banner.duration * 0.3;
    const alpha         = banner.timer < fadeThreshold ? banner.timer / fadeThreshold : 1;
    ctx.globalAlpha = alpha;
    ctx.font        = 'bold 40px monospace';
    ctx.fillStyle   = CONFIG.COLOR_BANNER;
    ctx.shadowBlur  = 22;
    ctx.shadowColor = CONFIG.COLOR_BANNER;
    ctx.textAlign   = 'center';
    ctx.fillText(banner.text, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 3);
  }

  ctx.restore();
}
```

- [ ] **Step 2: Verify**

Open browser. Start game after typing CHAD on title screen.
Expected: a small gold triangle with "20" inside appears in the top-left HUD, right after the score text.

---

## Task 6: Integration Test + Commit

- [ ] **Step 1: Full integration test**

Open browser (`http://localhost:8080`). Work through this checklist:

| Test | Expected |
|------|----------|
| Normal play — diver peels off | Red-orange hexagon detaches, dives with wobble |
| Diver reaches bottom zone | Curves back up, disappears off top |
| Diver returns from top | Flies back toward its slot, snaps in, turns magenta |
| Shoot a diver mid-flight | Dies, magenta-red particle burst, +100 score |
| Let diver touch player | Life icon disappears, particle burst at contact point |
| Reach 0 lives | GAME OVER screen |
| Type JONAS on title, start | Ship is gold, persists through deaths and restarts |
| Type CHAD on title, start | D20 icon appears in HUD |
| CHAD: shoot enemies | Mix of normal kills, "NAT 1" (enemy survives), "NAT 20!" (2000 pts + double burst) |
| CHAD + JONAS together | Both effects active simultaneously |
| Wave 2+ | Sway speed increases, dive timer same |
| No console errors | ✓ |

- [ ] **Step 2: Commit**

```bash
git add src/config.js src/easter-eggs.js src/enemies.js src/game.js src/hud.js docs/superpowers/plans/2026-05-14-dive-bombing-easter-eggs.md
git commit -m "feat: dive-bombing (loop-back), JONAS gold ship, CHAD D&D dice rolls"
```
