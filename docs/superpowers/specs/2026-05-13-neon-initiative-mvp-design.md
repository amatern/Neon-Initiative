# Neon Initiative — MVP Design Spec

**Date:** 2026-05-13  
**Scope:** Playable MVP — title screen through game over, no easter eggs, no sound, no bosses

---

## Overview

A browser-based Galaga-style fixed shooter built with vanilla HTML5 Canvas + ES modules. Visual style: vector/geometric neon on black. Built for Jonas and his D&D friends — wave-start banner reads "Roll for initiative!" The game is called **Neon Initiative**.

No build step. Open `index.html` in a browser and it runs.

---

## File Structure

```
/
├── index.html
├── style.css
├── src/
│   ├── main.js          # entry point, game loop
│   ├── game.js          # state machine + orchestration
│   ├── player.js        # player ship logic + rendering
│   ├── enemies.js       # 8×4 formation, group sway
│   ├── bullets.js       # player projectiles + collision
│   ├── particles.js     # explosion particles
│   ├── input.js         # keyboard state
│   ├── hud.js           # score, lives, wave, banner
│   ├── starfield.js     # scrolling background
│   ├── audio.js         # stub (future)
│   ├── easter-eggs.js   # stub (future)
│   └── config.js        # all tunable constants
└── CLAUDE.md
```

---

## Module Responsibilities

### `config.js`
All tunable constants. Nothing hardcoded in game logic.
- Canvas size (800×600)
- Colors: player cyan `#00f0ff`, enemy magenta `#ff007a`, bullet white `#ffffff`, star white
- Speeds: player px/s, bullet px/s, enemy sway px/s, star scroll speeds by tier
- Enemy grid: columns=8, rows=4, spacing, top margin
- Hitbox sizes for player and enemies
- Particle count, lifetime, speed range
- Lives starting count (3)
- Score per enemy (100)
- Wave banner duration (2000 ms)

### `main.js`
- Creates and sizes the `<canvas>`
- Fixed-timestep accumulator loop at 60 Hz (`FIXED_STEP = 1/60`)
- Max frame cap to prevent spiral of death (max 5 accumulated steps)
- Calls `game.update(dt)` and `game.render(ctx)` each frame

### `game.js`
State machine with three states: `title`, `playing`, `game_over`.
- Owns: score, lives, wave number, active enemies list, bullets pool, particles pool
- `title`: render title screen, wait for Space → transition to `playing`, spawn wave
- `playing`: update all subsystems; on all enemies dead → increment wave, show banner, spawn next wave; on lives=0 → transition to `game_over`
- `game_over`: render game over screen, wait for R → reset and return to `title`
- Spawns wave via `enemies.createFormation(wave)`

### `player.js`
Factory: `createPlayer(config)` → `{ update(dt, input), render(ctx), x, y, width, height }`
- Cyan triangle pointing upward, `shadowBlur` glow
- Moves left/right at `PLAYER_SPEED` px/s, clamped to canvas bounds
- Fires one bullet per spacebar press (not held — one-shot via `input.wasPressed`)
- No shooting while game is not in `playing` state (enforced by caller)

### `enemies.js`
Factory: `createFormation(wave, config)` → `{ update(dt), render(ctx), enemies[] }`
- 8 columns × 4 rows of enemies
- Each enemy: magenta hexagon with glow, AABB hitbox
- Whole formation drifts left/right as a single unit; reverses direction when leftmost/rightmost enemy reaches canvas edge padding
- Sway speed increases slightly each wave: `BASE_SWAY + (wave-1) * SWAY_INCREMENT`
- Dead enemies removed from array (splice on hit)

### `bullets.js`
Factory: `createBulletPool(config)` → `{ fire(x, y), update(dt), render(ctx), checkCollisions(enemies) → hits[] }`
- White line segments moving upward at `BULLET_SPEED` px/s
- Culled when `y < 0`
- `checkCollisions`: AABB each bullet vs. each enemy rect; returns array of `{bullet, enemy}` pairs and removes both

### `particles.js`
Factory: `createParticleSystem(config)` → `{ burst(x, y, color), update(dt), render(ctx) }`
- `burst`: spawns N particles at position with random velocity vectors, given color with glow
- Each particle: fades alpha over lifetime, removed when dead
- Used for enemy explosions (magenta) and future player death (cyan)

### `starfield.js`
Factory: `createStarfield(config)` → `{ update(dt), render(ctx) }`
- ~150 stars at random x/y, three brightness tiers (dim/mid/bright) with matching scroll speeds
- Scrolls downward, wraps to `y=0` when off bottom
- Rendered first (background layer)

### `hud.js`
`renderHUD(ctx, { score, lives, wave, banner, bannerTimer }, config)`
- Score: top-left, cyan text
- Lives: top-right as small cyan triangle icons
- Wave number: top-center
- Banner: centered vertically in upper third, large text **"Roll for initiative!"**, fades out over `BANNER_DURATION` ms
- No factory needed — pure render function called each frame

### `input.js`
`createInput()` → `{ isDown(key), wasPressed(key), update() }`
- Tracks `keydown`/`keyup` for `ArrowLeft`, `ArrowRight`, `Space`
- `wasPressed`: returns true once per keydown event (cleared in `update()` each frame)

### `easter-eggs.js` / `audio.js`
Empty stubs. Exported hooks present but no-ops. Wired in future iterations.

---

## Rendering Pipeline (per frame)

1. Clear canvas (black fill)
2. `starfield.render(ctx)`
3. `enemies.render(ctx)`
4. `player.render(ctx)`
5. `bullets.render(ctx)`
6. `particles.render(ctx)`
7. `hud.render(ctx, state)`

---

## Collision & Game Logic

- AABB collision: bullet rect vs. enemy rect
- Player hitbox: 70% of visual triangle bounding box (forgiving)
- Enemy hit → remove enemy, spawn particle burst, add 100 to score
- Wave clear → show "Roll for initiative!" banner → spawn next wave (enemies reset)
- Lives lost when... (enemy bullets not in MVP scope — lives only lost via direct enemy contact in a future iteration; for now lives are displayed but not decremented during MVP)

> **Note:** Enemy dive-bombing and contact damage are post-MVP. Lives display is implemented but only transitions on: player manually hit (future). For now the lives system is plumbed in and game_over is reachable via dev/testing.

---

## MVP Scope

**In:**
- Title → playing → game_over state machine
- 8×4 enemy formation with group sway
- Player movement + shooting
- Bullet/enemy collision, score, destruction particles
- Scrolling starfield
- "Roll for initiative!" wave-start banner
- HUD: score, lives (3), wave number

**Out (later iterations):**
- Enemy dive-bombing / contact damage
- Sound (WebAudio)
- Easter eggs
- Power-ups
- Boss waves
- Multiple enemy types
- High score persistence
