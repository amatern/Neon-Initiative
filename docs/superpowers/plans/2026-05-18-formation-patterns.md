# Formation Patterns + Conga Entry Animation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five new enemy formation shapes (diamond, arc, stagger, clusters, spiral) to normal waves, chosen randomly each wave, with a conga-line entry animation where enemies stream in along a Bezier curve and peel off to lock into their slots.

**Architecture:** Pure layout functions `(wave) => [{baseX, baseY}]` are added to `enemies.js` above `createFormation`. `pickLayout(wave)` randomly selects one. `createFormation` uses the layout for normal waves and adds per-enemy state (`entering → locking → active`) driven by a cubic Bezier conga path. Sway and dive-launch are gated behind `allActive()`. Seal and boss waves are unaffected.

**Tech Stack:** Vanilla JS ES modules, HTML5 Canvas 2D API

---

### Task 1: Config constants

**Files:**
- Modify: `src/config.js`

- [ ] **Step 1: Add entry animation constants**

In `src/config.js`, after the `COLOR_POWERUP_RAPIDFIRE` line and before the `// Particles` comment, insert:

```js
  // Formation entry animation
  ENTRY_STAGGER:      0.08,   // seconds between each enemy's launch onto the conga path
  ENTRY_TRAVEL_TIME:  1.4,    // seconds to traverse the full conga Bezier
  ENTRY_LOCK_SPEED:   280,    // px/s flying from peel-off point to formation slot
```

- [ ] **Step 2: Verify browser loads cleanly**

Open `index.html`. No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/config.js
git commit -m "feat: add formation entry animation constants to config"
```

---

### Task 2: Layout functions, bezierPoint, pickLayout

**Files:**
- Modify: `src/enemies.js`

All additions go **before** the `export function createFormation` line.

- [ ] **Step 1: Add bezierPoint helper and all layout functions**

Insert the following block immediately before `export function createFormation`:

```js
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
```

- [ ] **Step 2: Verify browser loads cleanly**

Open `index.html`. No console errors. Game plays normally (layout functions are defined but not yet called).

- [ ] **Step 3: Commit**

```bash
git add src/enemies.js
git commit -m "feat: add six formation layout functions and bezierPoint helper"
```

---

### Task 3: createFormation uses pickLayout

**Files:**
- Modify: `src/enemies.js`

- [ ] **Step 1: Replace base array construction**

In `createFormation`, find this block (lines ~84–101):

```js
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
```

Replace it with:

```js
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
    state: 'active',
    ex: baseX, ey: baseY,
  }));
```

- [ ] **Step 2: Verify in browser**

Open `index.html`. Start a game and play through several waves. Each wave should use a different formation shape (diamond, arc, spiral, etc. — you'll see them change). Seals and the beholder should still work normally. No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/enemies.js
git commit -m "feat: use random layout functions in createFormation — diamond, arc, stagger, clusters, spiral, grid"
```

---

### Task 4: Entry animation

**Files:**
- Modify: `src/enemies.js`

All changes are inside `createFormation`. Steps 1–2 are safe to do first because `state` is always `'active'` at this point.

- [ ] **Step 1: Update render() to use ex/ey for non-active enemies**

In `createFormation`'s `render` method, find:

```js
      drawFn(ctx, actualX(e), actualY(e), CONFIG.ENEMY_SIZE);
```

Replace with:

```js
      const ex = e.state === 'active' ? actualX(e) : e.ex;
      const ey = e.state === 'active' ? actualY(e) : e.ey;
      drawFn(ctx, ex, ey, CONFIG.ENEMY_SIZE);
```

- [ ] **Step 2: Update getEnemyRects() to use ex/ey for non-active enemies**

In `createFormation`'s `getEnemyRects` method, replace:

```js
    getEnemyRects() {
      const rects = base
        .filter(e => e.alive && !e.diving)
        .map(e => ({ x: actualX(e), y: actualY(e), hw: CONFIG.ENEMY_HITBOX, hh: CONFIG.ENEMY_HITBOX, ref: e }));
```

With:

```js
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
```

- [ ] **Step 3: Add Bezier control points and entry state setup to createFormation**

After the `const base = positions.map(...)` block and before `let groupOffsetX = 0`, insert:

```js
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
```

- [ ] **Step 4: Add allActive() and updateEntry() closures**

After the `doEntry` block and before the existing `function launchDive(playerX)`, insert:

```js
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
          const step = CONFIG.ENTRY_LOCK_SPEED * dt;
          e.ex += (dx / dist) * step;
          e.ey += (dy / dist) * step;
        }
      }
    }
  }
```

- [ ] **Step 5: Update update() to gate sway and dive on allActive()**

Replace the entire `update(dt, playerX)` method in the returned object with:

```js
    update(dt, playerX) {
      newDiveLaunched = false;
      const live = base.filter(e => e.alive);
      if (live.length === 0) return;

      // Advance entry animation while enemies are still settling in
      if (!allActive()) updateEntry(dt);

      // Sway — only once all enemies have locked into formation
      if (allActive()) {
        groupOffsetX += swaySpeed * dir * dt;
        const nonDiving = live.filter(e => !e.diving);
        if (nonDiving.length > 0) {
          const leftmost  = Math.min(...nonDiving.map(e => actualX(e)));
          const rightmost = Math.max(...nonDiving.map(e => actualX(e)));
          if (dir ===  1 && rightmost + CONFIG.ENEMY_SIZE >= CONFIG.CANVAS_WIDTH - CONFIG.ENEMY_EDGE_PADDING) dir = -1;
          if (dir === -1 && leftmost  - CONFIG.ENEMY_SIZE <= CONFIG.ENEMY_EDGE_PADDING)                       dir =  1;
        }
      }

      // Decoy flash timers — always
      for (const e of base) {
        if (e.flashTimer > 0) e.flashTimer -= dt;
      }

      // Dive launch — only once all enemies have locked into formation
      if (allActive()) {
        diveTimer -= dt;
        if (diveTimer <= 0) launchDive(playerX);
      }

      // Update active divers
      for (let i = divers.length - 1; i >= 0; i--) {
        if (updateDiver(divers[i], dt)) divers.splice(i, 1);
      }
    },
```

- [ ] **Step 6: Verify in browser**

Open `index.html`. Start a game. On wave 1:
- Enemies should stream in from the right (wave 1 is odd → fromLeft=false → right entry)
- They follow a curving arc across the top of the screen
- Each enemy peels off the path and flies to its formation slot
- Sway and dive-bombing begin only after the last enemy locks in
- Player can shoot enemies during the entry sequence

On wave 2, enemies stream from the left.

Test across multiple waves to confirm different formation shapes appear. Seal wave (wave 5) and Beholder (wave 10) should show no entry animation and use their normal grid.

- [ ] **Step 7: Commit**

```bash
git add src/enemies.js
git commit -m "feat: conga entry animation — enemies stream in and peel off to formation slots"
```

---

### Task 5: Push and play-test

- [ ] **Step 1: Push to GitHub Pages**

```bash
git push
```

- [ ] **Step 2: Hard-refresh the GitHub Pages URL (Ctrl+Shift+R)**

- [ ] **Step 3: Play through waves 1–6 and verify**

Check:
- Each wave starts with the entry animation (enemies streaming in)
- Entry alternates left/right side each wave
- Six distinct formation shapes appear across waves
- Enemies can be shot during entry
- After all enemies lock in, sway starts and dive-bombing begins
- Wave clear, game over, and restart all work normally
- Powerup drops still work during entry (enemies die and drop items)
