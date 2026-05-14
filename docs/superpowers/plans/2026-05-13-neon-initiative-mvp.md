# Neon Initiative MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable Neon Initiative MVP — vector shooter with player ship, 8×4 enemy formation with group sway, bullet/collision system, score/lives, starfield, particle explosions, and "Roll for initiative!" wave-start banner.

**Architecture:** Vanilla Canvas 2D with ES modules. `game.js` owns all state and orchestrates subsystems. `main.js` runs a fixed-timestep accumulator loop. No shared mutable globals. No build step.

**Tech Stack:** Vanilla JavaScript (ES modules), HTML5 Canvas 2D API. Open `index.html` directly in a browser — no server required.

> **Note on testing:** This is a canvas game with no test framework. Each task's verification step is a browser check. Open `index.html` in Chrome/Firefox (local file ES modules work in both). If you see a CORS error for modules, run `python -m http.server 8080` from the project root and open `http://localhost:8080`.

---

## File Map

| File | Creates | Modifies |
|------|---------|---------|
| `index.html` | ✓ | |
| `style.css` | ✓ | |
| `src/config.js` | ✓ | |
| `src/input.js` | ✓ | |
| `src/starfield.js` | ✓ | |
| `src/particles.js` | ✓ | |
| `src/player.js` | ✓ | |
| `src/enemies.js` | ✓ | |
| `src/bullets.js` | ✓ | |
| `src/hud.js` | ✓ | |
| `src/audio.js` | ✓ | |
| `src/easter-eggs.js` | ✓ | |
| `src/game.js` | ✓ | |
| `src/main.js` | ✓ | |

---

## Task 1: HTML Scaffold + CSS

**Files:**
- Create: `index.html`
- Create: `style.css`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neon Initiative</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <canvas id="canvas"></canvas>
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `style.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  overflow: hidden;
}

#canvas {
  display: block;
  border: 1px solid rgba(0, 240, 255, 0.15);
  box-shadow: 0 0 40px rgba(0, 240, 255, 0.08);
}
```

- [ ] **Step 3: Verify**

Open `index.html` in a browser (or `http://localhost:8080` via `python -m http.server 8080`).
Expected: black page, no console errors. The canvas element won't be visible yet (no JS sets its size).

---

## Task 2: Constants + Keyboard Input

**Files:**
- Create: `src/config.js`
- Create: `src/input.js`

- [ ] **Step 1: Create `src/config.js`**

```javascript
export const CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,

  // Colors
  COLOR_BG: '#000000',
  COLOR_PLAYER: '#00f0ff',
  COLOR_ENEMY: '#ff007a',
  COLOR_BULLET: '#ffffff',
  COLOR_HUD: '#00f0ff',
  COLOR_BANNER: '#ffd700',
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
  ENEMY_DEATH_LINE: 510,

  // Score / lives
  SCORE_PER_ENEMY: 100,
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

- [ ] **Step 2: Create `src/input.js`**

```javascript
export function createInput() {
  const held = new Set();
  const pressed = new Set();

  window.addEventListener('keydown', e => {
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
      e.preventDefault();
    }
    if (!held.has(e.code)) pressed.add(e.code);
    held.add(e.code);
  });

  window.addEventListener('keyup', e => {
    held.delete(e.code);
  });

  return {
    isDown(key) { return held.has(key); },
    wasPressed(key) { return pressed.has(key); },
    update() { pressed.clear(); },
  };
}
```

---

## Task 3: Starfield Background

**Files:**
- Create: `src/starfield.js`

- [ ] **Step 1: Create `src/starfield.js`**

```javascript
import { CONFIG } from './config.js';

export function createStarfield() {
  const tiers = [
    { color: CONFIG.COLOR_STAR_DIM,    speed: CONFIG.STAR_SPEED_DIM,    count: CONFIG.STAR_COUNT_DIM,    size: 1 },
    { color: CONFIG.COLOR_STAR_MID,    speed: CONFIG.STAR_SPEED_MID,    count: CONFIG.STAR_COUNT_MID,    size: 1 },
    { color: CONFIG.COLOR_STAR_BRIGHT, speed: CONFIG.STAR_SPEED_BRIGHT, count: CONFIG.STAR_COUNT_BRIGHT, size: 2 },
  ];

  const stars = [];
  for (const t of tiers) {
    for (let i = 0; i < t.count; i++) {
      stars.push({
        x: Math.random() * CONFIG.CANVAS_WIDTH,
        y: Math.random() * CONFIG.CANVAS_HEIGHT,
        speed: t.speed,
        color: t.color,
        size: t.size,
      });
    }
  }

  return {
    update(dt) {
      for (const s of stars) {
        s.y += s.speed * dt;
        if (s.y > CONFIG.CANVAS_HEIGHT) {
          s.y = 0;
          s.x = Math.random() * CONFIG.CANVAS_WIDTH;
        }
      }
    },

    render(ctx) {
      for (const s of stars) {
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
    },
  };
}
```

---

## Task 4: Particle Explosions

**Files:**
- Create: `src/particles.js`

- [ ] **Step 1: Create `src/particles.js`**

```javascript
import { CONFIG } from './config.js';

export function createParticleSystem() {
  const particles = [];

  return {
    burst(x, y, color) {
      for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
        const angle = (Math.PI * 2 * i) / CONFIG.PARTICLE_COUNT + (Math.random() - 0.5) * 0.8;
        const speed = CONFIG.PARTICLE_SPEED_MIN + Math.random() * (CONFIG.PARTICLE_SPEED_MAX - CONFIG.PARTICLE_SPEED_MIN);
        const lifetime = CONFIG.PARTICLE_LIFETIME_MIN + Math.random() * (CONFIG.PARTICLE_LIFETIME_MAX - CONFIG.PARTICLE_LIFETIME_MIN);
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          lifetime,
          maxLifetime: lifetime,
          color,
        });
      }
    },

    update(dt) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.lifetime -= dt;
        if (p.lifetime <= 0) particles.splice(i, 1);
      }
    },

    render(ctx) {
      ctx.save();
      for (const p of particles) {
        const alpha = p.lifetime / p.maxLifetime;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.fillRect(
          p.x - CONFIG.PARTICLE_SIZE / 2,
          p.y - CONFIG.PARTICLE_SIZE / 2,
          CONFIG.PARTICLE_SIZE,
          CONFIG.PARTICLE_SIZE
        );
      }
      ctx.restore();
    },
  };
}
```

---

## Task 5: Player Ship

**Files:**
- Create: `src/player.js`

- [ ] **Step 1: Create `src/player.js`**

```javascript
import { CONFIG } from './config.js';

export function createPlayer() {
  const s = {
    x: CONFIG.CANVAS_WIDTH / 2,
    y: CONFIG.CANVAS_HEIGHT - CONFIG.PLAYER_START_Y_OFFSET,
    width: CONFIG.PLAYER_WIDTH,
    height: CONFIG.PLAYER_HEIGHT,
    color: CONFIG.COLOR_PLAYER,
  };

  return {
    get x() { return s.x; },
    get y() { return s.y; },
    get width() { return s.width; },
    get height() { return s.height; },

    update(dt, input) {
      if (input.isDown('ArrowLeft'))  s.x -= CONFIG.PLAYER_SPEED * dt;
      if (input.isDown('ArrowRight')) s.x += CONFIG.PLAYER_SPEED * dt;
      s.x = Math.max(s.width / 2, Math.min(CONFIG.CANVAS_WIDTH - s.width / 2, s.x));
    },

    render(ctx) {
      ctx.save();
      ctx.shadowBlur = CONFIG.PLAYER_GLOW;
      ctx.shadowColor = s.color;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x,               s.y - s.height / 2); // tip
      ctx.lineTo(s.x + s.width / 2, s.y + s.height / 2); // bottom-right
      ctx.lineTo(s.x - s.width / 2, s.y + s.height / 2); // bottom-left
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.restore();
    },

    getHitbox() {
      const hw = (s.width  * CONFIG.PLAYER_HITBOX_SCALE) / 2;
      const hh = (s.height * CONFIG.PLAYER_HITBOX_SCALE) / 2;
      return { x: s.x - hw, y: s.y - hh, w: hw * 2, h: hh * 2 };
    },

    setColor(color) { s.color = color; },
  };
}
```

---

## Task 6: Enemy Formation

**Files:**
- Create: `src/enemies.js`

- [ ] **Step 1: Create `src/enemies.js`**

```javascript
import { CONFIG } from './config.js';

function drawHexagon(ctx, x, y, size) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + size * Math.cos(a);
    const py = y + size * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function createFormation(wave) {
  const formationWidth = (CONFIG.ENEMY_COLS - 1) * CONFIG.ENEMY_SPACING_X;
  const startX = (CONFIG.CANVAS_WIDTH - formationWidth) / 2;

  const base = [];
  for (let row = 0; row < CONFIG.ENEMY_ROWS; row++) {
    for (let col = 0; col < CONFIG.ENEMY_COLS; col++) {
      base.push({
        baseX: startX + col * CONFIG.ENEMY_SPACING_X,
        baseY: CONFIG.ENEMY_TOP_MARGIN + row * CONFIG.ENEMY_SPACING_Y,
        alive: true,
      });
    }
  }

  let groupOffsetX = 0;
  let dir = 1;
  const swaySpeed = CONFIG.ENEMY_SWAY_BASE + (wave - 1) * CONFIG.ENEMY_SWAY_INCREMENT;

  const actualX = e => e.baseX + groupOffsetX;
  const actualY = e => e.baseY;

  return {
    getEnemyRects() {
      return base
        .filter(e => e.alive)
        .map(e => ({
          x: actualX(e),
          y: actualY(e),
          hw: CONFIG.ENEMY_HITBOX,
          hh: CONFIG.ENEMY_HITBOX,
          ref: e,
        }));
    },

    kill(ref) { ref.alive = false; },

    allDead() { return base.every(e => !e.alive); },

    update(dt) {
      const live = base.filter(e => e.alive);
      if (live.length === 0) return;

      groupOffsetX += swaySpeed * dir * dt;

      const leftmost  = Math.min(...live.map(e => actualX(e)));
      const rightmost = Math.max(...live.map(e => actualX(e)));

      if (dir ===  1 && rightmost + CONFIG.ENEMY_SIZE >= CONFIG.CANVAS_WIDTH - CONFIG.ENEMY_EDGE_PADDING) dir = -1;
      if (dir === -1 && leftmost  - CONFIG.ENEMY_SIZE <= CONFIG.ENEMY_EDGE_PADDING)                       dir =  1;
    },

    render(ctx) {
      ctx.save();
      ctx.strokeStyle = CONFIG.COLOR_ENEMY;
      ctx.lineWidth = 2;
      ctx.shadowBlur = CONFIG.ENEMY_GLOW;
      ctx.shadowColor = CONFIG.COLOR_ENEMY;

      for (const e of base) {
        if (!e.alive) continue;
        const x = actualX(e);
        const y = actualY(e);
        drawHexagon(ctx, x, y, CONFIG.ENEMY_SIZE);
        ctx.stroke();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = CONFIG.COLOR_ENEMY;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    },
  };
}
```

---

## Task 7: Bullet Pool

**Files:**
- Create: `src/bullets.js`

- [ ] **Step 1: Create `src/bullets.js`**

```javascript
import { CONFIG } from './config.js';

function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function createBulletPool() {
  const bullets = [];

  return {
    // x,y = tip of player ship (firing point)
    fire(x, y) {
      bullets.push({ x, y });
    },

    update(dt) {
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= CONFIG.BULLET_SPEED * dt;
        if (bullets[i].y < 0) bullets.splice(i, 1);
      }
    },

    render(ctx) {
      ctx.save();
      ctx.strokeStyle = CONFIG.COLOR_BULLET;
      ctx.lineWidth = CONFIG.BULLET_WIDTH;
      ctx.shadowBlur = CONFIG.BULLET_GLOW;
      ctx.shadowColor = CONFIG.COLOR_BULLET;
      ctx.lineCap = 'round';
      for (const b of bullets) {
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x, b.y - CONFIG.BULLET_HEIGHT);
        ctx.stroke();
      }
      ctx.restore();
    },

    // Returns [{enemy}] for each hit; removes the bullet.
    // enemy has shape: {x, y, hw, hh, ref}
    checkCollisions(enemyRects) {
      const hits = [];
      const hitRefs = new Set();

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        const bx = b.x - CONFIG.BULLET_WIDTH / 2;
        const by = b.y - CONFIG.BULLET_HEIGHT;

        for (const e of enemyRects) {
          if (hitRefs.has(e.ref)) continue;
          if (aabb(bx, by, CONFIG.BULLET_WIDTH, CONFIG.BULLET_HEIGHT, e.x - e.hw, e.y - e.hh, e.hw * 2, e.hh * 2)) {
            hits.push({ enemy: e });
            hitRefs.add(e.ref);
            bullets.splice(i, 1);
            break;
          }
        }
      }

      return hits;
    },

    clear() { bullets.length = 0; },
  };
}
```

---

## Task 8: HUD + Empty Stubs

**Files:**
- Create: `src/hud.js`
- Create: `src/audio.js`
- Create: `src/easter-eggs.js`

- [ ] **Step 1: Create `src/hud.js`**

```javascript
import { CONFIG } from './config.js';

// banner: null | { text, timer, duration }  (timer in seconds)
export function renderHUD(ctx, { score, lives, wave, banner }) {
  ctx.save();

  // Score — top left
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = CONFIG.COLOR_HUD;
  ctx.shadowBlur = 8;
  ctx.shadowColor = CONFIG.COLOR_HUD;
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${score}`, 20, 28);

  // Wave — top center
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE ${wave}`, CONFIG.CANVAS_WIDTH / 2, 28);

  // Lives — top right as small triangles
  const ts = 11; // triangle half-width
  const lifeSpacing = 28;
  const lifeY = 18;
  const lifeStartX = CONFIG.CANVAS_WIDTH - 20 - (lives - 1) * lifeSpacing;

  ctx.strokeStyle = CONFIG.COLOR_HUD;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < lives; i++) {
    const lx = lifeStartX + i * lifeSpacing;
    ctx.beginPath();
    ctx.moveTo(lx, lifeY - ts);
    ctx.lineTo(lx + ts, lifeY + ts);
    ctx.lineTo(lx - ts, lifeY + ts);
    ctx.closePath();
    ctx.stroke();
  }

  // Wave banner — centered, fades out
  if (banner && banner.timer > 0) {
    const fadeThreshold = banner.duration * 0.3;
    const alpha = banner.timer < fadeThreshold ? banner.timer / fadeThreshold : 1;
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = CONFIG.COLOR_BANNER;
    ctx.shadowBlur = 22;
    ctx.shadowColor = CONFIG.COLOR_BANNER;
    ctx.textAlign = 'center';
    ctx.fillText(banner.text, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 3);
  }

  ctx.restore();
}
```

- [ ] **Step 2: Create `src/audio.js`** (stub — wired in later iteration)

```javascript
// WebAudio sound synthesis — populated in a later iteration
export const audio = {
  shoot()     {},
  explode()   {},
  waveStart() {},
};
```

- [ ] **Step 3: Create `src/easter-eggs.js`** (stub — wired in later iteration)

```javascript
// All easter egg logic lives here — populated in a later iteration
export const easterEggs = {
  checkTitleScreenCode(_input) {},
  onWaveStart(_wave)           {},
  onPlayerShoot()              { return null; },
};
```

---

## Task 9: Game State Machine

**Files:**
- Create: `src/game.js`

- [ ] **Step 1: Create `src/game.js`**

```javascript
import { CONFIG }            from './config.js';
import { createPlayer }      from './player.js';
import { createFormation }   from './enemies.js';
import { createBulletPool }  from './bullets.js';
import { createParticleSystem } from './particles.js';
import { createStarfield }   from './starfield.js';
import { renderHUD }         from './hud.js';
import { easterEggs }        from './easter-eggs.js';

const STATE = { TITLE: 'title', PLAYING: 'playing', GAME_OVER: 'game_over' };

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');

  const starfield = createStarfield();
  const particles = createParticleSystem();
  const player    = createPlayer();
  const bullets   = createBulletPool();

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

  function startGame() {
    state     = STATE.PLAYING;
    score     = 0;
    lives     = CONFIG.STARTING_LIVES;
    wave      = 1;
    formation = createFormation(wave);
    bullets.clear();
    banner = makeBanner('Roll for initiative!');
    easterEggs.onWaveStart(wave);
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

    ctx.font = 'bold 66px monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#00f0ff';
    ctx.fillText('NEON', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 55);

    ctx.font = 'bold 66px monospace';
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ffd700';
    ctx.fillText('INITIATIVE', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 20);

    const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 420);
    ctx.globalAlpha = pulse;
    ctx.font = '21px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText('PRESS SPACE TO START', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 90);

    ctx.globalAlpha = 1;
    ctx.font = '15px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText('← → to move   ■ SPACE to fire', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 130);

    ctx.restore();
  }

  function renderGameOver() {
    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = 'bold 54px monospace';
    ctx.fillStyle = '#ff007a';
    ctx.shadowBlur = 22;
    ctx.shadowColor = '#ff007a';
    ctx.fillText('GAME OVER', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 20);

    ctx.font = '26px monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f0ff';
    ctx.fillText(`FINAL SCORE: ${score}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 40);

    const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 420);
    ctx.globalAlpha = pulse;
    ctx.font = '19px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
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

      easterEggs.checkTitleScreenCode(input);

      if (state === STATE.TITLE) {
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

      formation.update(dt);
      bullets.update(dt);

      const hits = bullets.checkCollisions(formation.getEnemyRects());
      for (const { enemy } of hits) {
        formation.kill(enemy.ref);
        particles.burst(enemy.x, enemy.y, CONFIG.COLOR_ENEMY);
        score += CONFIG.SCORE_PER_ENEMY;
      }

      if (formation.allDead()) {
        spawnNextWave();
        return;
      }

      // Enemies reached the bottom → lose a life
      if (formation.getEnemyRects().some(e => e.y + e.hh > CONFIG.ENEMY_DEATH_LINE)) {
        lives--;
        if (lives <= 0) {
          state = STATE.GAME_OVER;
        } else {
          formation = createFormation(wave);
          bullets.clear();
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
      renderHUD(ctx, { score, lives, wave, banner });

      if (state === STATE.GAME_OVER) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        renderGameOver();
      }
    },
  };
}
```

---

## Task 10: Entry Point + Game Loop

**Files:**
- Create: `src/main.js`

- [ ] **Step 1: Create `src/main.js`**

```javascript
import { CONFIG }     from './config.js';
import { createGame } from './game.js';
import { createInput } from './input.js';

const canvas = document.getElementById('canvas');
canvas.width  = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;

const input = createInput();
const game  = createGame(canvas);

let accumulator = 0;
let lastTime    = performance.now();

function loop(now) {
  const rawDt = (now - lastTime) / 1000;
  lastTime = now;

  // Cap to prevent spiral of death after tab switch / debugger pause
  accumulator += Math.min(rawDt, CONFIG.FIXED_STEP * CONFIG.MAX_STEPS);

  while (accumulator >= CONFIG.FIXED_STEP) {
    game.update(CONFIG.FIXED_STEP, input);
    input.update();
    accumulator -= CONFIG.FIXED_STEP;
  }

  game.render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
```

---

## Task 11: Integration Verification

- [ ] **Step 1: Open in browser and check the title screen**

Open `index.html` (or `http://localhost:8080`).
Expected:
- Black canvas, 800×600, neon border glow visible
- "NEON" in cyan and "INITIATIVE" in gold, both glowing
- "PRESS SPACE TO START" pulsing in/out
- Stars scrolling downward at three speeds

- [ ] **Step 2: Start the game and check wave 1**

Press Space.
Expected:
- "Roll for initiative!" banner appears center-screen in gold, stays ~2 s, fades out
- 8×4 formation of magenta hexagons with glow visible at top
- Formation drifts left/right as a unit and reverses at edges
- Player cyan triangle at bottom-center
- HUD shows SCORE: 0, WAVE 1, and 3 small triangle life icons top-right

- [ ] **Step 3: Test player movement**

Hold ← and →.
Expected: ship moves smoothly, cannot leave canvas bounds.

- [ ] **Step 4: Test shooting + collision + particles**

Press Space repeatedly.
Expected:
- White bullet segments fire from ship tip, travel upward
- When a bullet hits a hexagon: hexagon disappears, magenta particle burst expands from that point, score increments by 100
- Bullets that miss disappear off the top

- [ ] **Step 5: Test wave clear**

Destroy all 32 enemies (patience — or narrow the formation in config if testing).
Expected:
- "Roll for initiative!" banner re-appears with WAVE 2
- New full 8×4 formation spawns, slightly faster sway than wave 1

- [ ] **Step 6: Test game over**

Let the enemy formation reach y ≈ 510 (bottom zone) — easiest to test by temporarily setting `ENEMY_TOP_MARGIN: 400` in config.js, refreshing, and starting a game.
Expected:
- Life counter decrements
- At 0 lives → game over overlay: "GAME OVER", final score, pulsing "PRESS R TO RETURN TO TITLE"
- Press R → returns to title screen

- [ ] **Step 7: Restore `ENEMY_TOP_MARGIN` if changed**

Set it back to `80` in `src/config.js`.

- [ ] **Step 8: Commit**

```bash
git init
git add index.html style.css src/
git commit -m "feat: Neon Initiative MVP — player, 8×4 enemies, bullets, particles, starfield, wave banner"
```
