# Dive-Bombing + JONAS/CHAD Easter Eggs — Design Spec

**Date:** 2026-05-14  
**Scope:** Enemy dive-bombing with loop-back, JONAS title-screen code (gold ship), CHAD title-screen code (D&D dice rolls)

---

## Overview

Two features added to the existing Neon Initiative MVP. Dive-bombing makes the game genuinely threatening by having enemies leave the formation and attack the player. The easter egg codes are a core personality feature — JONAS/CHAD are entered on the title screen and persist for the session.

---

## Feature 1: Dive-Bombing

### Architecture

All dive logic lives in `enemies.js`. `game.js` gains one new collision check. `config.js` gains dive-tuning constants.

### Diver State Machine

Each diver is an object separate from the base formation array:

```
{ ref, x, y, vx, vy, phase, state }
```

- `ref` — pointer to the base enemy entry (used to sync alive/diving status and get slot position)
- `phase` — sine oscillation for wobble
- `state` — one of: `'DIVING'` | `'LOOPING'` | `'RETURNING'`

**DIVING**
- Captures `targetX = player.x` at launch time (not tracked continuously — dodge-able)
- `vx` steers toward `targetX` each frame (`vx += (targetX - x) * DIVE_STEER * dt`)
- `vy` accelerates downward: `vy += DIVE_ACCEL * dt`, capped at `DIVE_MAX_SPEED`
- Sine wobble applied to `x`: `x += sin(phase) * DIVE_WOBBLE_AMP; phase += DIVE_WOBBLE_SPEED * dt`
- Transition → LOOPING when `y > CANVAS_HEIGHT * 0.78`

**LOOPING**
- `vy -= LOOP_ACCEL * dt` (strong upward acceleration reverses direction)
- `vx` maintained (lateral drift keeps the loop shape)
- Transition → RETURNING when `y < -ENEMY_SIZE * 2` (off top of canvas)
- On transition: set `y = -ENEMY_SIZE * 2`, `vy = RETURN_SPEED`, `vx = 0`

**RETURNING**
- Each frame: compute vector toward current slot position `(ref.baseX + groupOffsetX, ref.baseY)`
- Move at `RETURN_SPEED` toward that point (slot moves with sway — diver tracks it)
- When `dist < RETURN_SNAP_DIST`: snap diver to slot, mark `ref.diving = false`, remove from `divers[]`

### Dive Launch Timer

- `diveTimer` counts down from a random value in `[DIVE_INTERVAL - VARIANCE, DIVE_INTERVAL + VARIANCE]`
- On fire: pick a random live, non-diving enemy; mark `ref.diving = true`; push new diver to `divers[]`; reset timer
- Capped at `DIVE_MAX_SIMULTANEOUS` active divers

### Interface Changes

| Method | Change |
|--------|--------|
| `formation.update(dt)` | → `formation.update(dt, playerX)` |
| `formation.getEnemyRects()` | Now includes divers (shootable mid-dive) at actual `(x, y)` |
| `formation.getDiverRects()` | New — returns diver positions for player collision |
| `formation.render(ctx)` | Formation enemies skip rendering if `ref.diving === true`; divers rendered separately in `#ff4444` |

### game.js Changes

- `formation.update(dt, player.x)` (add playerX arg)
- New collision check each frame:
  ```
  for each diver rect:
    if overlaps player hitbox:
      destroy diver (mark ref.alive = false, remove from divers[])
      particles.burst at diver position
      lives--
      if lives <= 0 → GAME_OVER
  ```
- Remove the old "enemies reached death line" lives check — dive-bombing makes that mechanic redundant

### New Config Constants

```
DIVE_INTERVAL: 3.5          // seconds between dive attempts
DIVE_INTERVAL_VARIANCE: 1.0 // ±seconds random variance
DIVE_MAX_SIMULTANEOUS: 2    // max active divers at once
DIVE_ACCEL: 180             // downward acceleration (px/s²)
DIVE_MAX_SPEED: 380         // max downward speed (px/s)
DIVE_STEER: 2.5             // lateral steering strength toward targetX
DIVE_WOBBLE_AMP: 18         // sine wobble amplitude (px)
DIVE_WOBBLE_SPEED: 5.0      // sine wobble frequency (rad/s)
LOOP_ACCEL: 600             // upward acceleration during loop phase (px/s²)
RETURN_SPEED: 260           // speed during return-to-formation (px/s)
RETURN_SNAP_DIST: 14        // snap distance to rejoin formation (px)
COLOR_DIVER: '#ff4444'      // distinct color for diving enemies
```

---

## Feature 2: JONAS + CHAD Easter Eggs

### Architecture

`easter-eggs.js` expands from a stub into a self-contained module. It adds its own `keydown` listener — no dependency on `input.js`. `game.js` and `hud.js` read exported state via getters.

### Key Buffer Detection

```javascript
let keyBuffer = '';
window.addEventListener('keydown', e => {
  if (e.key.length === 1) {
    keyBuffer = (keyBuffer + e.key.toUpperCase()).slice(-10);
  }
});

// Called only from the title-state block in game.js
function checkTitleScreenCode() {
  if (keyBuffer.includes('JONAS')) { jonasActive = true; keyBuffer = ''; }
  if (keyBuffer.includes('CHAD'))  { chadActive  = true; keyBuffer = ''; }
}
```

The listener accumulates keypresses at all times, but activation only happens inside `checkTitleScreenCode()`, which `game.js` calls exclusively from the title-state block. Typing the codes during gameplay fills the buffer but never triggers activation.

### JONAS Effect

- `jonasActive` boolean in `easter-eggs.js`
- `game.js` calls `player.setColor('#ffd700')` inside `startGame()` when `easterEggs.jonasActive` is true
- Persists for the whole session (same player object, setColor not reset on game restart)

### CHAD Mode — Dice Rolls

`easterEggs.rollForHit()` returns `{ roll }` (integer 1–20):

| Roll | Effect |
|------|--------|
| 1 | Enemy survives, no score. Notification: "NAT 1" in grey |
| 2–19 | Normal kill, +100 score |
| 20 | Kill, +2000 bonus score, double-size particle burst. Notification: "NAT 20!" in gold |

Called in `game.js` for every bullet–enemy collision when `easterEggs.chadActive` is true.

### Floating Notifications

New `notifications[]` array in `game.js`:

```
{ text, x, y, vy, color, timer, maxTimer }
```

- `vy = -60` (floats upward)
- `timer` counts down from 1.5s; `alpha = timer / maxTimer`
- Rendered after particles, before HUD
- "NAT 20!" in `#ffd700`, "NAT 1" in `#888888`
- Positioned at the hit enemy's (x, y)

### HUD D20 Icon

`renderHUD` gains a `chadActive` boolean parameter. When true, draws a small vector D20 indicator in the top-left (next to the score): a small equilateral triangle outline with "20" centered inside, in `#ffd700` with glow.

### Modified Hook Placement in game.js

`easterEggs.checkTitleScreenCode()` moves from the top of `update()` into the `STATE.TITLE` block:

```javascript
if (state === STATE.TITLE) {
  easterEggs.checkTitleScreenCode(); // was: called every frame regardless of state
  if (input.wasPressed('Space')) startGame();
  return;
}
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/config.js` | Add dive constants, `COLOR_DIVER`, `COLOR_JONAS: '#ffd700'` |
| `src/enemies.js` | Add diver state machine, `getDiverRects()`, update `getEnemyRects()` and `render()` |
| `src/easter-eggs.js` | Full implementation: key buffer, `jonasActive`, `chadActive`, `rollForHit()`, `isChadActive()` |
| `src/game.js` | Diver–player collision, `player.setColor` for JONAS, CHAD roll logic, notifications array, `easterEggs.checkTitleScreenCode()` moved |
| `src/hud.js` | D20 icon, `chadActive` param |

No new files needed.
